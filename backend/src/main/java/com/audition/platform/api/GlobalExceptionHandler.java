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
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
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
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(this::formatFieldError)
                .collect(Collectors.joining(", "));
        if (message.isBlank()) {
            message = "Validation failed";
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
    public ResponseEntity<ErrorResponse> handleException(Exception ex, HttpServletRequest request) {
        log.error("Unhandled exception on {} {}", request.getMethod(), request.getRequestURI(), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                new ErrorResponse("500", "Internal server error", request.getRequestURI(), Instant.now())
        );
    }

    private String formatFieldError(FieldError fieldError) {
        String defaultMessage = fieldError.getDefaultMessage() == null ? "is invalid" : fieldError.getDefaultMessage();
        return fieldError.getField() + " " + defaultMessage;
    }

    /** /api/me/* 및 GET /api/auth/me — 프론트 SSOT 실패 포맷 */
    private static boolean useSsotEnvelope(HttpServletRequest request) {
        String uri = request.getRequestURI();
        boolean agencyApplicants = uri.contains("/api/auditions/") && uri.contains("/applications");
        boolean auditionVotes = uri.contains("/api/auditions/") && uri.endsWith("/votes");
        boolean auditionRanking = uri.contains("/api/auditions/") && uri.endsWith("/ranking");
        boolean votesMutations = uri.equals("/api/votes") || uri.startsWith("/api/votes/");
        boolean appStatusPatch = uri.contains("/api/applications/") && uri.endsWith("/status");
        return uri.contains("/api/me/")
                || uri.endsWith("/api/me")
                || uri.contains("/api/auth/me")
                || agencyApplicants
                || auditionVotes
                || auditionRanking
                || votesMutations
                || appStatusPatch;
    }
}
