package com.audition.platform.application.publicview;

import java.util.List;
import java.util.Locale;

/** 공개 채널 목록 검색. 숨긴 국적·전문 분야는 조건에 쓰이지 않는다. */
public final class PublicChannelDirectory {

    private PublicChannelDirectory() {
    }

    public static boolean matches(
            String nickname,
            String nationality,
            boolean nationalityPublic,
            List<String> categories,
            boolean categoriesPublic,
            String stageName,
            String country,
            String category) {
        if (!contains(nickname, stageName)) {
            return false;
        }
        String wantedCountry = normalize(country);
        if (wantedCountry != null) {
            if (!nationalityPublic || nationality == null || !nationality.trim().equalsIgnoreCase(wantedCountry)) {
                return false;
            }
        }
        String wantedCategory = normalize(category);
        if (wantedCategory != null) {
            if (!categoriesPublic || categories == null) {
                return false;
            }
            boolean hit = false;
            for (String item : categories) {
                if (item != null && item.toLowerCase(Locale.ROOT).contains(wantedCategory)) {
                    hit = true;
                }
            }
            if (!hit) {
                return false;
            }
        }
        return true;
    }

    private static boolean contains(String value, String needle) {
        String wanted = normalize(needle);
        if (wanted == null) {
            return true;
        }
        return value != null && value.toLowerCase(Locale.ROOT).contains(wanted);
    }

    private static String normalize(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim().toLowerCase(Locale.ROOT);
    }
}
