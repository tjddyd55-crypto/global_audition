package com.audition.platform.application.i18n.content;

import com.audition.platform.application.i18n.Bcp47Tags;

import java.util.LinkedHashMap;
import java.util.Map;

final class ContentTexts {

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
}
