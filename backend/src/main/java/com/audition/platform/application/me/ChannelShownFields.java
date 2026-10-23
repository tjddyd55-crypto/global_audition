package com.audition.platform.application.me;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * 채널이 프로필을 다시 저장하지 않고, 공개 읽기 모델에 실을 키만 고른다.
 */
public final class ChannelShownFields {

    public static final String NAME = "NAME";
    public static final String NATIONALITY = "NATIONALITY";
    public static final String SHORT_BIO = "SHORT_BIO";
    public static final String BIO = "BIO";
    public static final String INTRO = "INTRO";
    public static final String SPECIALTIES = "SPECIALTIES";
    public static final String CAREER = "CAREER";
    public static final String ACTIVITY = "ACTIVITY";
    public static final String SNS = "SNS";

    public static final List<String> KEYS = List.of(
            NAME, NATIONALITY, SHORT_BIO, BIO, INTRO, SPECIALTIES, CAREER, ACTIVITY, SNS);

    /** 선택 저장 전 공개 채널이 이미 내려주던 항목. 경력·활동은 새 필드라 포함하지 않는다. */
    public static final List<String> LEGACY_PUBLIC = List.of(
            NAME, NATIONALITY, SHORT_BIO, BIO, INTRO, SPECIALTIES, SNS);

    private static final Set<String> KEY_SET = new LinkedHashSet<>(KEYS);

    private ChannelShownFields() {
    }

    public static String[] normalize(List<String> raw) {
        if (raw == null) {
            throw new IllegalArgumentException("shown fields required");
        }
        LinkedHashSet<String> out = new LinkedHashSet<>();
        for (String item : raw) {
            if (item == null || item.isBlank()) {
                continue;
            }
            String key = item.trim().toUpperCase(Locale.ROOT);
            if (!KEY_SET.contains(key)) {
                throw new IllegalArgumentException("unknown shown field");
            }
            out.add(key);
        }
        return out.toArray(String[]::new);
    }

    public static List<String> effective(String[] configured) {
        if (configured == null) {
            return List.copyOf(LEGACY_PUBLIC);
        }
        return List.copyOf(List.of(configured));
    }

    public static boolean visible(String[] configured, String key) {
        return effective(configured).contains(key);
    }

    public static List<String> copy(String[] configured) {
        if (configured == null) {
            return new ArrayList<>();
        }
        return new ArrayList<>(List.of(configured));
    }
}
