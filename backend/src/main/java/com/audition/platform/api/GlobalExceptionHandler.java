package com.audition.platform.api;

import com.audition.platform.api.dto.ApiFailResponse;
import com.audition.platform.api.dto.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.validation.ObjectError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<?> handleResponseStatus(ResponseStatusException ex, HttpServletRequest request) {
        log.warn("ResponseStatusException on {} {}: {}", request.getMethod(), request.getRequestURI(), ex.getReason(), ex);
        HttpStatusCode status = ex.getStatusCode();
        String reasonPhrase = (status instanceof HttpStatus)
                ? ((HttpStatus) status).getReasonPhrase()
                : status.toString();
        String message = ex.getReason() != null ? ex.getReason() : reasonPhrase;
        if (useSsotEnvelope(request)) {
            return ResponseEntity.status(status).body(new ApiFailResponse(message));
        }
        return ResponseEntity.status(status).body(
                new ErrorResponse(String.valueOf(status.value()), message, request.getRequestURI(), Instant.now())
        );
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest request) {
        List<String> parts = new ArrayList<>();
        for (FieldError fe : ex.getBindingResult().getFieldErrors()) {
            parts.add(formatFieldError(fe));
        }
        for (ObjectError oe : ex.getBindingResult().getGlobalErrors()) {
            String m = oe.getDefaultMessage();
            parts.add(m != null && !m.isBlank() ? m : oe.getObjectName());
        }
        String message = parts.stream().filter(s -> s != null && !s.isBlank()).collect(Collectors.joining("; "));
        if (message.isBlank()) {
            message = "입력 값을 확인해 주세요.";
        }
        log.warn("Validation failed on {} {}: {}", request.getMethod(), request.getRequestURI(), message);
        if (useSsotEnvelope(request)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiFailResponse(message));
        }
        return ResponseEntity.unprocessableEntity().body(
                new ErrorResponse("422", message, request.getRequestURI(), Instant.now())
        );
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrity(DataIntegrityViolationException ex, HttpServletRequest request) {
        String message = "Data integrity violation";
        Throwable root = ex.getMostSpecificCause();
        if (root != null && root.getMessage() != null && root.getMessage().toLowerCase().contains("email")) {
            message = "Email already registered";
        }
        log.error("DataIntegrityViolation on {} {}: {}", request.getMethod(), request.getRequestURI(), message, ex);
        return ResponseEntity.status(HttpStatus.CONFLICT).body(
                new ErrorResponse("409", message, request.getRequestURI(), Instant.now())
        );
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<?> handleUnreadableMessage(HttpMessageNotReadableException ex, HttpServletRequest request) {
        String message = "Invalid JSON payload";
        Throwable root = ex.getMostSpecificCause();
        if (root != null && root.getMessage() != null) {
            String rootMsg = root.getMessage();
            if (rootMsg.contains("double-quote to start field name")) {
                message = "Invalid JSON payload: field names must be in double quotes";
            } else if (rootMsg.contains("Cannot deserialize value")) {
                message = "Invalid JSON payload: check field types and enum values";
            }
        }
        log.warn("HttpMessageNotReadable on {} {}: {}", request.getMethod(), request.getRequestURI(), message, ex);
        if (useSsotEnvelope(request)) {
            return ResponseEntity.badRequest().body(new ApiFailResponse(message));
        }
        return ResponseEntity.badRequest().body(
                new ErrorResponse("400", message, request.getRequestURI(), Instant.now())
        );
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleException(Exception ex, HttpServletRequest request) {
        log.error("Unhandled exception on {} {}", request.getMethod(), request.getRequestURI(), ex);
        String uri = request.getRequestURI();
        if (uri != null && uri.startsWith("/api/uploads/")) {
            String message = extractRootMessage(ex);
            if (message.isBlank()) {
                message = "이미지 업로드에 실패했습니다.";
            }
            if (useSsotEnvelope(request)) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ApiFailResponse(message));
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    new ErrorResponse("500", message, request.getRequestURI(), Instant.now())
            );
        }
        String message = extractRootMessage(ex);
        if (message.isBlank()) {
            message = "Internal server error";
        }
        if (useSsotEnvelope(request)) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ApiFailResponse(message));
        }
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                new ErrorResponse("500", message, request.getRequestURI(), Instant.now())
        );
    }

    /**
     * 가장 안쪽 cause의 메시지를 우선하고, 없으면 체인을 따라 첫 비어 있지 않은 메시지를 반환.
     * AWS SDK 등 래핑 예외에서 실제 API 오류 문구를 노출할 때 사용.
     */
    private static String extractRootMessage(Throwable e) {
        if (e == null) {
            return "";
        }
        Throwable root = e;
        while (root.getCause() != null) {
            root = root.getCause();
        }
        String fromRoot = root.getMessage();
        if (fromRoot != null && !fromRoot.isBlank()) {
            return fromRoot.trim();
        }
        Throwable t = e;
        while (t != null) {
            String m = t.getMessage();
            if (m != null && !m.isBlank()) {
                return m.trim();
            }
            t = t.getCause();
        }
        return "";
    }

    private String formatFieldError(FieldError fieldError) {
        String field = fieldError.getField();
        String defaultMessage = fieldError.getDefaultMessage() == null ? "유효하지 않습니다." : fieldError.getDefaultMessage();
        Object rej = fieldError.getRejectedValue();
        if (rej != null && !(rej instanceof String s && s.isBlank())) {
            String snippet = String.valueOf(rej);
            if (snippet.length() > 80) {
                snippet = snippet.substring(0, 80) + "…";
            }
            return field + ": " + defaultMessage + " (입력: \"" + snippet + "\")";
        }
        return field + ": " + defaultMessage;
    }

    /** /api/me/* 및 GET /api/auth/me — 프론트 SSOT 실패 포맷 */
    private static boolean useSsotEnvelope(HttpServletRequest request) {
        String uri = request.getRequestURI();
        boolean agencyApplicants = uri.contains("/api/auditions/") && uri.contains("/applications");
        boolean auditionVotes = uri.contains("/api/auditions/") && uri.endsWith("/votes");
        boolean auditionRanking = uri.contains("/api/auditions/") && uri.endsWith("/ranking");
        boolean votesMutations = uri.equals("/api/votes") || uri.startsWith("/api/votes/");
        boolean appStatusPatch = uri.contains("/api/applications/") && uri.endsWith("/status");
        boolean appViewBump = uri.contains("/api/applications/") && uri.endsWith("/view");
        boolean appPublicDetail = uri.contains("/api/applications/") && uri.endsWith("/public");
        boolean appListPublic = "/api/applications".equals(uri);
        boolean commentsPath = "/api/comments".equals(uri);
        boolean likesPath = "/api/likes".equals(uri) || uri.startsWith("/api/likes/");
        boolean creditsPath = uri.startsWith("/api/credits");
        boolean adminApiPath = uri.startsWith("/api/admin/");
        boolean uploadsPath = uri.startsWith("/api/uploads/");
        boolean channelVideosApi = uri.startsWith("/api/videos");
        boolean subscribeApi = "/api/subscribe".equals(uri);
        String method = request.getMethod() != null ? request.getMethod() : "";
        boolean auditionDetailById = isGetAuditionDetailById(uri, method);
        return uri.contains("/api/me/")
                || uri.endsWith("/api/me")
                || uri.contains("/api/auth/me")
                || agencyApplicants
                || auditionVotes
                || auditionRanking
                || votesMutations
                || appStatusPatch
                || appViewBump
                || appPublicDetail
                || (appListPublic && "GET".equalsIgnoreCase(method))
                || (commentsPath && ("GET".equalsIgnoreCase(method) || "POST".equalsIgnoreCase(method)))
                || likesPath
                || creditsPath
                || adminApiPath
                || uploadsPath
                || channelVideosApi
                || subscribeApi
                || auditionDetailById;
    }

    /** GET /api/auditions/{uuid} 단건(하위 경로 없음) — SSOT 실패 포맷 */
    private static boolean isGetAuditionDetailById(String uri, String method) {
        if (uri == null || !"GET".equalsIgnoreCase(method)) {
            return false;
        }
        if (!uri.startsWith("/api/auditions/")) {
            return false;
        }
        if (uri.endsWith("/my") || uri.endsWith("/mine")) {
            return false;
        }
        String tail = uri.substring("/api/auditions/".length());
        return !tail.contains("/");
    }
}
