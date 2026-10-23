package com.audition.platform.application.audition;

import com.audition.platform.application.i18n.ContentLocales;

/**
 * 공고 시리즈(1차·2차…) 표시용 — MULTI_ROUND의 current_round_number 와 별개.
 * 접미사/라벨은 콘텐츠 로케일(ko/en/mn)에 맞춘다.
 */
public final class AuditionSeriesPresentation {

    public static final String APPLY_BLOCKED_PREV_ROUND_NOT_ACCEPTED = "이전 라운드 합격자만 지원 가능합니다";
    public static final String APPLY_BLOCKED_PREV_ROUND_NOT_ACCEPTED_CODE = "PREV_ROUND_NOT_ACCEPTED";

    private static final java.util.regex.Pattern TRAILING_ROUND_SUFFIX =
            java.util.regex.Pattern.compile(" \\((\\d+차|Round \\d+|\\d+-р шат)\\)$");

    private AuditionSeriesPresentation() {
    }

    public static String stripTrailingSeriesRoundSuffix(String title) {
        if (title == null || title.isBlank()) {
            return "";
        }
        return TRAILING_ROUND_SUFFIX.matcher(title.trim()).replaceFirst("").trim();
    }

    public static String displayTitle(String title, int seriesRound) {
        return displayTitle(title, seriesRound, ContentLocales.DEFAULT);
    }

    public static String displayTitle(String title, int seriesRound, String locale) {
        if (seriesRound <= 1) {
            return title != null ? title : "";
        }
        String base = stripTrailingSeriesRoundSuffix(title != null ? title : "");
        return base + " " + roundSuffix(seriesRound, locale);
    }

    public static String recruitmentRoundLabel(String status, int seriesRound) {
        return recruitmentRoundLabel(status, seriesRound, ContentLocales.DEFAULT);
    }

    public static String recruitmentRoundLabel(String status, int seriesRound, String locale) {
        String loc = ContentLocales.normalize(locale);
        if ("OPEN".equals(status)) {
            return switch (loc) {
                case "en" -> "Round " + seriesRound + " open";
                case "mn" -> seriesRound + "-р шатны элсэлт";
                default -> seriesRound + "차 모집 중";
            };
        }
        if ("CLOSED".equals(status)) {
            return switch (loc) {
                case "en" -> "Round " + seriesRound + " closed";
                case "mn" -> seriesRound + "-р шат хаагдсан";
                default -> seriesRound + "차 마감";
            };
        }
        return switch (loc) {
            case "en" -> "Round " + seriesRound + " draft";
            case "mn" -> seriesRound + "-р шат · ноорог";
            default -> seriesRound + "차 · 초안";
        };
    }

    public static String applyBlockedMessage(String locale) {
        return switch (ContentLocales.normalize(locale)) {
            case "en" -> "Only applicants accepted in the previous round may apply";
            case "mn" -> "Зөвхөн өмнөх шатанд тэнцсэн өргөдөл гаргагч бүртгүүлнэ";
            default -> APPLY_BLOCKED_PREV_ROUND_NOT_ACCEPTED;
        };
    }

    private static String roundSuffix(int seriesRound, String locale) {
        return switch (ContentLocales.normalize(locale)) {
            case "en" -> "(Round " + seriesRound + ")";
            case "mn" -> "(" + seriesRound + "-р шат)";
            default -> "(" + seriesRound + "차)";
        };
    }
}
