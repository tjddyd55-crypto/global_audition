package com.audition.platform.application.i18n;

import java.util.Locale;
import java.util.Set;

/**
 * UI·콘텐츠가 공유하는 BCP-47 short locale.
 * 1급: ko / en / mn. 기존 next-intl 로케일도 유지.
 */
public final class ContentLocales {

    public static final String DEFAULT = "ko";
    public static final String FALLBACK = "en";
    public static final Set<String> SUPPORTED = Set.of(
            "ko", "en", "mn", "ja", "zh", "es", "fr", "de");
    public static final Set<String> PRIMARY = Set.of("ko", "en", "mn");

    private ContentLocales() {
    }

    public static String normalize(String raw) {
        if (raw == null || raw.isBlank()) {
            return DEFAULT;
        }
        String tag = raw.trim().toLowerCase(Locale.ROOT).replace('_', '-');
        int dash = tag.indexOf('-');
        String language = dash > 0 ? tag.substring(0, dash) : tag;
        if (SUPPORTED.contains(language)) {
            return language;
        }
        return FALLBACK;
    }

    public static boolean isSupported(String raw) {
        if (raw == null || raw.isBlank()) {
            return false;
        }
        String tag = raw.trim().toLowerCase(Locale.ROOT).replace('_', '-');
        int dash = tag.indexOf('-');
        String language = dash > 0 ? tag.substring(0, dash) : tag;
        return SUPPORTED.contains(language);
    }
}
