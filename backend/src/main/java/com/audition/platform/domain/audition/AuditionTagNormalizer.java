package com.audition.platform.domain.audition;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * 오디션 공고 태그: 허용 목록만 저장·응답 (검색/필터 SSOT).
 * 허용 목록에 없는 값은 서버에서 제거한다.
 */
public final class AuditionTagNormalizer {

    public static final List<String> ALLOWED_ORDERED = List.of("보컬", "댄서", "팀", "배우", "모델");

    private static final Set<String> ALLOWED = Set.copyOf(ALLOWED_ORDERED);

    private AuditionTagNormalizer() {
    }

    public static String[] normalize(List<String> incoming) {
        if (incoming == null || incoming.isEmpty()) {
            return new String[0];
        }
        LinkedHashSet<String> out = new LinkedHashSet<>();
        for (String raw : incoming) {
            if (raw == null) {
                continue;
            }
            String t = raw.trim();
            if (t.isEmpty() || !ALLOWED.contains(t)) {
                continue;
            }
            out.add(t);
        }
        return out.toArray(new String[0]);
    }
}
