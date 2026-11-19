package com.audition.platform.application.consent;

import com.audition.platform.application.channel.ChannelPortfolioRules;
import com.audition.platform.domain.user.User;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * 국가별 미성년자·법정대리인 정책(country_minor_policies)과 회원별 판정.
 * 연령 기준은 코드에 두지 않고 표에서 읽는다. 표에 없는 국가는 'DEFAULT' 행을 쓴다.
 * 판정 기준 국가: 가입 국가(country_code) → 거주 국가 → 국적 → DEFAULT.
 */
@Service
public class MinorPolicyService {

    public static final String DEFAULT_COUNTRY = "DEFAULT";

    private final JdbcTemplate jdbc;

    public MinorPolicyService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public record Policy(String countryCode, int adultAge, int guardianConsentUnderAge, boolean guardianRequiredForApply,
                         boolean minorOffersRequireGuardian, boolean minorContactSharingAllowed, String note,
                         Instant updatedAt) {
    }

    /**
     * 회원 판정 결과. age 는 내부 판정용이며 공개 응답에 넣지 않는다.
     * guardianLegallyRequired: 해당 국가 기준 법정대리인 동의가 필요한 나이.
     */
    public record Status(Integer age, boolean ageKnown, boolean minor, boolean guardianLegallyRequired,
                         boolean guardianConfirmed, Policy policy) {

        /** 인재 검색 노출: 법정대리인 동의가 필요한 나이면 보호자 확인이 있어야 한다. */
        public boolean searchAllowed() {
            return !guardianLegallyRequired || guardianConfirmed;
        }

        /**
         * 캐스팅 제안 수신: 나이를 알아야 하고(생년월일), 미성년자는 정책상 보호자 확인이 있어야 한다.
         */
        public boolean offersAllowed() {
            if (!ageKnown) {
                return false;
            }
            if (guardianLegallyRequired && !guardianConfirmed) {
                return false;
            }
            return !minor || !policy.minorOffersRequireGuardian() || guardianConfirmed;
        }

        /** 오디션 지원: 법정대리인 동의가 필요한 나이에서 국가 정책이 지원 전 확인을 요구할 때만 막는다. */
        public boolean applyAllowed() {
            return !(guardianLegallyRequired && policy.guardianRequiredForApply() && !guardianConfirmed);
        }

        /** 연락처 공유: 성인은 기존대로. 미성년자는 국가 정책이 허용할 때만(기본 불가). */
        public boolean contactSharingAllowed() {
            return !minor || policy.minorContactSharingAllowed();
        }

        /**
         * 유료 결제(크레딧 구매 등): 국가 정책의 개인정보 보호자 동의 기준 나이 미만(KR 14세 미만)이고 보호자 확인 전이면 막는다.
         * 그 이상 미성년자는 보호자 확인 없이 결제할 수 있다. 나이 기준은 country_minor_policies.guardian_consent_under_age 로 정한다.
         */
        public boolean paymentAllowed() {
            return !guardianLegallyRequired || guardianConfirmed;
        }

        public String offersBlockReason() {
            if (offersAllowed()) {
                return null;
            }
            return ageKnown ? "CASTING_GUARDIAN_REQUIRED" : "CASTING_BIRTH_DATE_REQUIRED";
        }
    }

    public static LocalDate today() {
        return LocalDate.now(ZoneOffset.UTC);
    }

    public List<Policy> all() {
        return jdbc.query("SELECT * FROM country_minor_policies ORDER BY CASE WHEN country_code = 'DEFAULT' THEN 0 ELSE 1 END, country_code",
                (rs, i) -> map(rs));
    }

    public Map<String, Policy> byCountry() {
        Map<String, Policy> out = new HashMap<>();
        for (Policy p : all()) {
            out.put(p.countryCode(), p);
        }
        return out;
    }

    public Policy policyFor(String countryCode) {
        return resolvePolicy(byCountry(), countryCode);
    }

    public static Policy resolvePolicy(Map<String, Policy> policies, String countryCode) {
        String c = countryCode == null ? null : countryCode.trim().toUpperCase(Locale.ROOT);
        Policy p = c == null || c.isEmpty() ? null : policies.get(c);
        if (p == null) {
            p = policies.get(DEFAULT_COUNTRY);
        }
        if (p == null) {
            // 표가 비어 있으면 가장 보수적인 값(18세 미만 전원 보호자 확인).
            p = new Policy(DEFAULT_COUNTRY, 18, 18, true, true, false, null, null);
        }
        return p;
    }

    public static String policyCountry(String countryCode, String residence, String nationality) {
        for (String c : new String[]{countryCode, residence, nationality}) {
            if (c != null && !c.isBlank() && !"OTHER".equalsIgnoreCase(c.trim())) {
                return c.trim().toUpperCase(Locale.ROOT);
            }
        }
        return null;
    }

    public Status status(User u) {
        if (u == null) {
            return evaluate(null, policyFor(null), false);
        }
        Policy p = policyFor(policyCountry(u.getCountryCode(), u.getResidenceCountry(), u.getNationality()));
        return evaluate(u.getBirthDate(), p, guardianConfirmed(u.getId()));
    }

    public static Status evaluate(LocalDate birthDate, Policy p, boolean guardianConfirmed) {
        Integer age = ChannelPortfolioRules.age(birthDate, today());
        boolean known = age != null;
        boolean minor = known && age < p.adultAge();
        boolean legal = known && age < p.guardianConsentUnderAge();
        return new Status(age, known, minor, legal, guardianConfirmed, p);
    }

    public boolean guardianConfirmed(UUID userId) {
        if (userId == null) {
            return false;
        }
        Integer n = jdbc.queryForObject("""
                SELECT COUNT(*) FROM guardian_confirmations WHERE user_id = ? AND status = 'CONFIRMED'
                """, Integer.class, userId);
        return n != null && n > 0;
    }

    public Set<UUID> guardianConfirmedAmong(Collection<UUID> ids) {
        Set<UUID> out = new HashSet<>();
        if (ids == null || ids.isEmpty()) {
            return out;
        }
        jdbc.query("SELECT DISTINCT user_id FROM guardian_confirmations WHERE status = 'CONFIRMED' AND user_id = ANY (?)",
                ps -> ps.setArray(1, ps.getConnection().createArrayOf("uuid", ids.toArray())),
                rs -> {
                    out.add(rs.getObject(1, UUID.class));
                });
        return out;
    }

    public void upsert(Policy p, UUID adminId) {
        jdbc.update("""
                INSERT INTO country_minor_policies (country_code, adult_age, guardian_consent_under_age,
                    guardian_required_for_apply, minor_offers_require_guardian, minor_contact_sharing_allowed, note,
                    updated_by, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
                ON CONFLICT (country_code) DO UPDATE SET adult_age = EXCLUDED.adult_age,
                    guardian_consent_under_age = EXCLUDED.guardian_consent_under_age,
                    guardian_required_for_apply = EXCLUDED.guardian_required_for_apply,
                    minor_offers_require_guardian = EXCLUDED.minor_offers_require_guardian,
                    minor_contact_sharing_allowed = EXCLUDED.minor_contact_sharing_allowed,
                    note = EXCLUDED.note, updated_by = EXCLUDED.updated_by, updated_at = NOW()
                """, p.countryCode(), p.adultAge(), p.guardianConsentUnderAge(), p.guardianRequiredForApply(),
                p.minorOffersRequireGuardian(), p.minorContactSharingAllowed(), p.note(), adminId);
    }

    private static Policy map(ResultSet rs) throws SQLException {
        Timestamp t = rs.getTimestamp("updated_at");
        return new Policy(rs.getString("country_code"), rs.getInt("adult_age"), rs.getInt("guardian_consent_under_age"),
                rs.getBoolean("guardian_required_for_apply"), rs.getBoolean("minor_offers_require_guardian"),
                rs.getBoolean("minor_contact_sharing_allowed"), rs.getString("note"), t == null ? null : t.toInstant());
    }
}
