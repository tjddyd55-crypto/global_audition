package com.audition.platform.application.i18n;

import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

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
    public static final int AUTHORING_MAX_LENGTH = 16;
    private static final Pattern AUTHORING_TAG = Pattern.compile("[a-z]{2,3}(?:-[a-z0-9]{2,8})?");

    private ContentLocales() {
    }

    /**
     * 작성 언어 태그. 8개 콘텐츠 로케일 밖도 자르거나 en 으로 바꾸지 않는다.
     * 비어 있거나 형식이 아니면 빈 문자열.
     */
    public static String canonicalTag(String raw) {
        if (raw == null || raw.isBlank()) {
            return "";
        }
        String tag = raw.trim().toLowerCase(Locale.ROOT).replace('_', '-');
        if (tag.length() > AUTHORING_MAX_LENGTH || !AUTHORING_TAG.matcher(tag).matches()) {
            return "";
        }
        return tag;
    }

    public static String requireAuthoringLocale(String raw) {
        String tag = canonicalTag(raw);
        if (tag.isEmpty()) {
            throw new IllegalArgumentException("invalid authoring locale");
        }
        return tag;
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
