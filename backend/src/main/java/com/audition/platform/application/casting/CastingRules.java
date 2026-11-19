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
        return clean(in, today, ZoneOffset.UTC);
    }

    /**
     * 마감일은 발송 기획사 시간대의 그날 23:59:59 까지다(시간대 미설정이면 UTC).
     * 저장·비교는 항상 절대 시각(Instant)으로 하므로 서버·클라이언트 시간대 차이와 무관하다.
     */
    public static CleanOffer clean(OfferInput in, LocalDate today, java.time.ZoneId zone) {
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
        Instant expires = deadline.plusDays(1).atStartOfDay(zone == null ? ZoneOffset.UTC : zone).toInstant().minusSeconds(1);
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

    // ───── 미성년자 보호: 제안 본문에 외부 연락 수단을 넣지 않는다 ─────
    private static final java.util.regex.Pattern URL = java.util.regex.Pattern.compile(
            "(?i)(https?://|www\\.|\\b[a-z0-9-]+\\.(com|net|org|kr|io|me|ly|gg|co|app|link|mn|kh|uz|jp)\\b|t\\.me/|wa\\.me/|kakao|instagram\\.com|telegram)");
    private static final java.util.regex.Pattern EMAIL = java.util.regex.Pattern.compile(
            "(?i)[a-z0-9._%+-]+\\s*(@|\\[at\\]|\\(at\\))\\s*[a-z0-9.-]+\\.[a-z]{2,}");
    private static final java.util.regex.Pattern PHONE = java.util.regex.Pattern.compile(
            "(\\+?\\d[\\d\\s().-]{7,}\\d)");

    /** URL·이메일·전화번호처럼 보이는 문자열이 있으면 true. */
    public static boolean containsContact(String text) {
        if (text == null || text.isBlank()) {
            return false;
        }
        if (URL.matcher(text).find() || EMAIL.matcher(text).find()) {
            return true;
        }
        java.util.regex.Matcher m = PHONE.matcher(text);
        while (m.find()) {
            long digits = m.group(1).chars().filter(Character::isDigit).count();
            if (digits >= 9) {
                return true;
            }
        }
        return false;
    }

    public static boolean containsContact(CleanOffer c) {
        for (String t : new String[]{c.title(), c.message(), c.workLocation(), c.scheduleText(), c.compensationNote()}) {
            if (containsContact(t)) {
                return true;
            }
        }
        return false;
    }

    /** 미성년자에게는 연락처 공유 요청을 붙이지 않는다. */
    public static CleanOffer withoutContactRequest(CleanOffer c) {
        return new CleanOffer(c.talentUserId(), c.branchId(), c.title(), c.projectType(), c.roleField(), c.message(),
                c.workCountry(), c.workLocation(), c.scheduleText(), c.compensationType(), c.compensationNote(),
                c.auditionId(), c.expiresAt(), false, c.sourceLocale());
    }
}
