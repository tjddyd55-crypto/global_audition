package com.audition.platform.application.me;

import com.audition.platform.api.dto.me.PatchVaultItemRequest;
import com.audition.platform.api.dto.me.VaultItemDetailDto;
import com.audition.platform.api.dto.me.VaultItemDto;
import com.audition.platform.api.dto.me.VaultItemsPageDto;
import com.audition.platform.domain.vault.VaultItem;
import com.audition.platform.domain.vault.VaultItemRepository;
import com.audition.platform.infra.SecurityUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class MeVaultService {

    private final VaultItemRepository vaultItemRepository;

    @Value("${app.public-base-url:http://localhost:8080}")
    private String publicBaseUrl;

    public MeVaultService(VaultItemRepository vaultItemRepository) {
        this.vaultItemRepository = vaultItemRepository;
    }

    private UUID requireUser() {
        UUID userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        if (!SecurityUtils.hasRole("APPLICANT") && !SecurityUtils.hasRole("ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "창작물 보관소는 지원자 전용입니다.");
        }
        return userId;
    }

    private VaultItem requireOwned(UUID vaultItemId, UUID ownerId) {
        return vaultItemRepository.findByIdAndOwnerId(vaultItemId, ownerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "해당 창작물을 찾을 수 없습니다."));
    }

    public static String mapAssetTypeToVaultType(String assetType) {
        if (assetType == null) {
            return "PORTFOLIO_FILE";
        }
        return switch (assetType.toUpperCase(Locale.ROOT)) {
            case "LYRIC" -> "LYRICS";
            case "COMPOSITION", "STEMS" -> "PORTFOLIO_FILE";
            case "DEMO_AUDIO" -> "DEMO_AUDIO";
            case "VOCAL_GUIDE" -> "GUIDE_VOCAL";
            case "AI_GENERATED", "AI_ASSISTED" -> "PORTFOLIO_FILE";
            default -> "PORTFOLIO_FILE";
        };
    }

    public static String mapDeclaredCreation(String declared) {
        if (declared == null || declared.isBlank()) {
            return "HUMAN";
        }
        String u = declared.toUpperCase(Locale.ROOT);
        if ("AI_ASSISTED".equals(u) || "AI_GENERATED".equals(u) || "HUMAN".equals(u)) {
            return u;
        }
        return "HUMAN";
    }

    public VaultItemsPageDto list() {
        UUID ownerId = requireUser();
        List<VaultItem> all = vaultItemRepository.findByOwnerIdOrderByCreatedAtDesc(ownerId);
        VaultItemsPageDto page = new VaultItemsPageDto();
        page.setItems(all.stream().map(this::toListDto).collect(Collectors.toList()));
        page.setTotal(all.size());
        return page;
    }

    public VaultItemDetailDto getDetail(UUID id) {
        UUID ownerId = requireUser();
        VaultItem item = requireOwned(id, ownerId);
        return toDetailDto(item);
    }

    @Transactional
    public VaultItemDetailDto createMultipart(
            String title,
            String description,
            String assetType,
            String declaredCreationType,
            String accessControl,
            MultipartFile file,
            String textContent
    ) {
        UUID ownerId = requireUser();
        if (title == null || title.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "제목은 필수입니다.");
        }
        boolean hasFile = file != null && !file.isEmpty();
        boolean hasText = textContent != null && !textContent.isBlank();
        if (!hasFile && !hasText) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "파일 또는 텍스트 내용 중 하나는 필요합니다.");
        }
        if (accessControl == null || accessControl.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "공개 범위는 필수입니다.");
        }
        String visibility = accessControl.toUpperCase(Locale.ROOT);
        if (!visibility.equals("PUBLIC") && !visibility.equals("AUDITION_ONLY") && !visibility.equals("PRIVATE")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "유효하지 않은 공개 범위입니다.");
        }

        String type = mapAssetTypeToVaultType(assetType);
        String creationMethod = mapDeclaredCreation(declaredCreationType);
        if (assetType != null) {
            String at = assetType.toUpperCase(Locale.ROOT);
            if ("AI_GENERATED".equals(at)) {
                creationMethod = "AI_GENERATED";
            } else if ("AI_ASSISTED".equals(at)) {
                creationMethod = "AI_ASSISTED";
            }
        }

        VaultItem item = new VaultItem();
        item.setOwnerId(ownerId);
        item.setTitle(title.trim());
        String desc = description != null ? description.trim() : "";
        if (hasText) {
            String tc = textContent.trim();
            desc = desc.isEmpty() ? tc : desc + "\n\n" + tc;
        }
        item.setDescription(desc.isEmpty() ? null : desc);
        item.setType(type);
        item.setVisibility(visibility);
        item.setCreationMethod(creationMethod);
        item.setCreatedAt(Instant.now());
        item.setUpdatedAt(Instant.now());

        if (hasFile) {
            try {
                String url = storeFile(ownerId, file);
                item.setFileUrl(url);
            } catch (IOException e) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "파일 저장에 실패했습니다.");
            }
        }

        return toDetailDto(vaultItemRepository.save(item));
    }

    private String storeFile(UUID ownerId, MultipartFile file) throws IOException {
        String original = file.getOriginalFilename();
        if (original == null || original.isBlank()) {
            original = "upload.bin";
        }
        String safe = original.replaceAll("[^a-zA-Z0-9._-]", "_");
        Path dir = Paths.get("uploads", "vault", ownerId.toString());
        Files.createDirectories(dir);
        String name = UUID.randomUUID() + "_" + safe;
        Path target = dir.resolve(name);
        Files.copy(file.getInputStream(), target, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
        String base = publicBaseUrl.endsWith("/") ? publicBaseUrl.substring(0, publicBaseUrl.length() - 1) : publicBaseUrl;
        return base + "/uploads/vault/" + ownerId + "/" + name;
    }

    @Transactional
    public VaultItemDetailDto patch(UUID id, PatchVaultItemRequest req) {
        UUID ownerId = requireUser();
        VaultItem item = requireOwned(id, ownerId);
        if (req.getTitle() != null) {
            item.setTitle(req.getTitle().trim());
        }
        if (req.getDescription() != null) {
            item.setDescription(req.getDescription().trim().isEmpty() ? null : req.getDescription().trim());
        }
        if (req.getType() != null) {
            item.setType(req.getType());
        }
        if (req.getVisibility() != null) {
            item.setVisibility(req.getVisibility());
        }
        if (req.getCreationMethod() != null) {
            item.setCreationMethod(req.getCreationMethod());
        }
        if (req.getFileUrl() != null) {
            item.setFileUrl(req.getFileUrl().trim().isEmpty() ? null : req.getFileUrl().trim());
        }
        if (req.getAudioUrl() != null) {
            item.setAudioUrl(req.getAudioUrl().trim().isEmpty() ? null : req.getAudioUrl().trim());
        }
        if (req.getVideoUrl() != null) {
            item.setVideoUrl(req.getVideoUrl().trim().isEmpty() ? null : req.getVideoUrl().trim());
        }
        item.setUpdatedAt(Instant.now());
        return toDetailDto(vaultItemRepository.save(item));
    }

    @Transactional
    public void delete(UUID id) {
        UUID ownerId = requireUser();
        VaultItem item = requireOwned(id, ownerId);
        vaultItemRepository.delete(item);
    }

    private VaultItemDto toListDto(VaultItem v) {
        VaultItemDto dto = new VaultItemDto();
        dto.setVaultItemId(v.getId().toString());
        dto.setTitle(v.getTitle());
        dto.setDescription(v.getDescription());
        dto.setType(v.getType());
        dto.setVisibility(v.getVisibility());
        dto.setCreationMethod(v.getCreationMethod());
        dto.setCreatedAt(v.getCreatedAt());
        return dto;
    }

    private VaultItemDetailDto toDetailDto(VaultItem v) {
        VaultItemDetailDto dto = new VaultItemDetailDto();
        dto.setVaultItemId(v.getId().toString());
        dto.setTitle(v.getTitle());
        dto.setDescription(v.getDescription());
        dto.setType(v.getType());
        dto.setVisibility(v.getVisibility());
        dto.setCreationMethod(v.getCreationMethod());
        dto.setCreatedAt(v.getCreatedAt());
        dto.setFileUrl(v.getFileUrl());
        dto.setAudioUrl(v.getAudioUrl());
        dto.setVideoUrl(v.getVideoUrl());
        return dto;
    }
}
