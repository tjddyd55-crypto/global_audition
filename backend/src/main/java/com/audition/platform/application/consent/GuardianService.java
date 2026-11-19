package com.audition.platform.application.consent;

import com.audition.platform.domain.user.User;
import com.audition.platform.domain.user.UserRepository;
import com.audition.platform.infra.IpAddressHash;
import com.audition.platform.infra.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * 보호자 확인. 미성년자가 만든 일회용 링크를 보호자에게 전달하고, 보호자가 별도 페이지에서 확인한다.
 * 미성년자 본인 로그인 세션으로는 확인할 수 없다. 이메일·문자 발송은 하지 않는다(새 유료 서비스 없음).
 * 이 방식은 '보호자 본인 확인'을 법적으로 보증하지 않는다 → 확인 방식은 운영 정책 결정 항목.
 */
@Service
public class GuardianService {

    public static final Duration LINK_TTL = Duration.ofDays(7);
    public static final List<String> RELATIONSHIPS = List.of("PARENT", "LEGAL_GUARDIAN", "OTHER");

    private static final SecureRandom RANDOM = new SecureRandom();

    private final JdbcTemplate jdbc;
    private final UserRepository users;
    private final MinorPolicyService policies;
    private final ConsentService consents;

    public GuardianService(JdbcTemplate jdbc, UserRepository users, MinorPolicyService policies, ConsentService consents) {
        this.jdbc = jdbc;
        this.users = users;
        this.policies = policies;
        this.consents = consents;
    }

    public record Issued(String token, Instant expiresAt) {
    }

    /** 회원 본인에게 보이는 최신 요청 상태. 토큰 원문은 다시 보여주지 않는다. */
    public record MyGuardianView(String status, String guardianName, String relationship, Instant requestedAt,
                                 Instant expiresAt, Instant confirmedAt, Instant revokedAt) {
    }

    /** 보호자 페이지용. 미성년자의 생년월일·이메일·실명은 넣지 않는다. */
    public record PublicView(String status, String minorNickname, String policyCountry, Instant expiresAt,
                             String termsVersion) {
    }

    record Row(UUID id, UUID userId, String status, String guardianName, String relationship, Instant requestedAt,
               Instant expiresAt, Instant confirmedAt, Instant revokedAt, String policyCountry, String termsVersion) {
    }

    @Transactional
    public Issued request(UUID userId, String guardianName, String relationship, String guardianEmail) {
        User u = users.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "LOGIN_REQUIRED"));
        MinorPolicyService.Status st = policies.status(u);
        if (!st.ageKnown()) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "BIRTH_DATE_REQUIRED");
        }
        // 보호자 확인은 국가 기준 개인정보 보호자 동의 나이 미만(KR 14세 미만)에게만 제공한다.
        if (!st.guardianLegallyRequired()) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "GUARDIAN_NOT_NEEDED");
        }
        if (st.guardianConfirmed()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "GUARDIAN_ALREADY_CONFIRMED");
        }
        String rel = relationship(relationship);
        jdbc.update("UPDATE guardian_confirmations SET status = 'CANCELLED' WHERE user_id = ? AND status = 'PENDING'", userId);
        byte[] raw = new byte[32];
        RANDOM.nextBytes(raw);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(raw);
        Instant expires = Instant.now().plus(LINK_TTL);
        jdbc.update("""
                INSERT INTO guardian_confirmations (id, user_id, guardian_name, guardian_relationship, guardian_email,
                    token_hash, status, terms_version, policy_country, expires_at)
                VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?, ?, ?)
                """, UUID.randomUUID(), userId, text(guardianName, 80), rel, text(guardianEmail, 255), hash(token),
                consents.termsVersion(), st.policy().countryCode(), Timestamp.from(expires));
        return new Issued(token, expires);
    }

    @Transactional
    public void cancelPending(UUID userId) {
        jdbc.update("UPDATE guardian_confirmations SET status = 'CANCELLED' WHERE user_id = ? AND status = 'PENDING'", userId);
    }

    public Optional<MyGuardianView> mine(UUID userId) {
        return jdbc.query("""
                SELECT * FROM guardian_confirmations WHERE user_id = ? AND status <> 'CANCELLED'
                ORDER BY CASE status WHEN 'CONFIRMED' THEN 0 ELSE 1 END, created_at DESC LIMIT 1
                """, (rs, i) -> row(rs), userId).stream().findFirst()
                .map(r -> new MyGuardianView(effectiveStatus(r), r.guardianName(), r.relationship(), r.requestedAt(),
                        r.expiresAt(), r.confirmedAt(), r.revokedAt()));
    }

    public PublicView view(String token) {
        Row r = byToken(token);
        String nick = users.findById(r.userId()).map(User::getNickname).orElse(null);
        return new PublicView(effectiveStatus(r), nick, r.policyCountry(), r.expiresAt(), r.termsVersion());
    }

    public record ConfirmInput(String guardianName, String relationship, boolean agreeGuardian, boolean agreeTerms,
                               boolean agreePrivacy) {
    }

    @Transactional
    public PublicView confirm(String token, ConfirmInput in, String clientIp) {
        Row r = byToken(token);
        UUID viewer = SecurityUtils.getCurrentUserId();
        if (viewer != null && viewer.equals(r.userId())) {
            // 미성년자 본인 세션으로는 보호자 확인을 완료할 수 없다.
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "GUARDIAN_SELF_CONFIRM_FORBIDDEN");
        }
        if (!"PENDING".equals(effectiveStatus(r))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "GUARDIAN_LINK_NOT_PENDING");
        }
        if (in == null || !in.agreeGuardian() || !in.agreeTerms() || !in.agreePrivacy()) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "CONSENT_REQUIRED");
        }
        String name = text(in.guardianName(), 80);
        if (name == null) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "GUARDIAN_NAME_REQUIRED");
        }
        int n = jdbc.update("""
                UPDATE guardian_confirmations SET status = 'CONFIRMED', confirmed_at = NOW(), guardian_name = ?,
                    guardian_relationship = ?, confirm_ip_hash = ?
                WHERE id = ? AND status = 'PENDING'
                """, name, relationship(in.relationship()), IpAddressHash.sha256Hex(clientIp), r.id());
        if (n == 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "GUARDIAN_LINK_NOT_PENDING");
        }
        consents.insert(r.userId(), ConsentService.GUARDIAN, ConsentService.AGREED, ConsentService.SRC_GUARDIAN, r.id());
        return view(token);
    }

    /** 보호자가 같은 링크로 동의를 철회한다. 검색 노출·제안 수신은 정책에 맞게 다시 끈다. */
    @Transactional
    public PublicView revoke(String token) {
        Row r = byToken(token);
        UUID viewer = SecurityUtils.getCurrentUserId();
        if (viewer != null && viewer.equals(r.userId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "GUARDIAN_SELF_CONFIRM_FORBIDDEN");
        }
        revokeRow(r, "GUARDIAN");
        return view(token);
    }

    @Transactional
    public void revokeById(UUID confirmationId, String by) {
        Row r = jdbc.query("SELECT * FROM guardian_confirmations WHERE id = ?", (rs, i) -> row(rs), confirmationId)
                .stream().findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "GUARDIAN_NOT_FOUND"));
        revokeRow(r, by);
    }

    private void revokeRow(Row r, String by) {
        int n = jdbc.update("""
                UPDATE guardian_confirmations SET status = 'REVOKED', revoked_at = NOW(), revoked_by = ?
                WHERE id = ? AND status = 'CONFIRMED'
                """, by, r.id());
        if (n == 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "GUARDIAN_NOT_CONFIRMED");
        }
        consents.insert(r.userId(), ConsentService.GUARDIAN, ConsentService.WITHDRAWN, ConsentService.SRC_GUARDIAN, r.id());
        reconcile(r.userId());
    }

    /**
     * 생년월일·적용 국가·보호자 상태가 바뀐 뒤 다시 판정한다. 지금 허용되지 않는 검색 노출·제안 수신만 끈다(켜지는 않는다).
     */
    @Transactional
    public void reconcile(UUID userId) {
        User u = userId == null ? null : users.findById(userId).orElse(null);
        if (u == null) {
            return;
        }
        MinorPolicyService.Status st = policies.status(u);
        boolean changed = false;
        if (u.isCastingOffersEnabled() && !st.offersAllowed()) {
            u.setCastingOffersEnabled(false);
            changed = true;
        }
        if (u.isTalentSearchVisible() && !st.searchAllowed()) {
            u.setTalentSearchVisible(false);
            changed = true;
        }
        if (changed) {
            u.setUpdatedAt(Instant.now());
            users.save(u);
        }
    }

    private Row byToken(String token) {
        if (token == null || token.isBlank() || token.length() > 100) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "GUARDIAN_LINK_NOT_FOUND");
        }
        return jdbc.query("SELECT * FROM guardian_confirmations WHERE token_hash = ?", (rs, i) -> row(rs), hash(token.trim()))
                .stream().findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "GUARDIAN_LINK_NOT_FOUND"));
    }

    static String effectiveStatus(Row r) {
        if ("PENDING".equals(r.status()) && r.expiresAt() != null && !r.expiresAt().isAfter(Instant.now())) {
            return "EXPIRED";
        }
        return r.status();
    }

    private static Row row(java.sql.ResultSet rs) throws java.sql.SQLException {
        return new Row(rs.getObject("id", UUID.class), rs.getObject("user_id", UUID.class), rs.getString("status"),
                rs.getString("guardian_name"), rs.getString("guardian_relationship"), ts(rs.getTimestamp("requested_at")),
                ts(rs.getTimestamp("expires_at")), ts(rs.getTimestamp("confirmed_at")), ts(rs.getTimestamp("revoked_at")),
                rs.getString("policy_country"), rs.getString("terms_version"));
    }

    static String relationship(String raw) {
        String r = raw == null ? "" : raw.trim().toUpperCase(java.util.Locale.ROOT);
        return RELATIONSHIPS.contains(r) ? r : "OTHER";
    }

    static String hash(String token) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    private static String text(String s, int max) {
        if (s == null || s.isBlank()) {
            return null;
        }
        String t = s.trim();
        return t.length() > max ? t.substring(0, max) : t;
    }

    private static Instant ts(Timestamp t) {
        return t == null ? null : t.toInstant();
    }
}
