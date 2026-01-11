package com.audition.platform.application.service;

import com.audition.platform.application.dto.UploadImageResponse;
import com.audition.platform.infrastructure.storage.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class MediaService {

    private final FileStorageService fileStorageService;

    /**
     * 단일 이미지 업로드
     */
    public UploadImageResponse uploadImage(MultipartFile file, Long userId) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("파일이 없습니다");
        }

        try {
            String imageUrl = fileStorageService.uploadImage(file, userId);
            // 실제 환경에서는 imageKey도 반환 (나중에 삭제용)
            String imageKey = extractKeyFromUrl(imageUrl);
            return UploadImageResponse.builder()
                    .imageUrl(imageUrl)
                    .imageKey(imageKey)
                    .build();
        } catch (IOException e) {
            throw new RuntimeException("이미지 업로드 실패: " + e.getMessage(), e);
        }
    }

    /**
     * 여러 이미지 업로드
     */
    public List<UploadImageResponse> uploadImages(MultipartFile[] files, Long userId) {
        if (files == null || files.length == 0) {
            throw new IllegalArgumentException("파일이 없습니다");
        }

        List<UploadImageResponse> responses = new ArrayList<>();
        for (MultipartFile file : files) {
            if (file != null && !file.isEmpty()) {
                responses.add(uploadImage(file, userId));
            }
        }
        return responses;
    }

    /**
     * 이미지 삭제
     */
    public void deleteImage(String imageKey, Long userId) {
        try {
            // imageKey는 전체 URL이거나 경로일 수 있음
            String url = imageKey;
            if (!imageKey.startsWith("http")) {
                // 상대 경로인 경우 base URL 추가
                url = extractUrlFromKey(imageKey);
            }
            fileStorageService.deleteFile(url);
        } catch (Exception e) {
            throw new RuntimeException("이미지 삭제 실패: " + e.getMessage(), e);
        }
    }

    private String extractKeyFromUrl(String url) {
        // URL에서 키 추출 (예: /images/123/uuid.jpg -> images/123/uuid.jpg)
        if (url == null || url.isEmpty()) {
            return null;
        }
        int index = url.indexOf("/images/");
        if (index == -1) {
            index = url.indexOf("/videos/");
        }
        if (index == -1) {
            return null;
        }
        return url.substring(index + 1);
    }

    private String extractUrlFromKey(String key) {
        // 실제 환경에서는 base URL을 설정에서 가져옴
        return "http://localhost:8083/api/v1/media/" + key;
    }
}
