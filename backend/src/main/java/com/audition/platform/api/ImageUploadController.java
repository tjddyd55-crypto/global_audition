package com.audition.platform.api;

import com.audition.platform.api.dto.ImageUploadResponse;
import com.audition.platform.application.storage.ImageUploadDirectory;
import com.audition.platform.application.storage.S3ImageUploadService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.core.env.Environment;
import org.springframework.http.MediaType;
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
    public ImageUploadResponse uploadImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "dir", required = false, defaultValue = "covers") String dir
    ) {
        S3ImageUploadService s3ImageUploadService = uploadService.getIfAvailable();
        if (s3ImageUploadService == null) {
            log.error("POST /api/uploads/image: S3ImageUploadService 빈 없음 — S3Client 미등록 여부 확인");
            throw new IllegalStateException("S3 서비스 초기화 실패");
        }

        ImageUploadDirectory directory;
        try {
            directory = ImageUploadDirectory.fromParam(dir);
        } catch (ResponseStatusException e) {
            throw e;
        }

        try {
            return new ImageUploadResponse(s3ImageUploadService.upload(file, directory));
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("이미지 업로드 API 실패", e);
            throw new RuntimeException("S3 upload failed", e);
        }
    }
}
