package com.audition.platform.application.i18n;

import com.audition.platform.domain.audition.Audition;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Arrays;
import java.util.stream.Collectors;

/**
 * 번역 시점의 원문 지문. 번역 가능한 텍스트만 포함하고 이미지·상태는 빼 둔다.
 */
public final class AuditionSourceFingerprint {

    private AuditionSourceFingerprint() {
    }

    public static String hash(Audition audition) {
        String canonical = String.join(
                "\n",
                text(audition.getTitle()),
                text(audition.getDescription()),
                text(audition.getLocation()),
                text(audition.getAgencyName()),
                join(audition.getRecruitFields()),
                join(audition.getQualifications()),
                join(audition.getSchedules()),
                join(audition.getBenefits()));
        return sha256(canonical);
    }

    public static boolean matches(Audition audition, String storedHash) {
        return storedHash != null && storedHash.equals(hash(audition));
    }

    private static String text(String raw) {
        return raw == null ? "" : raw;
    }

    private static String join(String[] values) {
        if (values == null || values.length == 0) {
            return "";
        }
        return Arrays.stream(values).map(AuditionSourceFingerprint::text).collect(Collectors.joining("\u001f"));
    }

    private static String sha256(String canonical) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(canonical.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(digest.length * 2);
            for (byte b : digest) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256을 사용할 수 없습니다.", e);
        }
    }
}
