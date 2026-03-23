package com.audition.platform.api;

import com.audition.platform.api.dto.ImageUploadResponse;
import com.audition.platform.application.storage.ImageUploadDirectory;
import com.audition.platform.application.storage.S3ImageUploadService;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

/**
 * multipart 파일 업로드 → S3 저장 후 공개 URL 반환.
 */
@RestController
@RequestMapping("/api/uploads")
public class ImageUploadController {

    private final ObjectProvider<S3ImageUploadService> uploadService;

    public ImageUploadController(ObjectProvider<S3ImageUploadService> uploadService) {
        this.uploadService = uploadService;
    }

    @PostMapping(value = "/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ImageUploadResponse uploadImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "dir", required = false, defaultValue = "covers") String dir
    ) {
        S3ImageUploadService svc = uploadService.getIfAvailable();
        if (svc == null) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "이미지 업로드가 구성되지 않았습니다. app.s3.bucket 및 AWS 자격 증명을 설정하세요."
            );
        }
        return new ImageUploadResponse(svc.upload(file, ImageUploadDirectory.fromParam(dir)));
    }
}
