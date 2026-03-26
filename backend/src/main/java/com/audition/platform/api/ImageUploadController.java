package com.audition.platform.api;

import com.audition.platform.api.dto.ImageUploadResponse;
import com.audition.platform.application.storage.ImageUploadDirectory;
import com.audition.platform.application.storage.R2ImageUploadService;
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
 * 이미지 업로드 고정 경로: <strong>클라이언트 → 이 API → R2</strong>.
 * 프론트에서 R2 엔드포인트·presigned URL로 직접 업로드하지 않습니다.
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

    /**
     * R2 설정·빈 등록 여부 진단.
     */
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
    public ImageUploadResponse uploadImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "dir", required = false, defaultValue = "covers") String dir
    ) {
        R2ImageUploadService r2ImageUploadService = uploadService.getIfAvailable();
        if (r2ImageUploadService == null) {
            log.error("POST /api/uploads/image: R2ImageUploadService 빈 없음 — r2S3Client·R2 환경변수 확인");
            throw new IllegalStateException("R2 이미지 업로드 서비스 초기화 실패");
        }

        ImageUploadDirectory directory;
        try {
            directory = ImageUploadDirectory.fromParam(dir);
        } catch (ResponseStatusException e) {
            throw e;
        }

        try {
            return new ImageUploadResponse(r2ImageUploadService.upload(file, directory));
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("R2 업로드 실패", e);
            throw new RuntimeException("R2 upload failed: " + e.getMessage(), e);
        }
    }
}
