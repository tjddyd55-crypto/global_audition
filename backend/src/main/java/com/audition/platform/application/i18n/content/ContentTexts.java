package com.audition.platform.application.i18n.content;

import com.audition.platform.application.i18n.Bcp47Tags;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

final class ContentTexts {

    private static final Pattern EMAIL = Pattern.compile("[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}", Pattern.CASE_INSENSITIVE);
    private static final Pattern URL = Pattern.compile("(?i)\\b(?:https?://|www\\.)\\S+");
    private static final Pattern PHONE = Pattern.compile("(?<![\\w])\\+?\\d[\\d\\s().-]{6,}\\d");
    private static final Pattern UUID_TEXT = Pattern.compile("(?i)\\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\b");
    private static final Pattern ISO_DATE = Pattern.compile("\\b\\d{4}-\\d{2}-\\d{2}(?:T\\d{2}:\\d{2}(?::\\d{2})?(?:Z|[+-]\\d{2}:\\d{2})?)?\\b");

    private ContentTexts() {
    }

    static String text(String value) {
        return value == null ? "" : value;
    }

    static String locale(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String tag = Bcp47Tags.canonicalize(raw);
        return tag.isEmpty() ? null : tag;
    }

    static Map<String, String> fields(String... pairs) {
        LinkedHashMap<String, String> map = new LinkedHashMap<>();
        for (int i = 0; i < pairs.length; i += 2) {
            map.put(pairs[i], text(pairs[i + 1]));
        }
        return map;
    }

    /** 이름·연락처·URL·금액·날짜·식별자는 공급자에 보내지 않는다. 빈 결과는 키를 만들지 않는다. */
    static Map<String, String> proseFields(String... pairs) {
        LinkedHashMap<String, String> map = new LinkedHashMap<>();
        for (int i = 0; i < pairs.length; i += 2) {
            String value = minimize(pairs[i + 1]);
            if (!value.isEmpty()) {
                map.put(pairs[i], value);
            }
        }
        return map;
    }

    static String lines(String[] values) {
        if (values == null || values.length == 0) {
            return "";
        }
        return String.join("\n", values);
    }

    static String minimize(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        List<String> kept = new ArrayList<>();
        for (String line : value.replace("\r\n", "\n").split("\n", -1)) {
            String cleaned = redact(line);
            if (cleaned.isEmpty() || excludedLine(cleaned)) {
                continue;
            }
            kept.add(cleaned);
        }
        return String.join("\n", kept).trim();
    }

    private static String redact(String line) {
        String out = EMAIL.matcher(line).replaceAll("");
        out = URL.matcher(out).replaceAll("");
        out = PHONE.matcher(out).replaceAll("");
        out = UUID_TEXT.matcher(out).replaceAll("");
        out = ISO_DATE.matcher(out).replaceAll("");
        return out.replaceAll("[ \\t]{2,}", " ").trim();
    }

    private static boolean excludedLine(String line) {
        return line.matches("(?i)open|closed|draft|pending|approved|rejected")
                || line.matches("[A-Z]{2}")
                || line.matches("(?i)(?:usd|krw|mnt|\\$|₩|€)?\\s*\\d{1,3}(?:[,.]\\d{3})*(?:[.]\\d+)?\\s*(?:usd|krw|mnt|원|credits?)?");
    }
}
