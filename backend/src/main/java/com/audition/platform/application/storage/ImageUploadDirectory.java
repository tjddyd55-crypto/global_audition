package com.audition.platform.application.storage;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;

/**
 * 업로드 API {@code dir} 쿼리 — 화이트리스트만 허용(경로 조작 불가).
 * 객체 키 접두사는 고정 문자열이며 클라이언트 입력을 경로에 직접 붙이지 않음.
 */
public enum ImageUploadDirectory {

    /** 오디션 에디터·갤러리 등 */
    AUDITION("audition/"),
    /** 프로필·에이전시 로고 등 */
    PROFILE("profile/"),
    /** 썸네일·보조 이미지 */
    THUMBNAIL("thumbnail/");

    private static final List<String> ALLOWED_PARAM = List.of("audition", "profile", "thumbnail");

    private final String keyPrefix;

    ImageUploadDirectory(String keyPrefix) {
        this.keyPrefix = keyPrefix;
    }

    public String keyPrefix() {
        return keyPrefix;
    }

    /**
     * @param raw 쿼리 파라미터 {@code dir} (기본: audition)
     */
    public static ImageUploadDirectory fromParam(String raw) {
        if (raw == null || raw.isBlank()) {
            return AUDITION;
        }
        String s = raw.trim().toLowerCase(Locale.ROOT);
        if (!ALLOWED_PARAM.contains(s)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "dir는 audition, profile, thumbnail 중 하나여야 합니다."
            );
        }
        return switch (s) {
            case "audition" -> AUDITION;
            case "profile" -> PROFILE;
            case "thumbnail" -> THUMBNAIL;
            default -> throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "dir는 audition, profile, thumbnail 중 하나여야 합니다."
            );
        };
    }
}
