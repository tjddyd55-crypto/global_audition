package com.audition.platform.api;

import com.audition.platform.api.dto.ImageUploadResponse;
import com.audition.platform.application.storage.ImageContentTypes;
import com.audition.platform.application.storage.ImageUploadDirectory;
import com.audition.platform.application.storage.R2ImageUploadService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 이미지 업로드 고정 경로: <strong>클라이언트 → 이 API → R2</strong>.
 * 에러 응답은 항상 JSON <code>{"message":"..."}</code> 로 통일합니다.
 */
@RestController
@RequestMapping("/api/uploads")
public class ImageUploadController {

    private static final Logger log = LoggerFactory.getLogger(ImageUploadController.class);

    private final ObjectProvider<R2ImageUploadService> uploadService;
    private final Environment environment;

    public ImageUploadController(ObjectProvider<R2ImageUploadService> uploadService, Environment environment) {
        this.uploadService = uploadService;
        this.environment = environment;
    }

    @GetMapping("/health")
    public Map<String, String> uploadHealth() {
        String bucket = environment.getProperty("app.r2.bucket", "");
        String publicUrl = environment.getProperty("app.r2.public-url", "");
        boolean ready = uploadService.getIfAvailable() != null;
        Map<String, String> body = new LinkedHashMap<>();
        body.put("bucket", bucket);
        body.put("publicUrl", publicUrl);
        body.put("storage", "r2");
        body.put("status", ready ? "OK" : "UNAVAILABLE");
        return body;
    }

    @PostMapping(value = "/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadImage(
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "dir", required = false, defaultValue = "audition") String dir
    ) {
        try {
            if (file == null || file.isEmpty()) {
                return jsonMessage(HttpStatus.BAD_REQUEST, "업로드할 파일(file)이 없거나 비어 있습니다.");
            }
            if (!ImageContentTypes.isAllowed(file.getContentType())) {
                return jsonMessage(HttpStatus.BAD_REQUEST, "이미지 파일만 업로드 가능합니다 (JPEG, PNG, WebP).");
            }

            R2ImageUploadService r2ImageUploadService = uploadService.getIfAvailable();
            if (r2ImageUploadService == null) {
                log.error("POST /api/uploads/image: R2ImageUploadService 빈 없음 — r2S3Client·R2 환경변수 확인");
                return jsonMessage(HttpStatus.SERVICE_UNAVAILABLE, "R2 이미지 업로드 서비스를 사용할 수 없습니다.");
            }

            ImageUploadDirectory directory = ImageUploadDirectory.fromParam(dir);
            String url = r2ImageUploadService.upload(file, directory);
            return ResponseEntity.ok(new ImageUploadResponse(url));
        } catch (ResponseStatusException e) {
            HttpStatusCode code = e.getStatusCode();
            String msg = e.getReason() != null ? e.getReason() : "요청을 처리할 수 없습니다.";
            return jsonMessage(code, msg);
        } catch (Exception e) {
            e.printStackTrace();
            log.error("POST /api/uploads/image 처리 중 오류", e);
            String msg = e.getMessage() != null ? e.getMessage() : "업로드 처리 중 오류가 발생했습니다.";
            return jsonMessage(HttpStatus.INTERNAL_SERVER_ERROR, msg);
        }
    }

    private static ResponseEntity<Map<String, String>> jsonMessage(HttpStatusCode status, String message) {
        return ResponseEntity.status(status)
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("message", message));
    }
}
