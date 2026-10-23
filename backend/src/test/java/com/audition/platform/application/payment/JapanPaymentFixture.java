package com.audition.platform.application.payment;

import com.audition.platform.application.org.SettlementMath;
import org.springframework.jdbc.core.JdbcTemplate;

import java.math.BigDecimal;
import java.sql.Date;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * 결제 IT 가 개발자 로컬 시드(TOKYO 오디션, JP 계약, jp-rep2 국가 관리자, 2026-10 지급 정산)에 기대지 않도록
 * 격리된 테스트 DB 안에 같은 고정 ID 로 멱등 생성한다. 이미 있으면 건드리지 않는다(ON CONFLICT DO NOTHING).
 * 운영·개발 DB 에서 실행되지 않는다. IT 전용 datasource(TEST_DB_URL) 만 사용한다.
 */
final class JapanPaymentFixture {

    static final UUID TOKYO = UUID.fromString("e5533082-7866-4112-9e44-39db846ed14a");
    static final UUID JP_CONTRACT = UUID.fromString("a0495a80-800b-4989-823f-fb9123732bf7");
    static final UUID JP_CONTRACT_V1 = UUID.fromString("a0495a80-0000-4000-8000-00000000e001");
    static final UUID JP_AGENCY_OWNER = UUID.fromString("a0495a80-0000-4000-8000-00000000a001");
    static final UUID JP_BRANCH = UUID.fromString("a0495a80-0000-4000-8000-00000000b001");
    static final UUID JP_REP = UUID.fromString("a0495a80-0000-4000-8000-00000000c001");
    static final UUID JP_REP_APPOINTMENT = UUID.fromString("a0495a80-0000-4000-8000-00000000c002");
    static final UUID JP_PAID_SETTLEMENT = UUID.fromString("a0495a80-0000-4000-8000-00000000d001");
    static final String JP_REP_EMAIL = "jp-rep2@pay.fixture.test";

    private JapanPaymentFixture() {
    }

    /** 반환값: 이 픽스처가 보장한 JP 국가 관리자 사용자 ID. */
    static UUID ensure(JdbcTemplate jdbc) {
        jdbc.update("""
                INSERT INTO countries (code, name, status, default_currency)
                VALUES ('JP', 'Japan', 'ACTIVE', 'JPY') ON CONFLICT (code) DO NOTHING
                """);
        UUID hq = jdbc.queryForObject(
                "SELECT id FROM users WHERE role = 'SUPER_ADMIN' ORDER BY created_at LIMIT 1", UUID.class);
        user(jdbc, JP_AGENCY_OWNER, "jp-agency-owner@pay.fixture.test", "AGENCY", "payfixjpowner");
        user(jdbc, JP_REP, JP_REP_EMAIL, "COUNTRY_ADMIN", "payfixjprep2");
        jdbc.update("""
                INSERT INTO country_admin_appointments (id, country_code, user_id, status, appointed_by)
                SELECT ?, 'JP', ?, 'ACTIVE', ?
                WHERE NOT EXISTS (SELECT 1 FROM country_admin_appointments WHERE country_code = 'JP' AND status = 'ACTIVE')
                ON CONFLICT (id) DO NOTHING
                """, JP_REP_APPOINTMENT, JP_REP, hq);
        List<UUID> activeRep = jdbc.queryForList(
                "SELECT user_id FROM country_admin_appointments WHERE country_code = 'JP' AND status = 'ACTIVE'", UUID.class);
        if (!activeRep.equals(List.of(JP_REP))) {
            throw new IllegalStateException("JP 국가 관리자 픽스처와 다른 활성 임명이 테스트 DB에 있습니다: " + activeRep);
        }
        jdbc.update("""
                INSERT INTO crm_agencies (id, country_code, display_name, stage, approval_state, linked_user_id)
                VALUES (?, 'JP', 'Pay Fixture Tokyo Agency', 'ACTIVE', 'APPROVED', ?)
                ON CONFLICT (id) DO NOTHING
                """, JP_BRANCH, JP_AGENCY_OWNER);
        jdbc.update("""
                INSERT INTO auditions (id, owner_id, title, description, status, country_code, host_country, location,
                                       posting_branch_id, group_id, process_mode)
                VALUES (?, ?, 'Tokyo Open Call', 'payment IT fixture', 'OPEN', 'JP', 'JP', 'Tokyo', ?, ?, 'SINGLE')
                ON CONFLICT (id) DO NOTHING
                """, TOKYO, JP_AGENCY_OWNER, JP_BRANCH, TOKYO);
        jdbc.update("""
                INSERT INTO contracts (id, contract_number, country_code, crm_agency_id, counterparty_name,
                                       representative_user_id, contracting_entity, status, created_by)
                VALUES (?, 'PAY-FIXTURE-JP-1', 'JP', ?, 'Pay Fixture Tokyo Agency', ?, 'Pay Fixture Entity', 'ACTIVE', ?)
                ON CONFLICT (id) DO NOTHING
                """, JP_CONTRACT, JP_BRANCH, JP_REP, hq);
        jdbc.update("""
                INSERT INTO contract_versions (id, contract_id, version_no, start_date, end_date, revenue_share_bps,
                                               settlement_basis, rounding_policy, payout_currency, payment_fee_usd,
                                               extra_deduction_usd, approved_by, change_reason, refund_deduction_basis,
                                               payment_fee_deduction_basis, extra_deduction_basis)
                VALUES (?, ?, 1, ?, NULL, 2000, ?, ?, 'USD', 0, 0, ?, 'payment IT fixture', ?, ?, ?)
                ON CONFLICT (id) DO NOTHING
                """, JP_CONTRACT_V1, JP_CONTRACT, Date.valueOf(LocalDate.parse("2026-10-01")),
                SettlementMath.BASIS_PAID_USAGE, SettlementMath.ROUNDING_HALF_UP, hq,
                SettlementMath.REFUND_DEDUCT, SettlementMath.DEDUCTION_FIXED, SettlementMath.DEDUCTION_FIXED);
        // 이미 지급(PAID) 처리된 운영형 월 정산 1건. 테스트는 이 행이 MOCK/TEST 흐름으로 바뀌지 않는지 본다.
        jdbc.update("""
                INSERT INTO monthly_settlements (id, country_code, contract_id, period_key, status, rate_bps,
                                                 settlement_basis, rounding_policy, payout_currency,
                                                 settlement_base_final, compensation_final, hq_share_final, note)
                VALUES (?, 'JP', ?, '2026-10', 'PAID', 2000, ?, ?, 'USD', ?, ?, ?, 'payment IT fixture')
                ON CONFLICT (country_code, contract_id, period_key) DO NOTHING
                """, JP_PAID_SETTLEMENT, JP_CONTRACT, SettlementMath.BASIS_PAID_USAGE, SettlementMath.ROUNDING_HALF_UP,
                new BigDecimal("1.00"), new BigDecimal("0.20"), new BigDecimal("0.80"));
        return JP_REP;
    }

    private static void user(JdbcTemplate jdbc, UUID id, String email, String role, String handle) {
        jdbc.update("""
                INSERT INTO users (id, email, password_hash, role, username, display_name, nickname, country_code)
                VALUES (?, ?, 'x', ?, ?, ?, ?, 'JP') ON CONFLICT (id) DO NOTHING
                """, id, email, role, handle, handle, handle);
    }
}
