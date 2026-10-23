package com.audition.platform.application.credit;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * 표시 전용. credit_lots 잔량을 읽기만 하고 소비 순서나 원장은 바꾸지 않는다.
 * 지갑 잔액과 로트 합이 다를 수 있으므로 둘을 하나로 맞추지 않는다.
 */
@Component
public class CreditLotRemainingQuery {

    public record Split(long freeRemaining, long paidRemaining, long unclassifiedRemaining) {
    }

    private final JdbcTemplate jdbcTemplate;

    public CreditLotRemainingQuery(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Split forUser(UUID userId) {
        Split split = jdbcTemplate.queryForObject(
                """
                SELECT
                    COALESCE(SUM(remaining_credits) FILTER (WHERE bucket = 'FREE'), 0),
                    COALESCE(SUM(remaining_credits) FILTER (WHERE bucket = 'PAID'), 0),
                    COALESCE(SUM(remaining_credits) FILTER (WHERE bucket = 'UNCLASSIFIED'), 0)
                FROM credit_lots
                WHERE user_id = ?
                """,
                (rs, rowNum) -> new Split(rs.getLong(1), rs.getLong(2), rs.getLong(3)),
                userId);
        return split != null ? split : new Split(0, 0, 0);
    }
}
