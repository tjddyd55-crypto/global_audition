package com.audition.platform.application.points;

import com.audition.platform.application.consent.MinorPolicyService;
import com.audition.platform.application.credit.CreditPolicyKey;
import com.audition.platform.application.credit.CreditService;
import com.audition.platform.application.credit.SuperAdminAuthHelper;
import com.audition.platform.domain.user.User;
import com.audition.platform.domain.user.UserRepository;
import com.audition.platform.infra.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class PointsService {
    private final JdbcTemplate jdbc;
    private final PointPolicies policies;
    private final PointWallet wallets;
    private final PointRewards rewards;
    private final CreditService credits;
    private final UserRepository users;
    private final MinorPolicyService minors;

    public PointsService(JdbcTemplate jdbc, PointPolicies policies, PointWallet wallets,
                         PointRewards rewards, CreditService credits, UserRepository users, MinorPolicyService minors) {
        this.jdbc = jdbc;
        this.policies = policies;
        this.wallets = wallets;
        this.rewards = rewards;
        this.credits = credits;
        this.users = users;
        this.minors = minors;
    }

    public record Quote(long creditBalance, long creditCost, long pointBalance, long pointCost, boolean pointAllowed) {}
    public record Dashboard(boolean enabled, Quote quote, PointWallet.Totals totals, LocalDate today,
                            List<LocalDate> attendance, List<PointRewards.Progress> activities,
                            boolean referralEligible) {}
    public record Adjustment(UUID userId, UUID requestId, long amount, String reason, UUID revokeEntryId) {}
    public record Member(UUID userId, PointWallet.Wallet wallet, PointWallet.Totals totals) {}

    public Dashboard dashboard(UUID user) {
        var settings = policies.settings();
        var wallet = wallets.read(user);
        LocalDate day = PointWallet.today();
        return new Dashboard(settings.enabled(),quote(user,settings,wallet),wallets.totals(user,day),day,
                rewards.attendance(user),rewards.progress(user,settings,wallet),findReferrer(user)!=null);
    }

    public Quote quote(UUID user) {
        return quote(user,policies.settings(),wallets.read(user));
    }

    private Quote quote(UUID user, PointPolicies.Settings settings, PointWallet.Wallet wallet) {
        var creditPolicy = credits.getPolicyPublicSnapshot(CreditPolicyKey.AUDITION_APPLY);
        return new Quote(credits.getBalance(user),creditPolicy.getApplicationFeeCredits(),wallet.balance(),
                settings.auditionCost(),settings.canSpend());
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void payForApplication(UUID user, UUID application, Long expectedCost) {
        var settings = policies.settingsForShare();
        if (!settings.canSpend()) throw new ResponseStatusException(HttpStatus.CONFLICT,"POINT_APPLICATION_DISABLED");
        if (expectedCost == null || expectedCost != settings.auditionCost()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,"POINT_COST_CHANGED");
        }
        var wallet = wallets.lock(user);
        wallets.post(user,wallet,-settings.auditionCost(),"AUDITION_APPLY","AUDITION_APPLY",null,null,null,
                null,application,"audition:"+application,PointWallet.today());
    }

    public Member member(UUID id) {
        SuperAdminAuthHelper.requireSuperAdmin();
        return new Member(id,wallets.read(id),wallets.totals(id,PointWallet.today()));
    }

    @Transactional
    public Member adjust(Adjustment adjustment) {
        SuperAdminAuthHelper.requireSuperAdmin();
        if (adjustment.userId()==null || adjustment.requestId()==null || adjustment.reason()==null
                || adjustment.reason().isBlank() || adjustment.reason().length()>500) {
            PointPolicies.invalid("POINT_ADJUSTMENT_REASON_REQUIRED");
        }
        UUID user = adjustment.userId();
        var wallet = wallets.lock(user);
        long delta = adjustment.amount();
        UUID original = adjustment.revokeEntryId();
        String kind = delta > 0 ? "ADMIN_GRANT" : "ADMIN_DEDUCT";
        if (original != null) {
            delta = jdbc.query("""
                    SELECT -amount FROM point_entries WHERE id=? AND user_id=? AND kind='EARN'
                    """,(rs,n)->rs.getLong(1),original,user).stream().findFirst()
                    .orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"POINT_REWARD_NOT_FOUND"));
            kind = "REVOKE";
        } else if (delta==0 || delta < -1_000_000_000L || delta > 1_000_000_000L) {
            PointPolicies.invalid("INVALID_POINT_ADJUSTMENT");
        }
        String key = original == null ? "admin:"+adjustment.requestId() : "revoke:"+original;
        wallets.post(user,wallet,delta,kind,adjustment.reason().strip(),null,null,null,
                SecurityUtils.getCurrentUserId(),original,key,PointWallet.today());
        return member(user);
    }

    @Transactional
    public UUID inviteCode(UUID user) {
        jdbc.update("INSERT INTO point_invite_codes(user_id,code) VALUES (?,?) ON CONFLICT DO NOTHING",
                user,UUID.randomUUID());
        return jdbc.queryForObject("SELECT code FROM point_invite_codes WHERE user_id=?",UUID.class,user);
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void registerReferral(UUID invitedUser, UUID code) {
        if (code==null) return;
        jdbc.update("""
                INSERT INTO point_referrals(invited_user_id,inviter_user_id)
                SELECT ?,c.user_id FROM point_invite_codes c
                JOIN users inviter ON inviter.id=c.user_id
                WHERE c.code=? AND c.user_id<>? AND inviter.account_status='ACTIVE'
                ON CONFLICT DO NOTHING
                """,invitedUser,code,invitedUser);
    }

    @Transactional
    public void confirmReferral(UUID invited) {
        UUID inviter = jdbc.query("""
                SELECT inviter_user_id FROM point_referrals WHERE invited_user_id=? AND completed_at IS NULL FOR UPDATE
                """,(rs,n)->rs.getObject(1,UUID.class),invited).stream().findFirst().orElse(null);
        if (inviter==null) return;
        User user = users.findById(invited).orElseThrow();
        if (!"ACTIVE".equals(user.getAccountStatus()) || user.getBirthDate()==null
                || user.getCountryCode()==null || user.getNickname()==null
                || !minors.status(user).applyAllowed()) return;
        User referrer = users.findById(inviter).orElse(null);
        if (referrer==null || !"ACTIVE".equals(referrer.getAccountStatus())) return;
        // A second intentional signed-in visit after the configured account age is required.
        rewards.rewardReferral(inviter,invited,user.getCreatedAt());
    }

    private UUID findReferrer(UUID invited) {
        return jdbc.query("SELECT inviter_user_id FROM point_referrals WHERE invited_user_id=? AND completed_at IS NULL",
                (rs,n)->rs.getObject(1,UUID.class),invited).stream().findFirst().orElse(null);
    }

    public Map<String,Object> stats() {
        SuperAdminAuthHelper.requireSuperAdmin();
        var summary = jdbc.queryForMap("""
                SELECT (SELECT COUNT(*) FROM applications) AS total_applications,
                    COALESCE(SUM(amount) FILTER (WHERE kind IN ('EARN','ADMIN_GRANT')),0) AS earned,
                    COALESCE(SUM(-amount) FILTER (WHERE kind='AUDITION_APPLY'),0) AS used,
                    (SELECT COALESCE(SUM(balance),0) FROM point_wallets) AS held,
                    COUNT(*) FILTER (WHERE kind='AUDITION_APPLY') AS point_applications,
                    COUNT(DISTINCT user_id) FILTER (WHERE kind='AUDITION_APPLY') AS spending_members,
                    (SELECT COUNT(DISTINCT ra.application_id) FROM revenue_attributions ra
                        JOIN credit_lot_allocations ca ON ca.usage_credit_transaction_id=ra.credit_transaction_id
                        JOIN credit_lots l ON l.id=ca.lot_id
                        WHERE ra.recognition='SALES' AND ra.line_kind='REVENUE' AND ca.bucket='PAID'
                          AND ca.status='ALLOCATED' AND ca.payable_usd>0 AND (l.ledger_environment IS NULL OR l.ledger_environment NOT IN ('MOCK','TEST'))) AS paid_applications
                FROM point_entries
                """);
        var byActivity = jdbc.queryForList("""
                SELECT activity, SUM(amount) AS points, COUNT(DISTINCT user_id) AS members
                FROM point_entries WHERE kind='EARN' GROUP BY 1 ORDER BY 1
                """);
        var byCountry = jdbc.queryForList("""
                SELECT COALESCE(w.country_code,'') AS country, SUM(e.amount) AS points
                FROM point_entries e JOIN point_wallets w ON w.user_id=e.user_id
                WHERE e.kind='EARN' GROUP BY 1 ORDER BY 1
                """);
        var byDay = jdbc.queryForList("""
                SELECT event_day, COALESCE(SUM(amount) FILTER (WHERE kind='EARN'),0) AS earned,
                       COALESCE(SUM(-amount) FILTER (WHERE kind='AUDITION_APPLY'),0) AS used
                FROM point_entries WHERE event_day>=CURRENT_DATE-89 GROUP BY 1 ORDER BY 1 DESC
                """);
        var byMonth = jdbc.queryForList("""
                SELECT to_char(event_day,'YYYY-MM') AS period,
                       COALESCE(SUM(amount) FILTER (WHERE kind='EARN'),0) AS earned,
                       COALESCE(SUM(-amount) FILTER (WHERE kind='AUDITION_APPLY'),0) AS used
                FROM point_entries WHERE event_day>=CURRENT_DATE-365 GROUP BY 1 ORDER BY 1 DESC
                """);
        return Map.of("summary",summary,"activities",byActivity,"countries",byCountry,"days",byDay,"months",byMonth);
    }
}
