package com.audition.platform.application.points;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

@Service
public class PointWallet {
    private final JdbcTemplate jdbc;

    public PointWallet(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public record Wallet(long balance, String countryCode) {}
    public record Entry(UUID id, UUID userId, long amount, long balanceAfter, String kind, String reason,
                        String activity, UUID actorId, UUID referenceId, Instant createdAt) {}
    public record Totals(long earnedToday, long earnedMonth, long earnedTotal, long spentTotal) {}

    public static LocalDate today() {
        return LocalDate.now(ZoneOffset.UTC);
    }

    public Wallet read(UUID user) {
        return jdbc.query("""
                SELECT COALESCE(w.balance,0), CASE WHEN w.user_id IS NULL THEN u.country_code ELSE w.country_code END
                FROM users u LEFT JOIN point_wallets w ON w.user_id=u.id WHERE u.id=?
                """, (rs, row) -> new Wallet(rs.getLong(1), rs.getString(2)), user)
                .stream().findFirst().orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,"POINT_MEMBER_NOT_FOUND"));
    }

    /** The first valid ledger operation fixes the server-side policy country. */
    @Transactional(propagation = Propagation.MANDATORY)
    public Wallet lock(UUID user) {
        jdbc.update("""
                INSERT INTO point_wallets(user_id,country_code)
                SELECT id,country_code FROM users WHERE id=?
                ON CONFLICT DO NOTHING
                """, user);
        return jdbc.query("""
                SELECT balance,country_code FROM point_wallets WHERE user_id=? FOR UPDATE
                """, (rs, row) -> new Wallet(rs.getLong(1), rs.getString(2)), user)
                .stream().findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "POINT_MEMBER_NOT_FOUND"));
    }

    /** A caller must hold the wallet row lock. Duplicate operations do not touch the balance. */
    @Transactional(propagation = Propagation.MANDATORY)
    public boolean post(UUID user, Wallet wallet, long amount, String kind, String reason, String activity,
                        UUID policy, Integer revision, UUID actor, UUID reference, String key, LocalDate day) {
        Boolean exists = jdbc.queryForObject(
                "SELECT EXISTS(SELECT 1 FROM point_entries WHERE user_id=? AND dedup_key=?)",
                Boolean.class, user, key);
        if (Boolean.TRUE.equals(exists)) return false;
        long balance;
        try {
            balance = Math.addExact(wallet.balance(), amount);
        } catch (ArithmeticException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "POINT_BALANCE_LIMIT");
        }
        if (balance < 0) throw new ResponseStatusException(HttpStatus.CONFLICT, "INSUFFICIENT_POINTS");
        jdbc.update("""
                INSERT INTO point_entries(id,user_id,amount,balance_after,kind,reason,activity,policy_id,
                    policy_revision,actor_id,reference_id,event_day,dedup_key)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
                """, UUID.randomUUID(), user, amount, balance, kind, reason, activity, policy,
                revision, actor, reference, day, key);
        jdbc.update("UPDATE point_wallets SET balance=? WHERE user_id=?", balance, user);
        return true;
    }

    public List<Entry> entries(UUID user, int page) {
        if (page < 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "INVALID_PAGE");
        return jdbc.query("""
                SELECT id,user_id,amount,balance_after,kind,reason,activity,actor_id,reference_id,created_at
                FROM point_entries WHERE (?::uuid IS NULL OR user_id=?)
                ORDER BY created_at DESC,id DESC LIMIT 50 OFFSET ?
                """, (rs, row) -> new Entry(rs.getObject(1, UUID.class), rs.getObject(2, UUID.class), rs.getLong(3), rs.getLong(4),
                rs.getString(5), rs.getString(6), rs.getString(7), rs.getObject(8, UUID.class),
                rs.getObject(9, UUID.class), rs.getTimestamp(10).toInstant()), user,user,(long)page*50);
    }

    public Totals totals(UUID user, LocalDate day) {
        return jdbc.queryForObject("""
                SELECT COALESCE(SUM(amount) FILTER (WHERE kind='EARN' AND event_day=?),0),
                       COALESCE(SUM(amount) FILTER (WHERE kind='EARN' AND event_day>=?),0),
                       COALESCE(SUM(amount) FILTER (WHERE kind IN ('EARN','ADMIN_GRANT')),0),
                       COALESCE(SUM(-amount) FILTER (WHERE kind='AUDITION_APPLY'),0)
                FROM point_entries WHERE user_id=?
                """, (rs,n) -> new Totals(rs.getLong(1),rs.getLong(2),rs.getLong(3),rs.getLong(4)),
                day,day.withDayOfMonth(1),user);
    }
}
