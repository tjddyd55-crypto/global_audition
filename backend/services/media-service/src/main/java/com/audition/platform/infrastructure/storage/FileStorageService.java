package com.audition.platform.infrastructure.storage;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {

    @Value("${file.upload.image.dir:./uploads/images}")
    private String imageUploadDir;

    @Value("${file.upload.video.dir:./uploads/videos}")
    private String videoUploadDir;

    @Value("${file.upload.base-url:http://localhost:8083/api/v1/media}")
    private String baseUrl;

    /**
     * 이미지 파일 업로드
     */
    public String uploadImage(MultipartFile file, Long userId) throws IOException {
        // 파일 확장자 검증
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isEmpty()) {
            throw new IllegalArgumentException("파일명이 없습니다");
        }

        String extension = getFileExtension(originalFilename);
        if (!isValidImageExtension(extension)) {
            throw new IllegalArgumentException("지원하지 않는 이미지 형식입니다: " + extension);
        }

        // 업로드 디렉토리 생성
        Path uploadPath = Paths.get(imageUploadDir, userId.toString());
        Files.createDirectories(uploadPath);

        // 고유 파일명 생성
        String filename = UUID.randomUUID().toString() + extension;
        Path filePath = uploadPath.resolve(filename);

        // 파일 저장
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        // URL 반환 (실제 환경에서는 CDN URL)
        return baseUrl + "/images/" + userId + "/" + filename;
    }

    /**
     * 비디오 파일 업로드
     */
    public String uploadVideo(MultipartFile file, Long userId) throws IOException {
        // 파일 확장자 검증
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isEmpty()) {
            throw new IllegalArgumentException("파일명이 없습니다");
        }

        String extension = getFileExtension(originalFilename);
        if (!isValidVideoExtension(extension)) {
            throw new IllegalArgumentException("지원하지 않는 비디오 형식입니다: " + extension);
        }

        // 업로드 디렉토리 생성
        Path uploadPath = Paths.get(videoUploadDir, userId.toString());
        Files.createDirectories(uploadPath);

        // 고유 파일명 생성
        String filename = UUID.randomUUID().toString() + extension;
        Path filePath = uploadPath.resolve(filename);

        // 파일 저장
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        // URL 반환 (실제 환경에서는 CDN URL 또는 스트리밍 URL)
        return baseUrl + "/videos/" + userId + "/" + filename;
    }

    /**
     * 파일 삭제
     */
    public void deleteFile(String fileUrl) throws IOException {
        // URL에서 파일 경로 추출
        if (fileUrl == null || fileUrl.isEmpty()) {
            return;
        }

        // baseUrl 제거 후 경로 추출
        String relativePath = fileUrl.replace(baseUrl + "/", "");
        Path filePath = Paths.get(imageUploadDir).getParent().resolve(relativePath);

        if (Files.exists(filePath)) {
            Files.delete(filePath);
        }
    }

    private String getFileExtension(String filename) {
        int lastDot = filename.lastIndexOf('.');
        if (lastDot == -1) {
            return "";
        }
        return filename.substring(lastDot).toLowerCase();
    }

    private boolean isValidImageExtension(String extension) {
        return extension.equals(".jpg") || extension.equals(".jpeg") || 
               extension.equals(".png") || extension.equals(".gif") || 
               extension.equals(".webp");
    }

    private boolean isValidVideoExtension(String extension) {
        return extension.equals(".mp4") || extension.equals(".mov") || 
               extension.equals(".avi") || extension.equals(".webm") ||
               extension.equals(".mp3") || extension.equals(".wav") ||
               extension.equals(".flac") || extension.equals(".aac") ||
               extension.equals(".mid") || extension.equals(".midi") ||
               extension.equals(".m4a") || extension.equals(".ogg");
    }
}
