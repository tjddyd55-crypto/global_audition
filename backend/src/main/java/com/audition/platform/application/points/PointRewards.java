package com.audition.platform.application.points;

import com.audition.platform.application.points.PointPolicies.Activity;
import com.audition.platform.application.points.PointPolicies.Rule;
import com.audition.platform.application.points.PointPolicies.Settings;
import com.audition.platform.domain.user.User;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.text.Normalizer;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class PointRewards {
    private final JdbcTemplate jdbc;
    private final PointPolicies policies;
    private final PointWallet wallets;

    public PointRewards(JdbcTemplate jdbc, PointPolicies policies, PointWallet wallets) {
        this.jdbc = jdbc;
        this.policies = policies;
        this.wallets = wallets;
    }

    public record Progress(Activity activity, int goal, long award, long progress, boolean consecutive,
                           List<String> profileFields) {}
    private record Event(UUID user, Activity activity, String key, String scope, UUID sourceUser, UUID sourceId) {
        Event(UUID user, Activity activity, String key) {
            this(user, activity, key, "", null, null);
        }
    }

    @Transactional
    public void checkIn(UUID user) {
        Settings settings = policies.settingsForShare();
        PointWallet.Wallet wallet = wallets.lock(user);
        LocalDate day = PointWallet.today();
        Instant now = Instant.now();
        Rule daily = policies.resolve(Activity.DAILY_CHECK_IN, wallet.countryCode(), now);
        Rule monthly = policies.resolve(Activity.MONTHLY_CHECK_IN, wallet.countryCode(), now);
        if (!settings.canEarn() || daily == null && monthly == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,"POINT_CHECK_IN_DISABLED");
        }
        reward(new Event(user, Activity.DAILY_CHECK_IN, day.toString()), daily, wallet, day);
        reward(new Event(user, Activity.MONTHLY_CHECK_IN, day.toString()), monthly, wallets.lock(user), day);
    }

    @Transactional
    public void recordVote(UUID voter, UUID audition, int round) {
        accept(new Event(voter,Activity.PUBLIC_VOTE,audition+":"+round));
    }

    @Transactional
    public void recordVideo(UUID owner, String youtubeId) {
        accept(new Event(owner,Activity.VIDEO,youtubeId));
    }

    @Transactional
    public void recordComment(UUID author, UUID owner, UUID commentId, String body) {
        if (author.equals(owner)) return;
        String text = Normalizer.normalize(body,Normalizer.Form.NFKC).toLowerCase(Locale.ROOT).strip();
        if (text.length()<5 || text.contains("http://") || text.contains("https://") || text.contains("www.")) return;
        String fingerprint = hash(text.replaceAll("[^\\p{L}\\p{N}]",""));
        accept(new Event(author,Activity.COMMENT,fingerprint,"",null,commentId));
    }

    @Transactional
    public void recordLike(UUID viewer, UUID owner, UUID video, String youtubeId) {
        if (viewer.equals(owner) || youtubeId == null) return;
        Event given = new Event(viewer,Activity.LIKE_GIVEN,youtubeId,"",owner,video);
        Event received = new Event(owner,Activity.LIKE_RECEIVED,youtubeId+":"+viewer,youtubeId,viewer,video);
        // Lock wallets consistently when two users like one another's videos concurrently.
        if (viewer.compareTo(owner)<0) {
            accept(given);
            accept(received);
        } else {
            accept(received);
            accept(given);
        }
    }

    @Transactional
    public void recordProfile(User user) {
        var settings = policies.settingsForShare();
        var event = new Event(user.getId(),Activity.PROFILE,"initial");
        if (!settings.canEarn()) return; // A valid profile can be completed under a later policy.
        var wallet = wallets.lock(user.getId());
        var rule = policies.resolve(event.activity(),wallet.countryCode(),Instant.now());
        if (rule == null || !rule.profileFields().stream().allMatch(field -> filled(user,field))) return;
        reward(event,rule,wallet,PointWallet.today());
    }

    void rewardReferral(UUID inviter, UUID invited, Instant invitedSince) {
        if (!policies.settingsForShare().canEarn()) return;
        var wallet = wallets.lock(inviter);
        var rule = policies.resolve(Activity.REFERRAL,wallet.countryCode(),Instant.now());
        if (rule == null || invitedSince.plusSeconds(rule.minAccountDays()*86400L).isAfter(Instant.now())) return;
        reward(new Event(inviter,Activity.REFERRAL,invited.toString(),"",invited,null),rule,wallet,PointWallet.today());
        jdbc.update("UPDATE point_referrals SET completed_at=NOW() WHERE invited_user_id=? AND completed_at IS NULL",invited);
    }

    private void accept(Event event) {
        Settings settings = policies.settingsForShare();
        // Disabled activity is still remembered against delete/recreate or toggling.
        if (!settings.canEarn()) {
            remember(event,null,PointWallet.today(),false);
            return;
        }
        var wallet = wallets.lock(event.user());
        Rule rule = policies.resolve(event.activity(),wallet.countryCode(),Instant.now());
        reward(event,rule,wallet,PointWallet.today());
    }

    private void reward(Event event, Rule rule, PointWallet.Wallet wallet, LocalDate day) {
        boolean eligible = rule != null && (rule.dailyEventLimit()==0
                || dailyEvents(event.user(),rule,day)<rule.dailyEventLimit());
        boolean inserted = remember(event,rule,day,eligible);
        if (!eligible) return;
        if (!inserted) {
            if (event.activity()!=Activity.LIKE_RECEIVED || !sameRule(event,rule)) return;
            // Re-liking can restore an active count, but the achieved milestone can only pay once.
        }

        if (!rule.repeatable() && Boolean.TRUE.equals(jdbc.queryForObject("""
                SELECT EXISTS(SELECT 1 FROM point_entries WHERE user_id=? AND activity=? AND kind='EARN')
                """,Boolean.class,event.user(),event.activity().name()))) return;

        long progress = progress(event.user(),rule,day,event.scope(),event.sourceId());
        if (progress < rule.goal()) return;

        String milestone;
        if (event.activity() == Activity.MONTHLY_CHECK_IN && !rule.consecutive()) {
            if (progress % rule.goal() != 0) return;
            milestone = day.withDayOfMonth(1) + ":" + progress / rule.goal();
        } else if (event.activity() == Activity.MONTHLY_CHECK_IN) {
            if (progress % rule.goal() != 0) return;
            milestone = day + ":streak";
        } else {
            if (progress % rule.goal() != 0) return;
            milestone = event.activity()==Activity.LIKE_RECEIVED ? event.scope()+":"+progress/rule.goal() : event.key();
        }
        if (!withinLimits(event.user(),rule,day)) return;
        wallets.post(event.user(),wallet,rule.award(),"EARN",rule.activity().name(),rule.activity().name(),
                rule.id(),rule.revision(),null,event.sourceId(),
                "earn:"+rule.id()+":"+rule.revision()+":"+milestone,day);
    }

    private boolean remember(Event event, Rule rule, LocalDate day, boolean eligible) {
        return jdbc.update("""
                INSERT INTO point_activity_events(user_id,activity,event_key,event_day,policy_id,policy_revision,
                                                  progress_scope,source_user_id,source_id)
                VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT DO NOTHING
                """,event.user(),event.activity().name(),event.key(),day,
                eligible ? rule.id() : null,eligible ? rule.revision() : null,
                event.scope(),event.sourceUser(),event.sourceId())>0;
    }

    private boolean sameRule(Event event, Rule rule) {
        return Boolean.TRUE.equals(jdbc.queryForObject("""
                SELECT EXISTS(SELECT 1 FROM point_activity_events
                WHERE user_id=? AND activity=? AND event_key=? AND policy_id=? AND policy_revision=?)
                """,Boolean.class,event.user(),event.activity().name(),event.key(),rule.id(),rule.revision()));
    }

    private long dailyEvents(UUID user, Rule rule, LocalDate day) {
        return jdbc.queryForObject("""
                SELECT COUNT(*) FROM point_activity_events
                WHERE user_id=? AND policy_id=? AND policy_revision=? AND event_day=?
                """,Long.class,user,rule.id(),rule.revision(),day);
    }

    private boolean withinLimits(UUID user, Rule rule, LocalDate day) {
        return Boolean.TRUE.equals(jdbc.queryForObject("""
                SELECT (?=0 OR COUNT(*) FILTER (WHERE event_day=?) < ?)
                    AND (?=0 OR COUNT(*) < ?)
                    AND (?=0 OR COALESCE(SUM(amount),0) + ? <= ?)
                FROM point_entries
                WHERE user_id=? AND activity=? AND kind='EARN' AND event_day>=?
                """,Boolean.class,rule.dailyLimit(),day,rule.dailyLimit(),
                rule.monthlyLimit(),rule.monthlyLimit(),rule.monthlyPointLimit(),rule.award(),rule.monthlyPointLimit(),
                user,rule.activity().name(),day.withDayOfMonth(1)));
    }

    private long progress(UUID user, Rule rule, LocalDate day, String scope, UUID video) {
        if (rule.activity()==Activity.MONTHLY_CHECK_IN) {
            List<LocalDate> days = jdbc.query("""
                    SELECT event_day FROM point_activity_events
                    WHERE user_id=? AND policy_id=? AND policy_revision=? AND event_day>=?
                    """,(rs,row)->rs.getObject(1,LocalDate.class),user,rule.id(),rule.revision(),day.withDayOfMonth(1));
            if (!rule.consecutive()) return days.size();
            var checked = new HashSet<>(days);
            long length = 0;
            while (checked.contains(day.minusDays(length))) length++;
            return length;
        }
        if (rule.activity()==Activity.DAILY_CHECK_IN) return dailyEvents(user,rule,day);
        if (rule.activity()==Activity.LIKE_RECEIVED) {
            if (video == null) {
                return jdbc.queryForObject("""
                        SELECT COALESCE(MAX(n),0) FROM (
                            SELECT COUNT(*) n FROM point_activity_events e
                            JOIN channel_video_reactions r ON r.user_id=e.source_user_id AND r.video_id=e.source_id AND r.reaction='LIKE'
                            WHERE e.user_id=? AND e.policy_id=? AND e.policy_revision=? GROUP BY progress_scope
                        ) counts
                        """,Long.class,user,rule.id(),rule.revision());
            }
            return jdbc.queryForObject("""
                    SELECT COUNT(*) FROM point_activity_events e
                    JOIN channel_video_reactions r ON r.user_id=e.source_user_id AND r.video_id=? AND r.reaction='LIKE'
                    WHERE e.user_id=? AND e.policy_id=? AND e.policy_revision=? AND e.progress_scope=?
                    """,Long.class,video,user,rule.id(),rule.revision(),scope);
        }
        return jdbc.queryForObject("""
                SELECT COUNT(*) FROM point_activity_events
                WHERE user_id=? AND policy_id=? AND policy_revision=?
                """,Long.class,user,rule.id(),rule.revision());
    }

    public List<Progress> progress(UUID user, Settings settings, PointWallet.Wallet wallet) {
        var out = new ArrayList<Progress>();
        if (!settings.canEarn()) return out;
        for (Activity activity : Activity.values()) {
            Rule rule = policies.resolve(activity,wallet.countryCode(),Instant.now());
            if (rule == null) continue;
            long value = progress(user,rule,PointWallet.today(),"",null);
            out.add(new Progress(activity,rule.goal(),rule.award(),value,rule.consecutive(),rule.profileFields()));
        }
        return out;
    }

    public List<LocalDate> attendance(UUID user) {
        return jdbc.query("""
                SELECT event_day FROM point_activity_events
                WHERE user_id=? AND activity='DAILY_CHECK_IN' AND event_day>=? ORDER BY event_day
                """,(rs,n)->rs.getObject(1,LocalDate.class),user,PointWallet.today().withDayOfMonth(1));
    }

    private static String hash(String text) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(text.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    private static boolean filled(User user, String key) {
        Object value = switch (key) {
            case "nickname" -> user.getNickname();
            case "birthDate" -> user.getBirthDate();
            case "countryCode" -> user.getCountryCode();
            case "bio" -> user.getBio();
            case "profileImageUrl" -> user.getProfileImageUrl();
            case "nationality" -> user.getNationality();
            case "residenceCountry" -> user.getResidenceCountry();
            case "introText" -> user.getIntroText();
            default -> null;
        };
        return value != null && (!(value instanceof String s) || !s.isBlank());
    }
}
