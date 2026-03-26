package com.audition.platform.domain.user;

import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * 닉네임 규칙: 공개 정체성. DB 유효 길이(백필 접미사)는 50자까지 허용되나 신규·변경은 {@link #MAX_NEW_LEN}으로 제한.
 */
public final class NicknamePolicy {

    public static final int MIN_LEN = 2;
    /** 신규 가입·변경 시 최대 길이(레거시 행은 더 길 수 있음). */
    public static final int MAX_NEW_LEN = 20;

    private static final Pattern ALLOWED = Pattern.compile("^[a-zA-Z0-9가-힣._]+$");

    private static final Set<String> RESERVED_LOWER = Set.of(
            "admin",
            "administrator",
            "root",
            "system",
            "support",
            "official",
            "superadmin",
            "moderator",
            "운영자",
            "관리자",
            "staff"
    );

    private NicknamePolicy() {
    }

    public static String normalizeInput(String raw) {
        if (raw == null) {
            return "";
        }
        return raw.trim();
    }

    /**
     * 신규/변경 닉네임 형식 검증.
     *
     * @throws IllegalArgumentException 규칙 위반 시
     */
    public static void validateOrThrow(String trimmedNickname) {
        String n = trimmedNickname;
        if (n.length() < MIN_LEN || n.length() > MAX_NEW_LEN) {
            throw new IllegalArgumentException("닉네임은 2~20자여야 합니다.");
        }
        if (!ALLOWED.matcher(n).matches()) {
            throw new IllegalArgumentException("닉네임은 한글·영문·숫자·밑줄·점만 사용할 수 있습니다.");
        }
        String lower = n.toLowerCase(Locale.ROOT);
        if (RESERVED_LOWER.contains(lower)) {
            throw new IllegalArgumentException("사용할 수 없는 닉네임입니다.");
        }
    }
}
