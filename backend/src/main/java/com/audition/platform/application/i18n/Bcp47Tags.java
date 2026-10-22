package com.audition.platform.application.i18n;

import java.util.Locale;
import java.util.regex.Pattern;

/**
 * BCP 47 태그를 잃지 않고 정규화한다.
 * 언어는 소문자, 스크립트는 첫 글자만 대문자, 지역은 대문자다.
 * {@code pt-BR}, {@code zh-Hant}, {@code zh-Hant-TW} 를 언어 코드로 자르지 않는다.
 */
public final class Bcp47Tags {

    public static final int MAX_LENGTH = 35;

    private static final Pattern LANGUAGE = Pattern.compile("[a-zA-Z]{2,3}");
    private static final Pattern SCRIPT = Pattern.compile("[a-zA-Z]{4}");
    private static final Pattern REGION = Pattern.compile("[a-zA-Z]{2}|[0-9]{3}");
    private static final Pattern VARIANT = Pattern.compile("[a-zA-Z0-9]{5,8}|[0-9][a-zA-Z0-9]{3}");

    private Bcp47Tags() {
    }

    public static String canonicalize(String raw) {
        if (raw == null || raw.isBlank()) {
            return "";
        }
        String trimmed = raw.trim().replace('_', '-');
        if (trimmed.length() > MAX_LENGTH) {
            return "";
        }
        String[] parts = trimmed.split("-");
        if (parts.length == 0 || parts.length > 4 || !LANGUAGE.matcher(parts[0]).matches()) {
            return "";
        }
        StringBuilder out = new StringBuilder(parts[0].toLowerCase(Locale.ROOT));
        int index = 1;
        if (index < parts.length && SCRIPT.matcher(parts[index]).matches()) {
            String script = parts[index];
            out.append('-')
                    .append(Character.toUpperCase(script.charAt(0)))
                    .append(script.substring(1).toLowerCase(Locale.ROOT));
            index++;
        }
        if (index < parts.length && REGION.matcher(parts[index]).matches()) {
            out.append('-').append(parts[index].toUpperCase(Locale.ROOT));
            index++;
        }
        if (index < parts.length && VARIANT.matcher(parts[index]).matches()) {
            out.append('-').append(parts[index].toLowerCase(Locale.ROOT));
            index++;
        }
        if (index != parts.length) {
            return "";
        }
        String tag = out.toString();
        return tag.length() <= MAX_LENGTH ? tag : "";
    }

    public static String language(String canonical) {
        if (canonical == null || canonical.isBlank()) {
            return "";
        }
        int dash = canonical.indexOf('-');
        return dash < 0 ? canonical : canonical.substring(0, dash);
    }
}
