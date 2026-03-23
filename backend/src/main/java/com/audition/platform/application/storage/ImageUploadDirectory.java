package com.audition.platform.application.storage;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/**
 * 업로드 API {@code dir} 쿼리와 S3 객체 키 접두사 매핑.
 * <ul>
 *   <li>{@code covers} → {@code auditions/covers/}</li>
 *   <li>{@code gallery} → {@code auditions/gallery/}</li>
 *   <li>{@code agency_logo} → {@code agencies/logos/}</li>
 * </ul>
 */
public enum ImageUploadDirectory {

    COVERS("auditions/covers/"),
    GALLERY("auditions/gallery/"),
    AGENCY_LOGO("agencies/logos/");

    private final String keyPrefix;

    ImageUploadDirectory(String keyPrefix) {
        this.keyPrefix = keyPrefix;
    }

    public String keyPrefix() {
        return keyPrefix;
    }

    /**
     * @param raw 쿼리 파라미터 {@code dir} (기본값: covers)
     */
    public static ImageUploadDirectory fromParam(String raw) {
        if (raw == null || raw.isBlank()) {
            return COVERS;
        }
        String s = raw.trim().toLowerCase();
        return switch (s) {
            case "covers", "cover" -> COVERS;
            case "gallery", "galleries" -> GALLERY;
            case "agency_logo", "agency-logo", "logo" -> AGENCY_LOGO;
            default -> throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "dir는 covers, gallery, agency_logo 중 하나여야 합니다."
            );
        };
    }
}
