package com.audition.platform.api;

import com.audition.platform.api.dto.ImageUploadResponse;
import com.audition.platform.application.storage.ImageUploadDirectory;
import com.audition.platform.application.storage.S3ImageUploadService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
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
 * multipart 파일 업로드 → S3 저장 후 공개 URL 반환.
 */
@RestController
@RequestMapping("/api/uploads")
public class ImageUploadController {

    private static final Logger log = LoggerFactory.getLogger(ImageUploadController.class);

    private final ObjectProvider<S3ImageUploadService> uploadService;
    private final Environment environment;

    public ImageUploadController(ObjectProvider<S3ImageUploadService> uploadService, Environment environment) {
        this.uploadService = uploadService;
        this.environment = environment;
    }

    /**
     * S3 설정·빈 등록 여부 진단 (버킷/리전은 항상 설정값 기준).
     */
    @GetMapping("/health")
    public Map<String, String> uploadHealth() {
        String bucket = environment.getProperty("app.s3.bucket", "");
        String region = environment.getProperty("app.s3.region", "");
        boolean ready = uploadService.getIfAvailable() != null;
        Map<String, String> body = new LinkedHashMap<>();
        body.put("bucket", bucket);
        body.put("region", region);
        body.put("status", ready ? "OK" : "UNAVAILABLE");
        return body;
    }

    @PostMapping(value = "/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "dir", required = false, defaultValue = "covers") String dir
    ) {
        S3ImageUploadService svc = uploadService.getIfAvailable();
        if (svc == null) {
            log.warn(
                    "POST /api/uploads/image rejected (503): S3 not configured — set AWS_BUCKET, AWS_REGION, and IAM keys on the server."
            );
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of(
                    "error", "IMAGE_UPLOAD_UNAVAILABLE",
                    "message", "이미지 업로드가 구성되지 않았습니다. AWS_BUCKET·AWS_REGION·자격 증명을 설정하세요."
            ));
        }

        final ImageUploadDirectory directory;
        try {
            directory = ImageUploadDirectory.fromParam(dir);
        } catch (ResponseStatusException e) {
            throw e;
        }

        try {
            String url = svc.upload(file, directory);
            return ResponseEntity.ok(new ImageUploadResponse(url));
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("이미지 업로드 API 실패", e);
            String message = e.getMessage() != null && !e.getMessage().isBlank()
                    ? e.getMessage()
                    : "이미지 업로드에 실패했습니다.";
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of(
                    "error", "IMAGE_UPLOAD_FAILED",
                    "message", message
            ));
        }
    }
}
