package com.audition.platform.application.consent;

import com.audition.platform.application.audit.AdminAuditLogService;
import com.audition.platform.application.org.OrgAccess;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/** 본사(슈퍼) 관리자: 국가별 미성년자 정책, 동의·보호자 확인 현황, 선발 이후 동의 요건. 변경은 감사 로그. */
@Service
public class MinorPolicyAdminService {

    public static final Set<String> ACTIVITIES = Set.of("FINAL_CONTRACT", "EXCLUSIVE_CONTRACT", "TRAINEE_CONTRACT",
            "IN_PERSON_AUDITION", "OVERSEAS_TRAVEL", "TRAVEL_LODGING", "FILMING_PERFORMANCE", "PORTRAIT_CONTENT_RIGHTS",
            "OTHER_GUARDIAN_REQUIRED");
    public static final Set<String> REQUIREMENT_STATUSES = Set.of("REQUIRED", "IN_PROGRESS", "SATISFIED", "NOT_REQUIRED",
            "CANCELLED");

    private final OrgAccess access;
    private final JdbcTemplate jdbc;
    private final MinorPolicyService policies;
    private final GuardianService guardians;
    private final AdminAuditLogService audit;

    public MinorPolicyAdminService(OrgAccess access, JdbcTemplate jdbc, MinorPolicyService policies,
                                   GuardianService guardians, AdminAuditLogService audit) {
        this.access = access;
        this.jdbc = jdbc;
        this.policies = policies;
        this.guardians = guardians;
        this.audit = audit;
    }

    public record BirthDateCorrection(String birthDate, String reason) {
    }

    /**
     * 생년월일 정정(본사 관리자만). 회원은 직접 바꿀 수 없다. 변경 전·후·사유·관리자·일시를 감사 로그에 남기고 연령 정책을 다시 판정한다.
     */
    @Transactional
    public Map<String, Object> correctBirthDate(UUID userId, BirthDateCorrection in) {
        var admin = access.requireHq();
        java.time.LocalDate next = ProfileCodes.birthDate(in == null ? null : in.birthDate());
        String reason = in == null || in.reason() == null ? "" : in.reason().trim();
        if (next == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "정정할 생년월일을 입력해 주세요.");
        }
        if (reason.length() < 2) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "정정 사유를 입력해 주세요.");
        }
        List<java.sql.Date> cur = jdbc.queryForList("SELECT birth_date FROM users WHERE id = ?", java.sql.Date.class, userId);
        if (cur.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "회원을 찾을 수 없습니다.");
        }
        String before = cur.get(0) == null ? null : cur.get(0).toLocalDate().toString();
        jdbc.update("UPDATE users SET birth_date = ?, updated_at = NOW() WHERE id = ?", java.sql.Date.valueOf(next), userId);
        Map<String, Object> after = new LinkedHashMap<>();
        after.put("birthDate", next.toString());
        after.put("reason", reason);
        Map<String, Object> beforeMap = new LinkedHashMap<>();
        beforeMap.put("birthDate", before);
        audit.log(admin.id(), "BIRTH_DATE_CORRECTION", "USER", userId.toString(), beforeMap, after);
        guardians.reconcile(userId);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("before", before);
        out.put("after", next.toString());
        return out;
    }

    public List<MinorPolicyService.Policy> list() {
        access.requireHq();
        return policies.all();
    }

    public record PolicyInput(Integer adultAge, Integer guardianConsentUnderAge, Boolean guardianRequiredForApply,
                              Boolean minorOffersRequireGuardian, Boolean minorContactSharingAllowed, String note) {
    }

    @Transactional
    public MinorPolicyService.Policy upsert(String rawCountry, PolicyInput in) {
        OrgAccess.Actor admin = access.requireHq();
        String country = rawCountry == null ? "" : rawCountry.trim().toUpperCase(Locale.ROOT);
        if (!MinorPolicyService.DEFAULT_COUNTRY.equals(country) && !country.matches("[A-Z]{2}")) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "국가 코드가 올바르지 않습니다.");
        }
        if (in == null || in.adultAge() == null || in.guardianConsentUnderAge() == null
                || in.adultAge() < 10 || in.adultAge() > 30 || in.guardianConsentUnderAge() < 0
                || in.guardianConsentUnderAge() > in.adultAge()) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "나이 기준이 올바르지 않습니다(성년 10~30세, 보호자 동의 기준 ≤ 성년 나이).");
        }
        MinorPolicyService.Policy before = policies.byCountry().get(country);
        MinorPolicyService.Policy next = new MinorPolicyService.Policy(country, in.adultAge(), in.guardianConsentUnderAge(),
                in.guardianRequiredForApply() == null || in.guardianRequiredForApply(),
                in.minorOffersRequireGuardian() == null || in.minorOffersRequireGuardian(),
                Boolean.TRUE.equals(in.minorContactSharingAllowed()),
                in.note() == null || in.note().isBlank() ? null : in.note().trim(), null);
        policies.upsert(next, admin.id());
        audit.log(admin.id(), "MINOR_POLICY_UPSERT", "COUNTRY_MINOR_POLICY", country, before, next);
        return policies.byCountry().get(country);
    }

    public record Summary(Map<String, Map<String, Integer>> consents, Map<String, Integer> guardians,
                          int membersWithoutConsentRecords, int requirementsOpen) {
    }

    public Summary summary() {
        access.requireHq();
        Map<String, Map<String, Integer>> c = new LinkedHashMap<>();
        jdbc.query("""
                SELECT consent_type, status, COUNT(*) FROM (
                    SELECT DISTINCT ON (user_id, consent_type) user_id, consent_type, status FROM user_consents
                    ORDER BY user_id, consent_type, created_at DESC, id
                ) x GROUP BY consent_type, status ORDER BY consent_type, status
                """, rs -> {
            c.computeIfAbsent(rs.getString(1), k -> new LinkedHashMap<>()).put(rs.getString(2), rs.getInt(3));
        });
        Map<String, Integer> g = new LinkedHashMap<>();
        jdbc.query("SELECT status, COUNT(*) FROM guardian_confirmations GROUP BY status ORDER BY status",
                rs -> {
                    g.put(rs.getString(1), rs.getInt(2));
                });
        Integer legacy = jdbc.queryForObject("""
                SELECT COUNT(*) FROM users u WHERE u.role = 'APPLICANT'
                  AND NOT EXISTS (SELECT 1 FROM user_consents c WHERE c.user_id = u.id)
                """, Integer.class);
        Integer open = jdbc.queryForObject(
                "SELECT COUNT(*) FROM post_selection_consent_requirements WHERE status IN ('REQUIRED', 'IN_PROGRESS')",
                Integer.class);
        return new Summary(c, g, legacy == null ? 0 : legacy, open == null ? 0 : open);
    }

    public record ConsentRow(String type, String termsVersion, String status, Instant agreedAt, Instant withdrawnAt,
                             String source, Instant createdAt) {
    }

    public record GuardianRow(String id, String status, String guardianName, String relationship, String guardianEmailMasked,
                              String method, String policyCountry, Instant requestedAt, Instant expiresAt,
                              Instant confirmedAt, Instant revokedAt, String revokedBy) {
    }

    public record RequirementRow(String id, String applicationId, String castingOfferId, String activityType,
                                 boolean guardianRequired, String status, String note, Instant createdAt, Instant updatedAt) {
    }

    public record UserConsents(String userId, String nickname, String countryCode, boolean birthDateSet,
                               PrivacySettingsService.MinorView minor, List<ConsentRow> history,
                               List<GuardianRow> guardians, List<RequirementRow> requirements) {
    }

    public UserConsents user(UUID userId) {
        access.requireHq();
        Map<String, Object> u = jdbc.queryForList("SELECT nickname, country_code, birth_date FROM users WHERE id = ?", userId)
                .stream().findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "회원을 찾을 수 없습니다."));
        List<ConsentRow> history = jdbc.query("""
                SELECT consent_type, terms_version, status, agreed_at, withdrawn_at, source, created_at
                FROM user_consents WHERE user_id = ? ORDER BY created_at DESC
                """, (rs, i) -> new ConsentRow(rs.getString(1), rs.getString(2), rs.getString(3), ts(rs.getTimestamp(4)),
                ts(rs.getTimestamp(5)), rs.getString(6), ts(rs.getTimestamp(7))), userId);
        List<GuardianRow> gs = jdbc.query("""
                SELECT id, status, guardian_name, guardian_relationship, guardian_email, method, policy_country,
                       requested_at, expires_at, confirmed_at, revoked_at, revoked_by
                FROM guardian_confirmations WHERE user_id = ? ORDER BY created_at DESC
                """, (rs, i) -> new GuardianRow(rs.getString(1), rs.getString(2), rs.getString(3), rs.getString(4),
                mask(rs.getString(5)), rs.getString(6), rs.getString(7), ts(rs.getTimestamp(8)), ts(rs.getTimestamp(9)),
                ts(rs.getTimestamp(10)), ts(rs.getTimestamp(11)), rs.getString(12)), userId);
        com.audition.platform.domain.user.User user = new com.audition.platform.domain.user.User();
        user.setId(userId);
        user.setCountryCode((String) u.get("country_code"));
        Object bd = u.get("birth_date");
        user.setBirthDate(bd instanceof java.sql.Date d ? d.toLocalDate() : null);
        MinorPolicyService.Status st = policies.status(user);
        PrivacySettingsService.MinorView mv = new PrivacySettingsService.MinorView(st.ageKnown(), st.minor(),
                st.guardianLegallyRequired(), st.guardianConfirmed(), st.policy().countryCode(), st.policy().adultAge(),
                st.policy().guardianConsentUnderAge(), st.applyAllowed(), st.searchAllowed(), st.offersAllowed(),
                st.contactSharingAllowed(), st.offersBlockReason());
        return new UserConsents(userId.toString(), (String) u.get("nickname"), (String) u.get("country_code"),
                bd != null, mv, history, gs, requirements(userId));
    }

    @Transactional
    public void revokeGuardian(UUID confirmationId) {
        OrgAccess.Actor admin = access.requireHq();
        guardians.revokeById(confirmationId, "ADMIN");
        audit.log(admin.id(), "GUARDIAN_REVOKE", "GUARDIAN_CONFIRMATION", confirmationId.toString(), null, Map.of("status", "REVOKED"));
    }

    public record RequirementInput(UUID userId, UUID applicationId, UUID castingOfferId, String activityType,
                                   Boolean guardianRequired, String status, String note) {
    }

    /** 선발 이후 활동별 동의 요건 등록. 계약서·양식은 만들지 않고 상태만 연결한다. */
    @Transactional
    public RequirementRow createRequirement(RequirementInput in) {
        OrgAccess.Actor admin = access.requireHq();
        if (in == null || in.userId() == null || in.activityType() == null
                || !ACTIVITIES.contains(in.activityType().trim().toUpperCase(Locale.ROOT))) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "활동 유형이 올바르지 않습니다.");
        }
        boolean guardian = in.guardianRequired() != null ? in.guardianRequired() : minorOf(in.userId());
        UUID id = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO post_selection_consent_requirements (id, user_id, application_id, casting_offer_id,
                    activity_type, guardian_required, status, note, created_by)
                VALUES (?, ?, ?, ?, ?, ?, 'REQUIRED', ?, ?)
                """, id, in.userId(), in.applicationId(), in.castingOfferId(),
                in.activityType().trim().toUpperCase(Locale.ROOT), guardian, in.note(), admin.id());
        audit.log(admin.id(), "POST_SELECTION_REQUIREMENT_CREATE", "USER", in.userId().toString(), null, in);
        return requirements(in.userId()).stream().filter(r -> r.id().equals(id.toString())).findFirst().orElseThrow();
    }

    @Transactional
    public void setRequirementStatus(UUID id, String rawStatus, String note) {
        OrgAccess.Actor admin = access.requireHq();
        String status = rawStatus == null ? "" : rawStatus.trim().toUpperCase(Locale.ROOT);
        if (!REQUIREMENT_STATUSES.contains(status)) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "상태가 올바르지 않습니다.");
        }
        int n = jdbc.update("UPDATE post_selection_consent_requirements SET status = ?, note = COALESCE(?, note), updated_at = NOW() WHERE id = ?",
                status, note, id);
        if (n == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "요건을 찾을 수 없습니다.");
        }
        audit.log(admin.id(), "POST_SELECTION_REQUIREMENT_STATUS", "POST_SELECTION_REQUIREMENT", id.toString(), null, Map.of("status", status));
    }

    public List<RequirementRow> requirements(UUID userId) {
        return jdbc.query("""
                SELECT id, application_id, casting_offer_id, activity_type, guardian_required, status, note, created_at, updated_at
                FROM post_selection_consent_requirements WHERE user_id = ? ORDER BY created_at DESC
                """, (rs, i) -> new RequirementRow(rs.getString(1), rs.getString(2), rs.getString(3), rs.getString(4),
                rs.getBoolean(5), rs.getString(6), rs.getString(7), ts(rs.getTimestamp(8)), ts(rs.getTimestamp(9))), userId);
    }

    private boolean minorOf(UUID userId) {
        Map<String, Object> u = jdbc.queryForList("SELECT country_code, birth_date FROM users WHERE id = ?", userId)
                .stream().findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "회원을 찾을 수 없습니다."));
        Object bd = u.get("birth_date");
        MinorPolicyService.Status st = MinorPolicyService.evaluate(bd instanceof java.sql.Date d ? d.toLocalDate() : null,
                policies.policyFor((String) u.get("country_code")), false);
        return st.minor();
    }

    static String mask(String email) {
        if (email == null || email.isBlank()) {
            return null;
        }
        int at = email.indexOf('@');
        if (at <= 1) {
            return "***" + (at >= 0 ? email.substring(at) : "");
        }
        return email.charAt(0) + "***" + email.substring(at);
    }

    private static Instant ts(Timestamp t) {
        return t == null ? null : t.toInstant();
    }
}
