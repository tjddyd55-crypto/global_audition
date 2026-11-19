package com.audition.platform.application.casting;

import java.time.Instant;
import java.util.List;

/** 캐스팅 API 응답 레코드(필요한 값만, 내부 메모·연락처는 조건부). */
public final class CastingViews {

    private CastingViews() {
    }

    public record Party(String userId, String name, String profileImageUrl, String countryCode) {
    }

    public record EventView(String fromStatus, String toStatus, String actorKind, Instant createdAt) {
    }

    /** 연락처는 지원자가 수락하며 공유에 동의했을 때만 기획사에 채워진다. */
    public record SharedContact(String email, String phone) {
    }

    public record OfferView(
            String id,
            String status,
            String title,
            String projectType,
            String roleField,
            String message,
            String workCountry,
            String workLocation,
            String scheduleText,
            String compensationType,
            String compensationNote,
            String auditionId,
            boolean contactRequested,
            boolean contactShared,
            String sourceLocale,
            Instant expiresAt,
            Instant readAt,
            Instant respondedAt,
            String responseReason,
            String responseNote,
            Instant createdAt,
            Party agency,
            Party talent,
            SharedContact contact,
            List<EventView> history,
            boolean agencyBlocked,
            /** 서버 시각 기준 마감 경과(상태가 아직 SENT/READ 로 남아 있어도 즉시 true). */
            boolean expired,
            /** 아직 열린 제안인지(지원자 수락·거절, 기획사 철회 가능). 서버 시각 판정이며 클라이언트 시계를 믿지 않는다. */
            boolean respondable,
            /** 응답 시각(UTC). 클라이언트 시계 차이 보정용. */
            Instant serverNow) {
    }

    public record Quota(int sentToday, int dailyLimit, boolean restricted, String restrictedReason, boolean approved) {
    }

    public record Preview(OfferView offer, List<String> warnings) {
    }
}
