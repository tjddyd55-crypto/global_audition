package com.audition.platform.application.org;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * 빈 데이터베이스는 0이다. 회계 현금과 영업 실적 스냅샷은 더하지 않는다.
 */
@Service
public class StatsService {

    private final JdbcTemplate jdbc;
    private final OrgAccess access;

    public StatsService(JdbcTemplate jdbc, OrgAccess access) {
        this.jdbc = jdbc;
        this.access = access;
    }

    public Policy policy() {
        access.requireUser();
        return new Policy(
                "UNCONFIRMED",
                "HALF_UP",
                "1 USD = 1 Credit",
                List.of(
                        "Cash collection and credit usage are stored separately and are not added.",
                        "Country payout uses paid-credit usage linked to a real payment, attributed to the posting branch.",
                        "Mixed paid and free usage stays ALLOCATION_POLICY_PENDING while allocation_policy is UNCONFIRMED.",
                        "Settlement USD is aggregated, then rounded once to 2 decimals HALF_UP. Raw, final, and difference are stored.",
                        "Accounting revenue recognition and unused-credit breakage require expert review.",
                        "Non-USD payout stays unfinalized until a super admin records a verified rate.",
                        "Settlement payout is a manual record. No bank transfer is performed."));
    }

    public GlobalStats global(String country, String period) {
        OrgAccess.Actor actor = access.requireUser();
        String scoped = scopedCountry(actor, country);
        List<CountrySlice> slices = slices(scoped, period);
        int countries = scoped == null
                ? count("SELECT COUNT(*) FROM countries")
                : 1;
        int admins = scoped == null
                ? count("SELECT COUNT(*) FROM country_admin_appointments WHERE status = 'ACTIVE'")
                : count("SELECT COUNT(*) FROM country_admin_appointments WHERE status = 'ACTIVE' AND country_code = ?", scoped);
        int registered = scoped == null
                ? count("SELECT COUNT(*) FROM crm_agencies")
                : count("SELECT COUNT(*) FROM crm_agencies WHERE country_code = ?", scoped);
        int approved = scoped == null
                ? count("SELECT COUNT(*) FROM crm_agencies WHERE approval_state = 'APPROVED'")
                : count("SELECT COUNT(*) FROM crm_agencies WHERE approval_state = 'APPROVED' AND country_code = ?", scoped);
        long unlinked = countLong("""
                SELECT COUNT(*) FROM auditions WHERE posting_branch_id IS NULL
                """);
        return new GlobalStats(countries, admins, registered, approved, unlinked, slices, "ACCOUNTING_CASH", "SALES_FEE_SNAPSHOT", "UNCONFIRMED");
    }

    public CountryDetail country(
            String rawCountry,
            String period,
            UUID agencyId,
            UUID staffUserId,
            UUID contractId,
            UUID auditionId,
            String settlementStatus) {
        String code = CountryCodes.iso2(rawCountry);
        OrgAccess.Actor actor = access.requireCountry(code);
        if (OrgRoles.countryStaff(actor.role())) {
            staffUserId = actor.id();
        }
        long auditions = countLong(filteredCount("auditions u JOIN crm_agencies g ON g.id = u.posting_branch_id", agencyId, auditionId),
                args(code, agencyId, auditionId));
        long applications = countLong(filteredCount(
                "applications p JOIN auditions u ON u.id = p.audition_id JOIN crm_agencies g ON g.id = u.posting_branch_id",
                agencyId, auditionId), args(code, agencyId, auditionId));
        long registered = countLong("SELECT COUNT(*) FROM crm_agencies WHERE country_code = ?", code);
        long approved = countLong("""
                SELECT COUNT(*) FROM crm_agencies WHERE country_code = ? AND approval_state = 'APPROVED'
                """, code);
        List<Object> staffArgs = new ArrayList<>();
        staffArgs.add(code);
        String staffSql = "SELECT actor_id, COUNT(*) AS total FROM crm_activities WHERE country_code = ?";
        if (staffUserId != null) {
            staffSql += " AND actor_id = ?";
            staffArgs.add(staffUserId);
        }
        staffSql += " GROUP BY actor_id ORDER BY total DESC";
        List<StaffCount> staff = jdbc.query(staffSql, (rs, n) -> new StaffCount(rs.getObject("actor_id", UUID.class), rs.getLong("total")), staffArgs.toArray());
        List<Object> trendArgs = new ArrayList<>();
        trendArgs.add(code);
        String trendSql = """
                SELECT to_char(occurred_at AT TIME ZONE 'UTC', 'YYYY-MM') AS period_key,
                       COALESCE(SUM(CASE WHEN recognition = 'ACCOUNTING' AND line_kind = 'REVENUE' THEN collected_usd ELSE 0 END), 0) AS accounting_usd,
                       COALESCE(SUM(CASE WHEN recognition = 'ACCOUNTING' AND line_kind = 'REFUND' THEN collected_usd ELSE 0 END), 0) AS refunds_usd,
                       COALESCE(SUM(CASE WHEN recognition = 'SALES' AND line_kind = 'REVENUE' THEN applied_fee_usd ELSE 0 END), 0) AS sales_snapshot_usd
                FROM revenue_attributions
                WHERE attributed_country = ?
                """;
        if (period != null && !period.isBlank()) {
            trendSql += " AND to_char(occurred_at AT TIME ZONE 'UTC', 'YYYY-MM') = ?";
            trendArgs.add(period);
        }
        if (contractId != null) {
            trendSql += " AND contract_id = ?";
            trendArgs.add(contractId);
        }
        if (auditionId != null) {
            trendSql += " AND audition_id = ?";
            trendArgs.add(auditionId);
        }
        if (agencyId != null) {
            trendSql += " AND crm_agency_id = ?";
            trendArgs.add(agencyId);
        }
        trendSql += " GROUP BY 1 ORDER BY 1";
        List<MonthPoint> trend = jdbc.query(trendSql, (rs, n) -> new MonthPoint(
                rs.getString("period_key"),
                rs.getLong("accounting_usd"),
                rs.getLong("refunds_usd"),
                rs.getLong("sales_snapshot_usd"),
                rs.getLong("sales_snapshot_usd") > 0 ? null : 0L), trendArgs.toArray());
        List<Object> shareArgs = new ArrayList<>();
        shareArgs.add(code);
        String shareSql = """
                SELECT contract_id, status, COUNT(*) AS total,
                       COALESCE(SUM(settlement_base_usd), 0) AS base_usd,
                       COALESCE(SUM(compensation_usd), 0) AS compensation_usd,
                       COALESCE(SUM(hq_share_usd), 0) AS hq_usd
                FROM monthly_settlements
                WHERE country_code = ?
                """;
        if (period != null && !period.isBlank()) {
            shareSql += " AND period_key = ?";
            shareArgs.add(period);
        }
        if (settlementStatus != null && !settlementStatus.isBlank()) {
            shareSql += " AND status = ?";
            shareArgs.add(settlementStatus);
        }
        if (contractId != null) {
            shareSql += " AND contract_id = ?";
            shareArgs.add(contractId);
        }
        shareSql += " GROUP BY contract_id, status ORDER BY contract_id";
        List<ContractShare> shares = jdbc.query(shareSql, (rs, n) -> new ContractShare(
                rs.getObject("contract_id", UUID.class),
                rs.getString("status"),
                rs.getLong("total"),
                rs.getLong("base_usd"),
                rs.getLong("compensation_usd"),
                rs.getLong("hq_usd")), shareArgs.toArray());
        long payoutScheduled = shares.stream().filter(row -> "APPROVED".equals(row.status())).mapToLong(ContractShare::count).sum();
        long payoutDone = shares.stream().filter(row -> "PAID".equals(row.status())).mapToLong(ContractShare::count).sum();
        return new CountryDetail(
                code, auditions, applications, registered, approved,
                registered == 0 ? null : approved + "/" + registered,
                staff, trend, shares, payoutScheduled, payoutDone, "UNCONFIRMED");
    }

    private List<CountrySlice> slices(String country, String period) {
        String countryFilter = country == null ? "" : " WHERE code = ?";
        String occurred = period == null || period.isBlank() ? "" : " AND to_char(occurred_at AT TIME ZONE 'UTC', 'YYYY-MM') = ?";
        String periodKey = period == null || period.isBlank() ? "" : " AND period_key = ?";
        String sql = """
                WITH countries_in_scope AS (
                    SELECT code FROM countries%s
                )
                SELECT c.code,
                       (SELECT COUNT(*) FROM auditions u JOIN crm_agencies g ON g.id = u.posting_branch_id WHERE g.country_code = c.code) AS auditions,
                       (SELECT COUNT(*) FROM applications p JOIN auditions u ON u.id = p.audition_id JOIN crm_agencies g ON g.id = u.posting_branch_id WHERE g.country_code = c.code) AS applications,
                       COALESCE((SELECT SUM(collected_usd) FROM revenue_attributions WHERE attributed_country = c.code AND recognition = 'ACCOUNTING' AND line_kind = 'REVENUE' AND confirmation_state = 'ATTRIBUTED'%s), 0) AS accounting_usd,
                       COALESCE((SELECT SUM(collected_usd) FROM revenue_attributions WHERE attributed_country = c.code AND recognition = 'ACCOUNTING' AND line_kind = 'REFUND'%s), 0) AS refunds_usd,
                       COALESCE((SELECT SUM(applied_fee_usd) FROM revenue_attributions WHERE attributed_country = c.code AND recognition = 'SALES' AND line_kind = 'REVENUE'%s), 0) AS sales_snapshot_usd,
                       COALESCE((SELECT SUM(settlement_base_usd) FROM monthly_settlements WHERE country_code = c.code AND status IN ('CALCULATED','UNDER_REVIEW','APPROVED','PAID','ADJUSTMENT_REQUIRED')%s), 0) AS base_usd,
                       COALESCE((SELECT SUM(compensation_usd) FROM monthly_settlements WHERE country_code = c.code AND status IN ('CALCULATED','UNDER_REVIEW','APPROVED','PAID','ADJUSTMENT_REQUIRED')%s), 0) AS compensation_usd,
                       COALESCE((SELECT SUM(hq_share_usd) FROM monthly_settlements WHERE country_code = c.code AND status IN ('CALCULATED','UNDER_REVIEW','APPROVED','PAID','ADJUSTMENT_REQUIRED')%s), 0) AS hq_usd,
                       (SELECT COUNT(*) FROM monthly_settlements WHERE country_code = c.code AND status IN ('APPROVED','PAID')) AS settled_count,
                       (SELECT COUNT(*) FROM monthly_settlements WHERE country_code = c.code AND status IN ('DRAFT','CALCULATED','UNDER_REVIEW','NEEDS_CONFIRMATION','ADJUSTMENT_REQUIRED')) AS unsettled_count
                FROM countries_in_scope c
                ORDER BY c.code
                """.formatted(countryFilter, occurred, occurred, occurred, periodKey, periodKey, periodKey);
        List<Object> args = new ArrayList<>();
        if (country != null) {
            args.add(country);
        }
        if (period != null && !period.isBlank()) {
            for (int i = 0; i < 6; i++) {
                args.add(period);
            }
        }
        return jdbc.query(sql, (rs, n) -> {
            long snapshot = rs.getLong("sales_snapshot_usd");
            return new CountrySlice(
                    rs.getString("code").trim(),
                    rs.getLong("auditions"),
                    rs.getLong("applications"),
                    rs.getLong("accounting_usd"),
                    rs.getLong("refunds_usd"),
                    snapshot,
                    snapshot > 0 ? null : 0L,
                    rs.getLong("base_usd"),
                    rs.getLong("compensation_usd"),
                    rs.getLong("hq_usd"),
                    rs.getLong("settled_count"),
                    rs.getLong("unsettled_count"));
        }, args.toArray());
    }

    private String scopedCountry(OrgAccess.Actor actor, String country) {
        if (OrgRoles.hq(actor.role())) {
            return country == null || country.isBlank() ? null : CountryCodes.iso2(country);
        }
        if (country == null || country.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "COUNTRY_CODE_REQUIRED");
        }
        String code = CountryCodes.iso2(country);
        access.requireCountry(code);
        return code;
    }

    private static String filteredCount(String from, UUID agencyId, UUID auditionId) {
        String sql = "SELECT COUNT(*) FROM " + from + " WHERE g.country_code = ?";
        if (agencyId != null) {
            sql += " AND g.id = ?";
        }
        if (auditionId != null) {
            sql += " AND u.id = ?";
        }
        return sql;
    }

    private static Object[] args(String code, UUID agencyId, UUID auditionId) {
        List<Object> values = new ArrayList<>();
        values.add(code);
        if (agencyId != null) {
            values.add(agencyId);
        }
        if (auditionId != null) {
            values.add(auditionId);
        }
        return values.toArray();
    }

    private int count(String sql, Object... args) {
        Integer value = jdbc.queryForObject(sql, Integer.class, args);
        return value == null ? 0 : value;
    }

    private long countLong(String sql, Object... args) {
        Long value = jdbc.queryForObject(sql, Long.class, args);
        return value == null ? 0 : value;
    }

    public record Policy(String cashToUsageMapping, String roundingPolicy, String creditParity, List<String> notes) {
    }

    public record GlobalStats(
            int countries,
            int activeCountryAdmins,
            int agenciesRegistered,
            int agenciesApproved,
            long auditionsUnlinked,
            List<CountrySlice> slices,
            String accountingLabel,
            String salesLabel,
            String cashToUsageMapping) {
    }

    public record CountrySlice(
            String country,
            long auditions,
            long applications,
            long accountingRevenueUsd,
            long refundsUsd,
            long salesFeeSnapshotUsd,
            Long salesCashUsd,
            long settlementBaseUsd,
            long compensationUsd,
            long hqShareUsd,
            long settledCount,
            long unsettledCount) {
    }

    public record CountryDetail(
            String country,
            long auditions,
            long applications,
            long agenciesRegistered,
            long agenciesApproved,
            String approvalCount,
            List<StaffCount> staffActivity,
            List<MonthPoint> monthlyTrend,
            List<ContractShare> contractShares,
            long payoutScheduled,
            long payoutRecorded,
            String cashToUsageMapping) {
    }

    public record StaffCount(UUID actorId, long activities) {
    }

    public record MonthPoint(String period, long accountingRevenueUsd, long refundsUsd, long salesFeeSnapshotUsd, Long salesCashUsd) {
    }

    public record ContractShare(UUID contractId, String status, long count, long baseUsd, long compensationUsd, long hqShareUsd) {
    }
}
