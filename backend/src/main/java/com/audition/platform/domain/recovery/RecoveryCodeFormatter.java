package com.audition.platform.domain.recovery;

import java.security.SecureRandom;

/**
 * 사람이 읽을 수 있는 고엔트로피 복구 코드.
 * 혼동 문자(0/O, 1/I/L)를 제외한 32자 알파벳, 12자리 ≈ 60bit.
 */
public final class RecoveryCodeFormatter {

    public static final String ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    public static final int RAW_LENGTH = 12;
    private static final SecureRandom RANDOM = new SecureRandom();

    private RecoveryCodeFormatter() {
    }

    public static String generateDisplayCode() {
        StringBuilder raw = new StringBuilder(RAW_LENGTH);
        for (int i = 0; i < RAW_LENGTH; i++) {
            raw.append(ALPHABET.charAt(RANDOM.nextInt(ALPHABET.length())));
        }
        return format(raw.toString());
    }

    public static String format(String normalized) {
        if (normalized.length() != RAW_LENGTH) {
            return normalized;
        }
        return normalized.substring(0, 4) + "-" + normalized.substring(4, 8) + "-" + normalized.substring(8, 12);
    }

    public static String normalize(String raw) {
        if (raw == null) {
            return "";
        }
        StringBuilder out = new StringBuilder();
        for (int i = 0; i < raw.length(); i++) {
            char c = Character.toUpperCase(raw.charAt(i));
            if (ALPHABET.indexOf(c) >= 0) {
                out.append(c);
            }
        }
        return out.toString();
    }

    public static boolean hasValidShape(String normalized) {
        return normalized.length() == RAW_LENGTH;
    }
}
