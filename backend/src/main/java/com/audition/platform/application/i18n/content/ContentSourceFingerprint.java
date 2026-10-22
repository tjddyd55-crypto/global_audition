package com.audition.platform.application.i18n.content;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Map;
import java.util.TreeMap;

public final class ContentSourceFingerprint {

    private ContentSourceFingerprint() {
    }

    public static String hash(String sourceLocale, Map<String, String> fields) {
        StringBuilder payload = new StringBuilder();
        payload.append(sourceLocale == null ? "" : sourceLocale).append('\n');
        Map<String, String> sorted = new TreeMap<>();
        if (fields != null) {
            sorted.putAll(fields);
        }
        sorted.forEach((key, value) -> payload.append(key).append('=').append(value == null ? "" : value).append('\n'));
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(payload.toString().getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(digest.length * 2);
            for (byte b : digest) {
                hex.append(Character.forDigit((b >> 4) & 0xF, 16));
                hex.append(Character.forDigit(b & 0xF, 16));
            }
            return hex.toString();
        } catch (Exception e) {
            throw new IllegalStateException("content source hash failed", e);
        }
    }
}
