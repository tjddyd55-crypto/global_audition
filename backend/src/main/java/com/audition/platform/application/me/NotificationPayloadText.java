package com.audition.platform.application.me;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

/** 알림 payload_json 의 title/body. 깨진 JSON 은 빈 문자열로 두고 목록 전체를 실패시키지 않는다. */
public final class NotificationPayloadText {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private NotificationPayloadText() {
    }

    public static String text(String json, String field) {
        if (json == null || json.isBlank() || field == null) {
            return "";
        }
        try {
            JsonNode node = MAPPER.readTree(json);
            JsonNode value = node.get(field);
            if (value == null || value.isNull()) {
                return "";
            }
            return value.asText("");
        } catch (Exception ex) {
            return "";
        }
    }
}
