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
    public static final int AUTHORING_MAX_LENGTH = 16;

    private ContentLocales() {
    }

    /**
     * 오디션 작성 언어. 공통 번역 테이블(VARCHAR 35)과 달리 이 경로는 16자까지다.
     * 케이스만 정규화하고, 저장된 default_locale 값을 영어로 바꾸지는 않는다.
     * 비어 있거나 형식이 아니면 빈 문자열.
     */
    public static String canonicalTag(String raw) {
        String tag = Bcp47Tags.canonicalize(raw);
        if (tag.isEmpty() || tag.length() > AUTHORING_MAX_LENGTH) {
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
