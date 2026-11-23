package com.audition.platform.application.recommend;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 공고 자격(qualifications) 자유 문장에서 나이 범위를 읽는다.
 * 정확히 파싱하지 못하면 UNKNOWN 이고, 이 경우 지원 가능하다고 단정하지 않는다.
 */
public final class AgeEligibility {

    public enum Status { ELIGIBLE, INELIGIBLE, UNKNOWN }

    public record Range(Integer minInclusive, Integer maxInclusive) {
    }

    private static final Pattern RANGE = Pattern.compile("(\\d{1,2})\\s*(?:[-~～]|내지)\\s*(\\d{1,2})\\s*(?:세|歳|age)?");
    private static final Pattern MIN = Pattern.compile("(?:만\\s*)?(\\d{1,2})\\s*(?:세|歳)?\\s*(?:이상|이상부터|\\+|and\\s+over|or\\s+older|and\\s+above)");
    private static final Pattern MAX_IN = Pattern.compile("(?:만\\s*)?(\\d{1,2})\\s*(?:세|歳)?\\s*(?:이하|이하까지|or\\s+younger|and\\s+under)");
    private static final Pattern MAX_EX = Pattern.compile("(?:만\\s*)?(\\d{1,2})\\s*(?:세|歳)?\\s*(?:미만|under)");
    private static final Pattern AGE_HINT = Pattern.compile("세|歳|age|만\\s*\\d|\\d{1,2}\\s*[-~]");

    private AgeEligibility() {
    }

    public static Range parse(String[] qualifications) {
        if (qualifications == null || qualifications.length == 0) {
            return new Range(null, null);
        }
        Integer min = null;
        Integer max = null;
        for (String raw : qualifications) {
            if (raw == null || raw.isBlank()) {
                continue;
            }
            String text = raw.trim();
            Matcher range = RANGE.matcher(text);
            if (range.find()) {
                min = tighterMin(min, Integer.parseInt(range.group(1)));
                max = tighterMax(max, Integer.parseInt(range.group(2)));
                continue;
            }
            Matcher minM = MIN.matcher(text);
            if (minM.find()) {
                min = tighterMin(min, Integer.parseInt(minM.group(1)));
            }
            Matcher maxIn = MAX_IN.matcher(text);
            if (maxIn.find()) {
                max = tighterMax(max, Integer.parseInt(maxIn.group(1)));
            }
            Matcher maxEx = MAX_EX.matcher(text);
            if (maxEx.find()) {
                max = tighterMax(max, Integer.parseInt(maxEx.group(1)) - 1);
            }
        }
        return new Range(min, max);
    }

    public static Status evaluate(String[] qualifications, Integer ageYears) {
        if (!mentionsAge(qualifications)) {
            return Status.UNKNOWN;
        }
        Range range = parse(qualifications);
        if (range.minInclusive() == null && range.maxInclusive() == null) {
            return Status.UNKNOWN;
        }
        if (ageYears == null) {
            return Status.UNKNOWN;
        }
        if (range.minInclusive() != null && ageYears < range.minInclusive()) {
            return Status.INELIGIBLE;
        }
        if (range.maxInclusive() != null && ageYears > range.maxInclusive()) {
            return Status.INELIGIBLE;
        }
        return Status.ELIGIBLE;
    }

    public static boolean mentionsAge(String[] qualifications) {
        if (qualifications == null) {
            return false;
        }
        for (String raw : qualifications) {
            if (raw == null || raw.isBlank()) {
                continue;
            }
            if (AGE_HINT.matcher(raw.toLowerCase()).find() || raw.contains("세") || raw.contains("만")) {
                return true;
            }
        }
        return false;
    }

    private static Integer tighterMin(Integer current, int next) {
        return current == null ? next : Math.max(current, next);
    }

    private static Integer tighterMax(Integer current, int next) {
        return current == null ? next : Math.min(current, next);
    }
}
