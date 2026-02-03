package com.audition.platform.application.service;

import com.audition.platform.application.dto.CreateCreativeAssetRequest;
import com.audition.platform.application.dto.CreativeAssetDto;
import com.audition.platform.domain.entity.CreativeAsset;
import com.audition.platform.domain.repository.CreativeAssetRepository;
import com.audition.platform.infrastructure.storage.FileStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 창작물 자산 서비스
 * 작업: GA_20260202_CREATIVE_REGISTRY_EXTENSION
 */
@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class CreativeAssetService {

    private final CreativeAssetRepository creativeAssetRepository;
    private final FileStorageService fileStorageService;

    /**
     * 창작물 자산 등록
     * 파일 업로드 또는 텍스트 입력 지원
     * 업로드 즉시 SHA-256 해시 생성 및 저장
     */
    public CreativeAssetDto createAsset(Long userId, MultipartFile file, String textContent, CreateCreativeAssetRequest request) {
        try {
            String contentHash;
            String fileUrl = null;
            Long fileSize = null;
            String mimeType = null;
            String textContentValue = null;

            // 파일 업로드 또는 텍스트 입력 처리
            if (file != null && !file.isEmpty()) {
                // 파일 업로드 (이미지/비디오/오디오/기타 파일)
                String contentType = file.getContentType();
                if (contentType != null && contentType.startsWith("image/")) {
                    fileUrl = fileStorageService.uploadImage(file, userId);
                } else {
                    // 비디오, 오디오, 기타 파일 타입은 uploadVideo 사용
                    fileUrl = fileStorageService.uploadVideo(file, userId);
                }
                contentHash = calculateFileHash(file.getInputStream());
                fileSize = file.getSize();
                mimeType = file.getContentType();
            } else if (textContent != null && !textContent.trim().isEmpty()) {
                // 텍스트 입력 (가사 등)
                textContentValue = textContent.trim();
                contentHash = calculateTextHash(textContentValue);
            } else {
                throw new IllegalArgumentException("파일 또는 텍스트 중 하나는 필수입니다");
            }
            
            // 자산 저장 (append-only: 수정 불가, 새 버전은 새 레코드)
            CreativeAsset asset = CreativeAsset.builder()
                    .userId(userId)
                    .title(request.getTitle())
                    .description(request.getDescription())
                    .assetType(request.getAssetType())
                    .fileUrl(fileUrl)
                    .textContent(textContentValue)
                    .contentHash(contentHash)
                    .fileSize(fileSize)
                    .mimeType(mimeType)
                    .declaredCreationType(request.getDeclaredCreationType())
                    .accessControl(request.getAccessControl())
                    .registeredAt(LocalDateTime.now())
                    .build();
            
            CreativeAsset saved = creativeAssetRepository.save(asset);
            log.info("창작물 자산 등록 완료: assetId={}, userId={}, assetType={}, hash={}", 
                    saved.getId(), userId, request.getAssetType(), contentHash);
            
            return toDto(saved);
        } catch (Exception e) {
            log.error("창작물 자산 등록 실패: userId={}", userId, e);
            throw new RuntimeException("창작물 자산 등록 실패: " + e.getMessage(), e);
        }
    }

    /**
     * 내 창작물 목록 조회
     */
    @Transactional(readOnly = true)
    public Page<CreativeAssetDto> getMyAssets(Long userId, Pageable pageable) {
        Page<CreativeAsset> assets = creativeAssetRepository.findByUserId(userId, pageable);
        return assets.map(this::toDto);
    }

    /**
     * 창작물 상세 조회
     */
    @Transactional(readOnly = true)
    public CreativeAssetDto getAsset(Long assetId, Long userId) {
        CreativeAsset asset = creativeAssetRepository.findByIdAndUserId(assetId, userId)
                .orElseThrow(() -> new RuntimeException("창작물을 찾을 수 없습니다: " + assetId));
        return toDto(asset);
    }

    /**
     * asset_id 목록으로 조회 (오디션 지원 첨부용)
     */
    @Transactional(readOnly = true)
    public List<CreativeAssetDto> getAssetsByIds(List<Long> assetIds) {
        List<CreativeAsset> assets = creativeAssetRepository.findByIdIn(assetIds);
        return assets.stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * 파일 해시 계산 (SHA-256)
     */
    private String calculateFileHash(InputStream inputStream) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] buffer = new byte[8192];
            int bytesRead;
            while ((bytesRead = inputStream.read(buffer)) != -1) {
                digest.update(buffer, 0, bytesRead);
            }
            byte[] hashBytes = digest.digest();
            
            // 16진수 문자열로 변환
            StringBuilder sb = new StringBuilder();
            for (byte b : hashBytes) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException("파일 해시 계산 실패", e);
        }
    }

    /**
     * 텍스트 해시 계산 (SHA-256)
     */
    private String calculateTextHash(String text) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(text.getBytes(StandardCharsets.UTF_8));
            
            // 16진수 문자열로 변환
            StringBuilder sb = new StringBuilder();
            for (byte b : hashBytes) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException("텍스트 해시 계산 실패", e);
        }
    }

    private CreativeAssetDto toDto(CreativeAsset asset) {
        return CreativeAssetDto.builder()
                .id(asset.getId())
                .userId(asset.getUserId())
                .title(asset.getTitle())
                .description(asset.getDescription())
                .assetType(asset.getAssetType())
                .fileUrl(asset.getFileUrl())
                .textContent(asset.getTextContent())
                .contentHash(asset.getContentHash())
                .fileSize(asset.getFileSize())
                .mimeType(asset.getMimeType())
                .declaredCreationType(asset.getDeclaredCreationType())
                .accessControl(asset.getAccessControl())
                .registeredAt(asset.getRegisteredAt())
                .createdAt(asset.getCreatedAt())
                .updatedAt(asset.getUpdatedAt())
                .build();
    }
}
