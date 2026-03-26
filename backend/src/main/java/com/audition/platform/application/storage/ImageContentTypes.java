package com.audition.platform.application.storage;

import java.util.Locale;
import java.util.Set;

/**
 * 업로드 허용 이미지 Content-Type (서비스·컨트롤러 공통).
 */
public final class ImageContentTypes {

    public static final Set<String> ALLOWED = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp"
    );

    private ImageContentTypes() {
    }

    /** 허용 시 정규화된 타입, 아니면 null */
    public static String normalize(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String ct = raw.toLowerCase(Locale.ROOT).trim();
        if ("image/jpg".equals(ct) || "image/pjpeg".equals(ct)) {
            ct = "image/jpeg";
        }
        return ALLOWED.contains(ct) ? ct : null;
    }

    public static boolean isAllowed(String raw) {
        return normalize(raw) != null;
    }
}
