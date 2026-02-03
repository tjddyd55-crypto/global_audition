package com.audition.platform.presentation.controller;

import com.audition.platform.application.dto.UploadImageResponse;
import com.audition.platform.application.service.MediaService;
import com.audition.platform.infrastructure.security.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/media")
@RequiredArgsConstructor
@Tag(name = "Media Upload", description = "미디어 파일 업로드 API")
public class MediaController {

    private final MediaService mediaService;
    private final SecurityUtils securityUtils;

    @PostMapping("/upload/image")
    @Operation(summary = "이미지 파일 업로드")
    public ResponseEntity<UploadImageResponse> uploadImage(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam("file") MultipartFile file
    ) {
        Long userId = securityUtils.getUserIdFromAuthHeaderOrThrow(authHeader);
        UploadImageResponse response = mediaService.uploadImage(file, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/upload/images")
    @Operation(summary = "여러 이미지 파일 업로드 (최대 10개)")
    public ResponseEntity<java.util.List<UploadImageResponse>> uploadImages(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam("files") MultipartFile[] files
    ) {
        Long userId = securityUtils.getUserIdFromAuthHeaderOrThrow(authHeader);
        if (files.length > 10) {
            throw new IllegalArgumentException("최대 10개의 이미지만 업로드할 수 있습니다");
        }
        java.util.List<UploadImageResponse> responses = mediaService.uploadImages(files, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(responses);
    }

    @DeleteMapping("/delete/{imageKey}")
    @Operation(summary = "이미지 파일 삭제")
    public ResponseEntity<Void> deleteImage(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable String imageKey
    ) {
        Long userId = securityUtils.getUserIdFromAuthHeaderOrThrow(authHeader);
        mediaService.deleteImage(imageKey, userId);
        return ResponseEntity.noContent().build();
    }
}
