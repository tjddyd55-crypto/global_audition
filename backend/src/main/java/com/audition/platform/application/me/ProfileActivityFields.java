package com.audition.platform.application.me;

import java.util.ArrayList;
import java.util.List;

/** 프로필 활동 분야. 빈 줄은 빼고, 개수와 길이를 넘기면 저장하지 않는다. */
public final class ProfileActivityFields {

    public static final int MAX_ITEMS = 8;
    public static final int MAX_LENGTH = 40;

    private ProfileActivityFields() {
    }

    public static String[] normalize(List<String> raw) {
        if (raw == null) {
            throw new IllegalArgumentException("activity fields required");
        }
        List<String> out = new ArrayList<>();
        for (String item : raw) {
            if (item == null) {
                continue;
            }
            String trimmed = item.trim();
            if (trimmed.isEmpty()) {
                continue;
            }
            if (trimmed.length() > MAX_LENGTH || out.size() >= MAX_ITEMS) {
                throw new IllegalArgumentException("activity field invalid");
            }
            out.add(trimmed);
        }
        return out.toArray(String[]::new);
    }
}
