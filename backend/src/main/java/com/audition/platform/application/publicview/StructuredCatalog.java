package com.audition.platform.application.publicview;

import com.audition.platform.domain.audition.RecruitFieldCodes;

import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * ko/en/mn 정형 카테고리·태그 표시명을 내부 코드로 되돌린다.
 * 저장값(보컬, VOCAL 등)과 태그 id 는 바꾸지 않는다. 목록에 없는 임의 태그는 null 이다.
 */
public final class StructuredCatalog {

    private static final Map<String, String> LABELS = Map.ofEntries(
            Map.entry("dancer", "DANCE"),
            Map.entry("댄서", "DANCE"),
            Map.entry("бүжигчин", "DANCE"),
            Map.entry("рэп", "RAP"));

    private StructuredCatalog() {
    }

    /** 정형 표시명·코드면 VOCAL 같은 내부 키. 임의 문자열이면 null. */
    public static String key(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String normalized = RecruitFieldCodes.normalize(raw);
        if (RecruitFieldCodes.CODES.contains(normalized)) {
            return normalized;
        }
        return LABELS.get(raw.trim().toLowerCase(Locale.ROOT));
    }

    public static boolean matches(String key, String[] fields, List<String> tags) {
        if (key == null) {
            return false;
        }
        if (fields != null) {
            for (String field : fields) {
                if (key.equals(StructuredCatalog.key(field))) {
                    return true;
                }
            }
        }
        if (tags == null) {
            return false;
        }
        for (String tag : tags) {
            if (key.equals(StructuredCatalog.key(tag))) {
                return true;
            }
        }
        return false;
    }
}
