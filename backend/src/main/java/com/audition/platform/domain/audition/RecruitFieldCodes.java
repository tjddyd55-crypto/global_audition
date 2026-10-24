package com.audition.platform.domain.audition;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * 모집 분야 고정 코드 세트. 표시 문구는 프런트 i18n 카탈로그(recruitField.*)에서 만든다.
 * 알려진 한글/영문/몽골어 레거시 값은 코드로 정규화하고, 알 수 없는 자유 텍스트는 그대로 둔다.
 */
public final class RecruitFieldCodes {

    public static final List<String> CODES =
            List.of("VOCAL", "DANCE", "RAP", "PRODUCING", "ACTING", "MODEL", "TEAM");

    private static final Map<String, String> ALIASES = Map.ofEntries(
            Map.entry("vocal", "VOCAL"), Map.entry("vocals", "VOCAL"), Map.entry("vocalist", "VOCAL"),
            Map.entry("보컬", "VOCAL"), Map.entry("가수", "VOCAL"), Map.entry("дуу", "VOCAL"), Map.entry("дуучин", "VOCAL"),
            Map.entry("dance", "DANCE"), Map.entry("dancer", "DANCE"), Map.entry("댄스", "DANCE"), Map.entry("댄서", "DANCE"),
            Map.entry("бүжиг", "DANCE"), Map.entry("бүжигчин", "DANCE"),
            Map.entry("rap", "RAP"), Map.entry("rapper", "RAP"), Map.entry("랩", "RAP"), Map.entry("래퍼", "RAP"),
            Map.entry("producing", "PRODUCING"), Map.entry("producer", "PRODUCING"), Map.entry("production", "PRODUCING"),
            Map.entry("프로듀싱", "PRODUCING"), Map.entry("프로듀서", "PRODUCING"),
            Map.entry("acting", "ACTING"), Map.entry("actor", "ACTING"), Map.entry("actress", "ACTING"),
            Map.entry("연기", "ACTING"), Map.entry("배우", "ACTING"), Map.entry("жүжиглэх", "ACTING"), Map.entry("жүжигчин", "ACTING"),
            Map.entry("model", "MODEL"), Map.entry("modeling", "MODEL"), Map.entry("모델", "MODEL"), Map.entry("загвар өмсөгч", "MODEL"),
            Map.entry("team", "TEAM"), Map.entry("group", "TEAM"), Map.entry("팀", "TEAM"), Map.entry("баг", "TEAM"));

    private RecruitFieldCodes() {
    }

    public static String normalize(String raw) {
        if (raw == null) {
            return "";
        }
        String t = raw.trim();
        if (t.isEmpty()) {
            return t;
        }
        String upper = t.toUpperCase(Locale.ROOT);
        if (CODES.contains(upper)) {
            return upper;
        }
        String alias = ALIASES.get(t.toLowerCase(Locale.ROOT));
        return alias != null ? alias : t;
    }

    public static String[] normalizeAll(String[] values) {
        if (values == null) {
            return new String[0];
        }
        Set<String> out = new LinkedHashSet<>();
        for (String v : values) {
            String n = normalize(v);
            if (!n.isEmpty()) {
                out.add(n);
            }
        }
        return out.toArray(String[]::new);
    }
}
