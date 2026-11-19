package com.audition.platform.application.consent;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

/**
 * 회원 동의 기록(user_consents). 항목을 나눠 저장하고, 철회는 상태·시각으로 남긴다.
 * 미성년자 본인의 체크는 보호자 동의(GUARDIAN_CONSENT)가 아니다. GUARDIAN_CONSENT 는 보호자 확인 페이지에서만 쓴다.
 */
@Service
public class ConsentService {

    public static final String TERMS = "TERMS_OF_SERVICE";
    public static final String PRIVACY_COLLECTION = "PRIVACY_COLLECTION";
    public static final String PRIVACY_DISCLOSURE = "PRIVACY_DISCLOSURE";
    public static final String GUARDIAN = "GUARDIAN_CONSENT";
    public static final String MARKETING = "MARKETING";

    public static final String AGREED = "AGREED";
    public static final String WITHDRAWN = "WITHDRAWN";

    public static final String SRC_SIGNUP = "SIGNUP";
    public static final String SRC_SETTINGS = "SETTINGS";
    public static final String SRC_GUARDIAN = "GUARDIAN_LINK";
    public static final String SRC_ADMIN = "ADMIN";

    /** 회원 본인이 설정 화면에서 바꿀 수 있는 항목. */
    public static final Set<String> SELF_MANAGED = Set.of(MARKETING, PRIVACY_DISCLOSURE);

    private final JdbcTemplate jdbc;
    private final String termsVersion;

    public ConsentService(JdbcTemplate jdbc, @Value("${app.consent.terms-version:2026-11-19}") String termsVersion) {
        this.jdbc = jdbc;
        this.termsVersion = termsVersion;
    }

    public String termsVersion() {
        return termsVersion;
    }

    public record ConsentView(String type, String termsVersion, String status, Instant agreedAt, Instant withdrawnAt,
                              String source) {
    }

    public record SignupConsents(boolean terms, boolean privacyCollection, boolean privacyDisclosure, boolean marketing) {
    }

    /** 가입 필수 동의 확인. 지원자는 공개 범위 안내 동의까지 필수, 기획사 신청은 약관·수집만 필수. */
    public static void requireSignup(SignupConsents c, boolean applicant) {
        // 공개 범위 동의·마케팅은 선택. 선택 동의를 안 했다고 가입을 막지 않는다.
        if (c == null || !c.terms() || !c.privacyCollection()) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "CONSENT_REQUIRED");
        }
    }

    @Transactional
    public void recordSignup(UUID userId, SignupConsents c) {
        insert(userId, TERMS, AGREED, SRC_SIGNUP, null);
        insert(userId, PRIVACY_COLLECTION, AGREED, SRC_SIGNUP, null);
        if (c.privacyDisclosure()) {
            insert(userId, PRIVACY_DISCLOSURE, AGREED, SRC_SIGNUP, null);
        }
        if (c.marketing()) {
            insert(userId, MARKETING, AGREED, SRC_SIGNUP, null);
        }
    }

    public void insert(UUID userId, String type, String status, String source, UUID guardianConfirmationId) {
        Instant now = Instant.now();
        jdbc.update("""
                INSERT INTO user_consents (id, user_id, consent_type, terms_version, status, agreed_at, withdrawn_at,
                    source, guardian_confirmation_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, UUID.randomUUID(), userId, type, termsVersion, status,
                AGREED.equals(status) ? Timestamp.from(now) : null,
                WITHDRAWN.equals(status) ? Timestamp.from(now) : null, source, guardianConfirmationId);
    }

    /** 항목별 최신 기록. */
    public List<ConsentView> latest(UUID userId) {
        return jdbc.query("""
                SELECT DISTINCT ON (consent_type) consent_type, terms_version, status, agreed_at, withdrawn_at, source
                FROM user_consents WHERE user_id = ? ORDER BY consent_type, created_at DESC, id
                """, (rs, i) -> new ConsentView(rs.getString(1), rs.getString(2), rs.getString(3),
                ts(rs.getTimestamp(4)), ts(rs.getTimestamp(5)), rs.getString(6)), userId);
    }

    public String currentStatus(UUID userId, String type) {
        return latest(userId).stream().filter(c -> c.type().equals(type)).map(ConsentView::status).findFirst().orElse(null);
    }

    /** 최신 기록이 철회(WITHDRAWN)인 회원. 기록이 없는 기존 회원은 포함하지 않는다. */
    public Set<UUID> withdrawnAmong(Collection<UUID> ids, String type) {
        Set<UUID> out = new HashSet<>();
        if (ids == null || ids.isEmpty()) {
            return out;
        }
        jdbc.query("""
                SELECT user_id FROM (
                    SELECT DISTINCT ON (user_id) user_id, status FROM user_consents
                    WHERE consent_type = ? AND user_id = ANY (?) ORDER BY user_id, created_at DESC, id
                ) x WHERE status = 'WITHDRAWN'
                """, ps -> {
            ps.setString(1, type);
            ps.setArray(2, ps.getConnection().createArrayOf("uuid", ids.toArray()));
        }, rs -> {
            out.add(rs.getObject(1, UUID.class));
        });
        return out;
    }

    /** 본인 변경(마케팅 수신, 공개 범위). 같은 상태면 기록하지 않는다. */
    @Transactional
    public boolean setSelf(UUID userId, String rawType, boolean agree) {
        String type = rawType == null ? "" : rawType.trim().toUpperCase(Locale.ROOT);
        if (!SELF_MANAGED.contains(type)) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "CONSENT_TYPE_NOT_SELF_MANAGED");
        }
        String want = agree ? AGREED : WITHDRAWN;
        String cur = currentStatus(userId, type);
        if (want.equals(cur) || (cur == null && !agree)) {
            return false;
        }
        insert(userId, type, want, SRC_SETTINGS, null);
        return true;
    }

    private static Instant ts(Timestamp t) {
        return t == null ? null : t.toInstant();
    }
}
