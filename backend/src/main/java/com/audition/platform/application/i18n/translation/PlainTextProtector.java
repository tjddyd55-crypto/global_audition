package com.audition.platform.application.i18n.translation;

import com.audition.platform.domain.audition.AuditionTranslation;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * text/plain 요청에서 자리표시자와 줄바꿈을 센티넬로 바꿨다가 응답에서 되돌린다.
 * 센티넬이 사라지면 부분 번역을 저장하지 않고 MISSING_FIELD 로 실패한다.
 */
final class PlainTextProtector {

    private static final Pattern PLACEHOLDER = Pattern.compile(
            "\\{\\{[^{}\\r\\n]+}}|\\{[^{}\\r\\n]+}|%(?:\\d+\\$)?[sdif]");

    private PlainTextProtector() {
    }

    static String protect(String value, List<String> captured) {
        String source = value == null ? "" : value;
        StringBuilder out = new StringBuilder(source.length());
        Matcher matcher = PLACEHOLDER.matcher(source);
        int cursor = 0;
        while (cursor < source.length()) {
            if (source.startsWith("\r\n", cursor)) {
                out.append(mark(captured.size()));
                captured.add("\r\n");
                cursor += 2;
                continue;
            }
            char current = source.charAt(cursor);
            if (current == '\n' || current == '\r') {
                out.append(mark(captured.size()));
                captured.add(String.valueOf(current));
                cursor++;
                continue;
            }
            matcher.region(cursor, source.length());
            if (matcher.lookingAt()) {
                out.append(mark(captured.size()));
                captured.add(matcher.group());
                cursor = matcher.end();
                continue;
            }
            out.append(current);
            cursor++;
        }
        return out.toString();
    }

    static String restore(String translated, List<String> captured) {
        String current = translated == null ? "" : translated;
        for (int i = captured.size() - 1; i >= 0; i--) {
            String token = mark(i);
            if (!current.contains(token)) {
                throw new TranslationProviderException(
                        AuditionTranslation.ERROR_MISSING_FIELD,
                        AuditionTranslation.ERROR_MISSING_FIELD + ":placeholder");
            }
            current = current.replace(token, captured.get(i));
        }
        return current;
    }

    private static String mark(int index) {
        return "\uE000" + index + "\uE001";
    }
}
