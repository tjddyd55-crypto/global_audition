package com.audition.platform.application.casting;

import com.audition.platform.domain.audition.RecruitFieldCodes;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

/** 제안 입력 검증과 반복·대량 발송 제한 값. */
public final class CastingRules {

    public static final List<String> PROJECT_TYPES =
            List.of("AUDITION_INVITE", "TRAINEE", "PROJECT", "CONTENT_COLLAB", "MODEL_SHOOT", "OTHER");
    public static final List<String> COMPENSATION_TYPES = List.of("PAID", "UNPAID", "NEGOTIABLE", "TBD");
    public static final List<String> REPORT_REASONS =
            List.of("SPAM", "FRAUD", "EXTERNAL_PAYMENT", "HARASSMENT", "INAPPROPRIATE", "OTHER");
    public static final List<String> DECLINE_REASONS =
            List.of("NOT_INTERESTED", "SCHEDULE", "FIELD_MISMATCH", "LOCATION", "OTHER");
    public static final Set<String> WORK_COUNTRIES = Set.of("KR", "MN", "JP", "KH", "UZ", "OTHER");

    /** 기획사 하루 발송 기본 한도(슈퍼관리자가 기획사별로 조정). */
    public static final int DEFAULT_DAILY_LIMIT = 20;
    /** 같은 인재에게 90일 동안 보낼 수 있는 최대 건수. */
    public static final int PAIR_MAX_90_DAYS = 3;
    /** 거절 후 같은 기획사가 다시 보내기까지 대기. */
    public static final Duration DECLINE_COOLDOWN = Duration.ofDays(30);
    public static final int MIN_DEADLINE_DAYS = 1;
    public static final int MAX_DEADLINE_DAYS = 30;
    public static final int DEFAULT_DEADLINE_DAYS = 14;
    public static final Duration DEADLINE_NOTICE = Duration.ofHours(24);

    private CastingRules() {
    }

    public record OfferInput(
            UUID talentUserId,
            UUID branchId,
            String title,
            String projectType,
            String roleField,
            String message,
            String workCountry,
            String workLocation,
            String scheduleText,
            String compensationType,
            String compensationNote,
            UUID auditionId,
            LocalDate responseDeadline,
            Boolean contactRequested,
            String sourceLocale) {
    }

    public record CleanOffer(
            UUID talentUserId,
            UUID branchId,
            String title,
            String projectType,
            String roleField,
            String message,
            String workCountry,
            String workLocation,
            String scheduleText,
            String compensationType,
            String compensationNote,
            UUID auditionId,
            Instant expiresAt,
            boolean contactRequested,
            String sourceLocale) {
    }

    public static CleanOffer clean(OfferInput in, LocalDate today) {
        if (in == null || in.talentUserId() == null) {
            throw bad("OFFER_TALENT_REQUIRED");
        }
        String title = text(in.title(), 120);
        if (title == null) {
            throw bad("OFFER_TITLE_REQUIRED");
        }
        String message = text(in.message(), 2000);
        if (message == null) {
            throw bad("OFFER_MESSAGE_REQUIRED");
        }
        String project = code(in.projectType());
        if (project == null || !PROJECT_TYPES.contains(project)) {
            throw bad("OFFER_PROJECT_TYPE_INVALID");
        }
        String field = RecruitFieldCodes.normalize(in.roleField());
        if (!RecruitFieldCodes.CODES.contains(field)) {
            throw bad("OFFER_FIELD_INVALID");
        }
        String comp = code(in.compensationType());
        if (comp == null) {
            comp = "TBD";
        }
        if (!COMPENSATION_TYPES.contains(comp)) {
            throw bad("OFFER_COMPENSATION_INVALID");
        }
        String country = code(in.workCountry());
        if (country != null && !WORK_COUNTRIES.contains(country)) {
            throw bad("OFFER_COUNTRY_INVALID");
        }
        LocalDate deadline = in.responseDeadline() != null ? in.responseDeadline() : today.plusDays(DEFAULT_DEADLINE_DAYS);
        if (deadline.isBefore(today.plusDays(MIN_DEADLINE_DAYS)) || deadline.isAfter(today.plusDays(MAX_DEADLINE_DAYS))) {
            throw bad("OFFER_DEADLINE_INVALID");
        }
        Instant expires = deadline.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant().minusSeconds(1);
        return new CleanOffer(in.talentUserId(), in.branchId(), title, project, field, message, country,
                text(in.workLocation(), 120), text(in.scheduleText(), 200), comp, text(in.compensationNote(), 200),
                in.auditionId(), expires, Boolean.TRUE.equals(in.contactRequested()), locale(in.sourceLocale()));
    }

    public static String reportReason(String raw) {
        String c = code(raw);
        if (c == null || !REPORT_REASONS.contains(c)) {
            throw bad("REPORT_REASON_INVALID");
        }
        return c;
    }

    public static String declineReason(String raw) {
        String c = code(raw);
        if (c == null) {
            return null;
        }
        if (!DECLINE_REASONS.contains(c)) {
            throw bad("DECLINE_REASON_INVALID");
        }
        return c;
    }

    public static String text(String raw, int max) {
        if (raw == null) {
            return null;
        }
        String t = raw.trim();
        if (t.isEmpty()) {
            return null;
        }
        return t.length() > max ? t.substring(0, max) : t;
    }

    private static String code(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        return raw.trim().toUpperCase(Locale.ROOT);
    }

    private static String locale(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String l = raw.trim().toLowerCase(Locale.ROOT);
        return l.length() > 10 ? l.substring(0, 10) : l;
    }

    static ResponseStatusException bad(String code) {
        return new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, code);
    }
}
