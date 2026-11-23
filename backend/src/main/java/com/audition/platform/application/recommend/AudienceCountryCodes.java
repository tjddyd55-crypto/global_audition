package com.audition.platform.application.recommend;

import java.util.Locale;
import java.util.Set;

/**
 * 모집 국가 코드와 UI 언어 코드를 섞지 않는다.
 * MN·UZ·KM 은 ISO 국가 코드이므로 언어 코드로 버리지 않는다. KO·EN 등은 국가로 쓰지 않는다.
 */
public final class AudienceCountryCodes {

    private static final Set<String> LANGUAGE_ONLY = Set.of("KO", "EN", "JA", "ZH", "VI", "TH", "RU", "FR", "DE", "ES");

    private AudienceCountryCodes() {
    }

    /** 비교용. 빈 값·GLOBAL 은 GLOBAL. 언어 전용 코드는 null. */
    public static String normalize(String raw) {
        if (raw == null || raw.isBlank()) {
            return "GLOBAL";
        }
        String code = raw.trim().toUpperCase(Locale.ROOT);
        if ("ALL".equals(code) || "GLOBAL".equals(code)) {
            return "GLOBAL";
        }
        if (LANGUAGE_ONLY.contains(code)) {
            return null;
        }
        return code;
    }

    public static boolean isGlobal(String normalized) {
        return normalized == null || "GLOBAL".equals(normalized);
    }
}
