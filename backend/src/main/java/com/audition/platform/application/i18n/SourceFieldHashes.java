package com.audition.platform.application.i18n;

import com.audition.platform.domain.audition.Audition;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Map;
import java.util.TreeMap;

/**
 * 번역 한 건이 기준으로 삼은 원문. 제목·설명·본문만 해시하고 이미지·상태·기획사명은 넣지 않는다.
 * 세 해시는 정렬된 JSON 한 줄로 저장한다. 값이 비어 있어도 키는 유지해 필드 추가를 구분한다.
 */
public final class SourceFieldHashes {

    private SourceFieldHashes() {
    }

    public static String ofAudition(Audition audition) {
        return canonical(text(audition.getTitle()), text(audition.getDescription()), body(audition));
    }

    /**
     * 콘텐츠 번역 스냅샷. description 이 없으면 introText 를 설명으로 보고, 그 외 키는 본문으로 묶는다.
     */
    public static String ofContentFields(Map<String, String> fields) {
        Map<String, String> sorted = new TreeMap<>();
        if (fields != null) {
            sorted.putAll(fields);
        }
        String title = text(sorted.get("title"));
        String description = sorted.containsKey("description") ? text(sorted.get("description")) : text(sorted.get("introText"));
        StringBuilder body = new StringBuilder();
        sorted.forEach((key, value) -> {
            if ("title".equals(key) || "description".equals(key) || "introText".equals(key)) {
                return;
            }
            if (body.length() > 0) {
                body.append('\n');
            }
            body.append(key).append('=').append(text(value));
        });
        return canonical(title, description, body.toString());
    }

    /**
     * 저장된 필드 해시가 있으면 그 세 필드만 비교한다.
     * 없으면 기존 source_hash 로 비교한다. 둘 다 없으면 기준이 없는 것이다.
     */
    public static boolean differs(String storedFields, String currentFields, String storedHash, String currentHash) {
        if (present(storedFields)) {
            return !present(currentFields) || !storedFields.equals(currentFields);
        }
        if (present(storedHash)) {
            return !storedHash.equals(currentHash);
        }
        return true;
    }

    public static String titleHash(String title) {
        return sha(text(title));
    }

    public static String descriptionHash(String description) {
        return sha(text(description));
    }

    public static String bodyHash(String body) {
        return sha(text(body));
    }

    private static String canonical(String title, String description, String body) {
        return "{\"body\":\"" + bodyHash(body) + "\",\"description\":\"" + descriptionHash(description)
                + "\",\"title\":\"" + titleHash(title) + "\"}";
    }

    private static String body(Audition audition) {
        return join(audition.getRecruitFields()) + "\n"
                + join(audition.getQualifications()) + "\n"
                + join(audition.getSchedules()) + "\n"
                + join(audition.getBenefits());
    }

    private static String join(String[] values) {
        if (values == null || values.length == 0) {
            return "";
        }
        StringBuilder builder = new StringBuilder();
        for (String value : values) {
            if (builder.length() > 0) {
                builder.append('\u001f');
            }
            builder.append(text(value));
        }
        return builder.toString();
    }

    private static String text(String raw) {
        return raw == null ? "" : raw;
    }

    private static boolean present(String raw) {
        return raw != null && !raw.isBlank();
    }

    private static String sha(String canonical) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(canonical.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(digest.length * 2);
            for (byte b : digest) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (Exception e) {
            throw new IllegalStateException("SHA-256을 사용할 수 없습니다.", e);
        }
    }
}
