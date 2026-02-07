package com.audition.platform.presentation.controller;

import com.audition.platform.application.dto.CreateCreativeAssetRequest;
import com.audition.platform.application.dto.CreativeAssetDto;
import com.audition.platform.application.service.CreativeAssetService;
import com.audition.platform.domain.entity.CreativeAsset;
import com.audition.platform.infrastructure.security.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * 창작물 자산 컨트롤러 (Creative Vault)
 * 작업: GA_20260202_CREATIVE_REGISTRY_EXTENSION
 */
@RestController
@RequestMapping("/api/v1/vault")
@RequiredArgsConstructor
@Tag(name = "Creative Vault", description = "창작물 보관소 API")
public class CreativeAssetController {

    private final CreativeAssetService creativeAssetService;
    private final SecurityUtils securityUtils;

    /**
     * ============================================================================
     * 파일 업로드 플로우 문서화 (Phase A - 검증 단계)
     * ============================================================================
     * 
     * [업로드 엔드포인트]
     *   - 경로: POST /api/v1/vault/assets
     *   - Gateway를 통해 접근: {GATEWAY_URL}/api/v1/vault/assets
     * 
     * [Storage Provider]
     *   - 현재: Local File System (FileStorageService)
     *     - 이미지: ./uploads/images/{userId}/{uuid}.{ext}
     *     - 비디오/오디오: ./uploads/videos/{userId}/{uuid}.{ext}
     *   - 향후 계획: S3 또는 CDN으로 마이그레이션 예정
     *     - FileStorageService를 인터페이스로 추상화하여 교체 가능하도록 설계됨
     * 
     * [인증]
     *   - 필수: Authorization 헤더 필요
     *   - SecurityUtils.getUserIdFromAuthHeaderOrThrow()로 검증
     *   - 인증 실패 시 401 Unauthorized 반환
     * 
     * [파일 크기 제한]
     *   - application.yml: spring.servlet.multipart.max-file-size=50MB
     *   - application.yml: spring.servlet.multipart.max-request-size=50MB
     *   - 초과 시 413 Payload Too Large 반환
     * 
     * [파일 확장자 검증]
     *   - FileStorageService에서 수행
     *   - 이미지: .jpg, .jpeg, .png, .gif, .webp
     *   - 비디오/오디오: .mp4, .mov, .avi, .webm, .mp3, .wav, .flac, .aac, .mid, .midi, .m4a, .ogg
     *   - 미지원 확장자 시 IllegalArgumentException 발생 (400 Bad Request)
     */
    @PostMapping("/assets")
    @Operation(summary = "창작물 자산 등록", description = "파일 업로드 또는 텍스트 입력, 해시 생성")
    public ResponseEntity<CreativeAssetDto> createAsset(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "textContent", required = false) String textContent,
            @RequestParam("title") String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam("assetType") String assetType,
            @RequestParam(value = "declaredCreationType", required = false) String declaredCreationType,
            @RequestParam("accessControl") String accessControl
    ) {
        // 인증: Authorization 헤더에서 userId 추출 (필수)
        Long userId = securityUtils.getUserIdFromAuthHeaderOrThrow(authHeader);
        
        // AssetType enum 변환
        CreativeAsset.AssetType assetTypeEnum;
        try {
            assetTypeEnum = CreativeAsset.AssetType.valueOf(assetType.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("올바른 자산 타입이 아닙니다: " + assetType);
        }
        
        // AccessControl enum 변환
        CreativeAsset.AccessControl accessControlEnum;
        try {
            accessControlEnum = CreativeAsset.AccessControl.valueOf(accessControl.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("올바른 접근 제어 설정이 아닙니다: " + accessControl);
        }
        
        CreateCreativeAssetRequest request = CreateCreativeAssetRequest.builder()
                .title(title)
                .description(description)
                .assetType(assetTypeEnum)
                .declaredCreationType(declaredCreationType)
                .accessControl(accessControlEnum)
                .build();
        
        CreativeAssetDto asset = creativeAssetService.createAsset(userId, file, textContent, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(asset);
    }

    @GetMapping("/assets/my")
    @Operation(summary = "내 창작물 목록 조회")
    public ResponseEntity<Page<CreativeAssetDto>> getMyAssets(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Long userId = securityUtils.getUserIdFromAuthHeaderOrThrow(authHeader);
        Page<CreativeAssetDto> assets = creativeAssetService.getMyAssets(userId, pageable);
        return ResponseEntity.ok(assets);
    }

    @GetMapping("/assets/{id}")
    @Operation(summary = "창작물 상세 조회")
    public ResponseEntity<CreativeAssetDto> getAsset(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id
    ) {
        Long userId = securityUtils.getUserIdFromAuthHeaderOrThrow(authHeader);
        CreativeAssetDto asset = creativeAssetService.getAsset(id, userId);
        return ResponseEntity.ok(asset);
    }

    @PostMapping("/assets/batch")
    @Operation(summary = "asset_id 목록으로 조회", description = "오디션 지원 첨부용")
    public ResponseEntity<List<CreativeAssetDto>> getAssetsByIds(
            @RequestBody List<Long> assetIds
    ) {
        List<CreativeAssetDto> assets = creativeAssetService.getAssetsByIds(assetIds);
        return ResponseEntity.ok(assets);
    }
}
