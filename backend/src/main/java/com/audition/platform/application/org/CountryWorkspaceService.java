package com.audition.platform.application.org;

import com.audition.platform.application.org.JdbcContractStore.ContractRow;
import com.audition.platform.application.org.JdbcContractStore.VersionRow;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * 슈퍼 관리자와 국가 관리자가 같은 집계 쿼리를 본다.
 * 직원은 배정된 기획사만 보고 요율과 국가 보상은 받지 않는다.
 */
@Service
public class CountryWorkspaceService {

    private final JdbcTemplate jdbc;
    private final OrgAccess access;
    private final JdbcOrgStore org;
    private final JdbcContractStore contracts;
    private final JdbcCreditLotStore lots;
    private final SettlementService settlements;

    public CountryWorkspaceService(
            JdbcTemplate jdbc,
            OrgAccess access,
            JdbcOrgStore org,
            JdbcContractStore contracts,
            JdbcCreditLotStore lots,
            SettlementService settlements) {
        this.jdbc = jdbc;
        this.access = access;
        this.org = org;
        this.contracts = contracts;
        this.lots = lots;
        this.settlements = settlements;
    }

    @Transactional
    public List<Metrics> overview(String period) {
        access.requireHq();
        String key = periodKey(period);
        lots.rebuild();
        return org.listCountries().stream().map(country -> metrics(country.code(), key, false)).toList();
    }

    @Transactional
    public Metrics metrics(String rawCountry, String period) {
        String code = CountryCodes.iso2(rawCountry);
        OrgAccess.Actor actor = access.requireCountry(code);
        boolean staff = OrgRoles.countryStaff(actor.role());
        lots.rebuild();
        return metrics(code, periodKey(period), staff);
    }

    public List<AuditionOps> auditions(String rawCountry) {
        String code = CountryCodes.iso2(rawCountry);
        OrgAccess.Actor actor = access.requireCountry(code);
        boolean staff = OrgRoles.countryStaff(actor.role());
        String sql = """
                SELECT a.id, a.title, a.status, a.start_date, a.end_date, g.id AS agency_id, g.display_name,
                       (SELECT COUNT(*) FROM applications p WHERE p.audition_id = a.id) AS applicants,
                       COALESCE((SELECT SUM(applied_fee_usd) FROM revenue_attributions ra
                                 WHERE ra.audition_id = a.id AND ra.recognition = 'SALES' AND ra.line_kind = 'REVENUE'), 0) AS fee_usd,
                       (SELECT string_agg(s.status || ':' || s.cnt, ',')
                        FROM (SELECT status, COUNT(*) AS cnt FROM applications WHERE audition_id = a.id GROUP BY status) s) AS judging
                FROM auditions a
                JOIN crm_agencies g ON g.id = a.posting_branch_id
                WHERE g.country_code = ?
                """;
        List<Object> args = new ArrayList<>();
        args.add(code);
        if (staff) {
            sql += """
                     AND EXISTS (
                        SELECT 1 FROM country_staff_agencies ga
                        JOIN country_staff_assignments sa ON sa.id = ga.assignment_id
                        WHERE ga.crm_agency_id = g.id AND sa.user_id = ? AND sa.status = 'ACTIVE'
                     )
                    """;
            args.add(actor.id());
        }
        sql += " ORDER BY a.created_at DESC";
        return jdbc.query(sql, (rs, n) -> new AuditionOps(
                rs.getObject("id", UUID.class),
                rs.getString("title"),
                rs.getString("status"),
                rs.getTimestamp("start_date") == null ? null : rs.getTimestamp("start_date").toInstant().toString(),
                rs.getTimestamp("end_date") == null ? null : rs.getTimestamp("end_date").toInstant().toString(),
                rs.getObject("agency_id", UUID.class),
                rs.getString("display_name"),
                rs.getLong("applicants"),
                rs.getLong("fee_usd"),
                rs.getString("judging")), args.toArray());
    }

    public List<UsagePoint> usage(String rawCountry, String period) {
        String code = CountryCodes.iso2(rawCountry);
        OrgAccess.Actor actor = access.requireCountry(code);
        boolean staff = OrgRoles.countryStaff(actor.role());
        String sql = """
                SELECT to_char(ra.occurred_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day_key,
                       to_char(ra.occurred_at AT TIME ZONE 'UTC', 'YYYY-MM') AS month_key,
                       COUNT(DISTINCT ra.id) AS applications,
                       COALESCE(SUM(CASE WHEN al.status = 'ALLOCATED' AND al.bucket = 'FREE' THEN al.credits ELSE 0 END), 0)::bigint AS free_credits,
                       COALESCE(SUM(CASE WHEN al.status = 'ALLOCATED' AND al.bucket = 'PAID' THEN al.credits ELSE 0 END), 0)::bigint AS paid_credits,
                       COALESCE(SUM(CASE WHEN al.status = 'ALLOCATED' THEN al.payable_usd ELSE 0 END), 0)::bigint AS payable_usd,
                       COALESCE(SUM(CASE WHEN al.status = 'REVIEW_REQUIRED' THEN al.credits ELSE 0 END), 0)::bigint AS review_credits
                FROM revenue_attributions ra
                JOIN crm_agencies g ON g.id = ra.crm_agency_id
                LEFT JOIN credit_lot_allocations al ON al.usage_credit_transaction_id = ra.credit_transaction_id
                WHERE g.country_code = ? AND ra.recognition = 'SALES' AND ra.line_kind = 'REVENUE'
                """;
        List<Object> args = new ArrayList<>();
        args.add(code);
        if (period != null && !period.isBlank()) {
            sql += " AND to_char(ra.occurred_at AT TIME ZONE 'UTC', 'YYYY-MM') = ?";
            args.add(period.trim());
        }
        if (staff) {
            sql += """
                     AND EXISTS (
                        SELECT 1 FROM country_staff_agencies ga
                        JOIN country_staff_assignments sa ON sa.id = ga.assignment_id
                        WHERE ga.crm_agency_id = g.id AND sa.user_id = ? AND sa.status = 'ACTIVE'
                     )
                    """;
            args.add(actor.id());
        }
        sql += " GROUP BY 1, 2 ORDER BY 1";
        return jdbc.query(sql, (rs, n) -> new UsagePoint(
                rs.getString("day_key"),
                rs.getString("month_key"),
                rs.getLong("applications"),
                rs.getLong("free_credits"),
                rs.getLong("paid_credits"),
                staff ? null : rs.getLong("payable_usd"),
                rs.getLong("review_credits")), args.toArray());
    }

    public AccountPrefs account() {
        OrgAccess.Actor actor = access.requireUser();
        List<AccountPrefs> rows = jdbc.query("""
                SELECT email_enabled, locale FROM user_notification_prefs WHERE user_id = ?
                """, (rs, n) -> new AccountPrefs(rs.getBoolean("email_enabled"), rs.getString("locale")), actor.id());
        return rows.isEmpty() ? new AccountPrefs(true, "ko") : rows.get(0);
    }

    @Transactional
    public AccountPrefs saveAccount(Boolean emailEnabled, String locale) {
        OrgAccess.Actor actor = access.requireUser();
        String language = locale == null || locale.isBlank() ? "ko" : locale.trim();
        if (!List.of("ko", "ja", "en").contains(language)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "LOCALE_UNSUPPORTED");
        }
        boolean email = emailEnabled == null || emailEnabled;
        jdbc.update("""
                INSERT INTO user_notification_prefs (user_id, email_enabled, locale)
                VALUES (?, ?, ?)
                ON CONFLICT (user_id) DO UPDATE
                SET email_enabled = EXCLUDED.email_enabled, locale = EXCLUDED.locale, updated_at = NOW()
                """, actor.id(), email, language);
        return new AccountPrefs(email, language);
    }

    private Metrics metrics(String code, String period, boolean staff) {
        JdbcOrgStore.CountryRow country = org.listCountries().stream()
                .filter(row -> code.equals(row.code().trim()))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "COUNTRY_NOT_FOUND"));
        UUID actorFilter = staff ? access.requireUser().id() : null;
        long registered = countAgencies(code, null, actorFilter);
        long approved = countAgencies(code, "APPROVED", actorFilter);
        long live = countAuditions(code, "OPEN", actorFilter);
        long applications = countApplications(code, period, actorFilter);
        long fees = sumFees(code, period, actorFilter);
        long refunds = sumRefunds(code, period);
        long pending = countAgencies(code, "COUNTRY_REVIEW", actorFilter)
                + countAgencies(code, "HQ_REVIEW", actorFilter)
                + countAgencies(code, "PENDING", actorFilter);
        UsageTotals usage = usageTotals(code, period, actorFilter);
        Integer rate = null;
        String expected = null;
        String expectedStatus = null;
        String lastMonthConfirmed = null;
        String selectedConfirmed = null;
        Long base = null;
        if (!staff) {
            rate = currentRate(code);
            ExpectedRollup rollup = expected(code, period);
            expected = rollup.compensation();
            expectedStatus = rollup.status();
            lastMonthConfirmed = confirmed(code, previous(period));
            selectedConfirmed = confirmed(code, period);
            base = usage.payableUsd();
            refunds = sumRefunds(code, period);
        }
        String repName = country.representativeUserId() == null ? null : displayName(country.representativeUserId());
        return new Metrics(
                code,
                country.name(),
                country.currency(),
                country.representativeUserId(),
                repName,
                staff ? "COUNTRY_STAFF" : "COUNTRY_SCOPE",
                registered,
                approved,
                live,
                applications,
                fees,
                staff ? null : refunds,
                staff ? null : base,
                rate,
                expected,
                expectedStatus,
                lastMonthConfirmed,
                pending,
                usage.freeCredits(),
                usage.paidCredits(),
                usage.reviewCredits(),
                period,
                previous(period),
                selectedConfirmed);
    }

    private ExpectedRollup expected(String code, String period) {
        BigDecimal sum = BigDecimal.ZERO;
        boolean any = false;
        String status = "NONE";
        for (ContractRow contract : contracts.listCountry(code)) {
            if (!"ACTIVE".equals(contract.status())) {
                continue;
            }
            SettlementService.SettlementView preview = settlements.preview(code, contract.id(), period);
            status = preview.status();
            if (preview.compensationFinal() == null) {
                continue;
            }
            sum = sum.add(new BigDecimal(preview.compensationFinal()));
            any = true;
        }
        return new ExpectedRollup(any ? sum.toPlainString() : null, status);
    }

    private String confirmed(String code, String period) {
        List<BigDecimal> rows = jdbc.query("""
                SELECT compensation_final FROM monthly_settlements
                WHERE country_code = ? AND period_key = ?
                  AND status IN ('APPROVED', 'PAID', 'ADJUSTMENT_REQUIRED')
                  AND compensation_final IS NOT NULL
                """, (rs, n) -> rs.getBigDecimal(1), code, period);
        if (rows.isEmpty()) {
            return null;
        }
        BigDecimal sum = BigDecimal.ZERO;
        for (BigDecimal row : rows) {
            sum = sum.add(row);
        }
        return sum.toPlainString();
    }

    private Integer currentRate(String code) {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        Integer best = null;
        int version = -1;
        for (ContractRow contract : contracts.listCountry(code)) {
            if (!"ACTIVE".equals(contract.status())) {
                continue;
            }
            for (VersionRow row : contracts.versions(contract.id())) {
                if (!AttributionPlanner.covers(new AttributionPlanner.Window(
                        contract.id(), row.id(), row.versionNo(), code, contract.agencyId(), row.start(), row.end()), today)) {
                    continue;
                }
                if (row.versionNo() >= version) {
                    version = row.versionNo();
                    best = row.rateBps();
                }
            }
        }
        return best;
    }

    private long countAgencies(String code, String approval, UUID staffUserId) {
        String sql = "SELECT COUNT(*) FROM crm_agencies g WHERE g.country_code = ?";
        List<Object> args = new ArrayList<>();
        args.add(code);
        if (approval != null) {
            sql += " AND g.approval_state = ?";
            args.add(approval);
        }
        if (staffUserId != null) {
            sql += assigned(args, staffUserId);
        }
        return count(sql, args);
    }

    private long countAuditions(String code, String status, UUID staffUserId) {
        String sql = """
                SELECT COUNT(*) FROM auditions a
                JOIN crm_agencies g ON g.id = a.posting_branch_id
                WHERE g.country_code = ? AND a.status = ?
                """;
        List<Object> args = new ArrayList<>();
        args.add(code);
        args.add(status);
        if (staffUserId != null) {
            sql += assigned(args, staffUserId);
        }
        return count(sql, args);
    }

    private long countApplications(String code, String period, UUID staffUserId) {
        String sql = """
                SELECT COUNT(*) FROM applications p
                JOIN auditions a ON a.id = p.audition_id
                JOIN crm_agencies g ON g.id = a.posting_branch_id
                WHERE g.country_code = ?
                """;
        List<Object> args = new ArrayList<>();
        args.add(code);
        if (period != null) {
            sql += " AND to_char(p.created_at AT TIME ZONE 'UTC', 'YYYY-MM') = ?";
            args.add(period);
        }
        if (staffUserId != null) {
            sql += assigned(args, staffUserId);
        }
        return count(sql, args);
    }

    private long sumFees(String code, String period, UUID staffUserId) {
        String sql = """
                SELECT COALESCE(SUM(ra.applied_fee_usd), 0) FROM revenue_attributions ra
                JOIN crm_agencies g ON g.id = ra.crm_agency_id
                WHERE g.country_code = ? AND ra.recognition = 'SALES' AND ra.line_kind = 'REVENUE'
                """;
        List<Object> args = new ArrayList<>();
        args.add(code);
        if (period != null) {
            sql += " AND to_char(ra.occurred_at AT TIME ZONE 'UTC', 'YYYY-MM') = ?";
            args.add(period);
        }
        if (staffUserId != null) {
            sql += assigned(args, staffUserId);
        }
        return count(sql, args);
    }

    private long sumRefunds(String code, String period) {
        String sql = """
                SELECT COALESCE(SUM(collected_usd), 0) FROM revenue_attributions
                WHERE trim(attributed_country) = ? AND recognition = 'ACCOUNTING' AND line_kind = 'REFUND'
                """;
        List<Object> args = new ArrayList<>();
        args.add(code);
        if (period != null) {
            sql += " AND to_char(occurred_at AT TIME ZONE 'UTC', 'YYYY-MM') = ?";
            args.add(period);
        }
        return count(sql, args);
    }

    private UsageTotals usageTotals(String code, String period, UUID staffUserId) {
        String sql = """
                SELECT COALESCE(SUM(CASE WHEN al.status = 'ALLOCATED' AND al.bucket = 'FREE' THEN al.credits ELSE 0 END), 0)::bigint AS free_credits,
                       COALESCE(SUM(CASE WHEN al.status = 'ALLOCATED' AND al.bucket = 'PAID' THEN al.credits ELSE 0 END), 0)::bigint AS paid_credits,
                       COALESCE(SUM(CASE WHEN al.status = 'ALLOCATED' THEN al.payable_usd ELSE 0 END), 0)::bigint AS payable_usd,
                       COALESCE(SUM(CASE WHEN al.status = 'REVIEW_REQUIRED' THEN al.credits ELSE 0 END), 0)::bigint AS review_credits
                FROM revenue_attributions ra
                JOIN crm_agencies g ON g.id = ra.crm_agency_id
                LEFT JOIN credit_lot_allocations al ON al.usage_credit_transaction_id = ra.credit_transaction_id
                WHERE g.country_code = ? AND ra.recognition = 'SALES' AND ra.line_kind = 'REVENUE'
                """;
        List<Object> args = new ArrayList<>();
        args.add(code);
        if (period != null) {
            sql += " AND to_char(ra.occurred_at AT TIME ZONE 'UTC', 'YYYY-MM') = ?";
            args.add(period);
        }
        if (staffUserId != null) {
            sql += assigned(args, staffUserId);
        }
        return jdbc.queryForObject(sql, (rs, n) -> new UsageTotals(
                rs.getLong("free_credits"),
                rs.getLong("paid_credits"),
                rs.getLong("payable_usd"),
                rs.getLong("review_credits")), args.toArray());
    }

    private static String assigned(List<Object> args, UUID staffUserId) {
        args.add(staffUserId);
        return """
                 AND EXISTS (
                    SELECT 1 FROM country_staff_agencies ga
                    JOIN country_staff_assignments sa ON sa.id = ga.assignment_id
                    WHERE ga.crm_agency_id = g.id AND sa.user_id = ? AND sa.status = 'ACTIVE'
                 )
                """;
    }

    private long count(String sql, List<Object> args) {
        Long value = jdbc.queryForObject(sql, Long.class, args.toArray());
        return value == null ? 0 : value;
    }

    private String displayName(UUID userId) {
        List<String> rows = jdbc.query(
                "SELECT display_name FROM users WHERE id = ?",
                (rs, n) -> rs.getString(1),
                userId);
        return rows.isEmpty() ? null : rows.get(0);
    }

    private static String periodKey(String period) {
        if (period == null || period.isBlank()) {
            return YearMonth.now(ZoneOffset.UTC).toString();
        }
        try {
            return YearMonth.parse(period.trim()).toString();
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "PERIOD_INVALID");
        }
    }

    private static String previous(String period) {
        return YearMonth.parse(period).minusMonths(1).toString();
    }

    private record ExpectedRollup(String compensation, String status) {
    }

    private record UsageTotals(long freeCredits, long paidCredits, long payableUsd, long reviewCredits) {
    }

    public record Metrics(
            String countryCode,
            String countryName,
            String currency,
            UUID representativeUserId,
            String representativeName,
            String scope,
            long agenciesRegistered,
            long agenciesApproved,
            long liveAuditions,
            long monthlyApplications,
            long feePerformanceUsd,
            Long refundsUsd,
            Long settlementBaseUsd,
            Integer rateBps,
            String expectedCompensation,
            String expectedStatus,
            String lastMonthConfirmedCompensation,
            long pendingApprovals,
            long freeUsageCredits,
            long paidUsageCredits,
            long reviewCredits,
            String period,
            String lastMonthPeriod,
            String confirmedCompensation) {
    }

    public record AuditionOps(
            UUID id,
            String title,
            String status,
            String startAt,
            String endAt,
            UUID agencyId,
            String agencyName,
            long applicants,
            long feeUsd,
            String judgingStatus) {
    }

    public record UsagePoint(
            String day,
            String month,
            long applications,
            long freeCredits,
            long paidCredits,
            Long settleableUsd,
            long reviewCredits) {
    }

    public record AccountPrefs(boolean emailEnabled, String locale) {
    }
}
