package com.audition.platform.application.audition;

/**
 * 공고 시리즈(1차·2차…) 표시용 — MULTI_ROUND의 current_round_number 와 별개.
 */
public final class AuditionSeriesPresentation {

    public static final String APPLY_BLOCKED_PREV_ROUND_NOT_ACCEPTED = "이전 라운드 합격자만 지원 가능합니다";

    private static final java.util.regex.Pattern TRAILING_ROUND_SUFFIX =
            java.util.regex.Pattern.compile(" \\(\\d+차\\)$");

    private AuditionSeriesPresentation() {
    }

    public static String stripTrailingSeriesRoundSuffix(String title) {
        if (title == null || title.isBlank()) {
            return "";
        }
        return TRAILING_ROUND_SUFFIX.matcher(title.trim()).replaceFirst("").trim();
    }

    public static String displayTitle(String title, int seriesRound) {
        if (seriesRound <= 1) {
            return title != null ? title : "";
        }
        String base = stripTrailingSeriesRoundSuffix(title != null ? title : "");
        return base + " (" + seriesRound + "차)";
    }

    public static String recruitmentRoundLabel(String status, int seriesRound) {
        if ("OPEN".equals(status)) {
            return seriesRound + "차 모집 중";
        }
        if ("CLOSED".equals(status)) {
            return seriesRound + "차 마감";
        }
        return seriesRound + "차 · 초안";
    }
}
