package com.audition.platform.application.points;

import com.audition.platform.application.credit.SuperAdminAuthHelper;
import com.audition.platform.infra.SecurityUtils;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class PointPolicies {
    public enum Activity {
        DAILY_CHECK_IN, MONTHLY_CHECK_IN, LIKE_RECEIVED, LIKE_GIVEN, COMMENT, REFERRAL, VIDEO, PUBLIC_VOTE, PROFILE
    }

    public record Settings(boolean enabled, boolean earningEnabled, boolean spendingEnabled,
                           boolean auditionEnabled, long auditionCost) {
        public boolean canSpend() {
            return enabled && spendingEnabled && auditionEnabled;
        }
        public boolean canEarn() {
            return enabled && earningEnabled;
        }
    }

    public record Rule(UUID id, Activity activity, String countryCode, String name, boolean enabled, int goal,
                       long award, boolean repeatable, int dailyLimit, int monthlyLimit, int dailyEventLimit,
                       long monthlyPointLimit, boolean consecutive, List<String> profileFields, int minAccountDays,
                       Instant startsAt, Instant endsAt, int revision) {}
    public record Change(String scope, UUID actorId, String beforeConfig, String afterConfig, Instant changedAt) {}

    private static final Set<String> PROFILE_FIELDS = Set.of("nickname", "birthDate", "countryCode", "bio",
            "profileImageUrl", "nationality", "residenceCountry", "introText");
    private final JdbcTemplate jdbc;
    private final ObjectMapper json;

    public PointPolicies(JdbcTemplate jdbc, ObjectMapper json) {
        this.jdbc = jdbc;
        this.json = json;
    }

    public Settings settings() {
        return readSettings("");
    }

    Settings settingsForShare() {
        return readSettings(" FOR SHARE");
    }

    private Settings readSettings(String lock) {
        return jdbc.queryForObject("""
                SELECT enabled,earning_enabled,spending_enabled,audition_enabled,audition_cost
                FROM point_settings WHERE singleton
                """ + lock, (rs,n) -> new Settings(rs.getBoolean(1),rs.getBoolean(2),rs.getBoolean(3),
                rs.getBoolean(4),rs.getLong(5)));
    }

    @Transactional
    public Settings updateSettings(Settings data) {
        SuperAdminAuthHelper.requireSuperAdmin();
        if (data.auditionCost() < 1 || data.auditionCost() > 1_000_000_000L) invalid("INVALID_POINT_COST");
        Settings before = readSettings(" FOR UPDATE");
        jdbc.update("""
                UPDATE point_settings SET enabled=?,earning_enabled=?,spending_enabled=?,audition_enabled=?,audition_cost=?
                WHERE singleton
                """, data.enabled(),data.earningEnabled(),data.spendingEnabled(),data.auditionEnabled(),data.auditionCost());
        saveHistory("SETTINGS", before, data);
        return data;
    }

    public List<Rule> rules() {
        SuperAdminAuthHelper.requireSuperAdmin();
        return jdbc.query("SELECT * FROM point_policies ORDER BY activity,country_code", this::mapRule);
    }

    Rule resolve(Activity activity, String country, Instant now) {
        var rows = jdbc.query("""
                SELECT * FROM point_policies
                WHERE activity=? AND country_code IN ('',COALESCE(?,''))
                ORDER BY country_code DESC
                """, this::mapRule, activity.name(), country);
        // A country override can intentionally disable that activity for the country.
        if (rows.isEmpty()) return null;
        Rule rule = rows.get(0);
        if (!rule.enabled() || rule.startsAt() != null && now.isBefore(rule.startsAt())
                || rule.endsAt() != null && !now.isBefore(rule.endsAt())) return null;
        return rule;
    }

    @Transactional
    public Rule updateRule(Rule data) {
        SuperAdminAuthHelper.requireSuperAdmin();
        if (data.activity() == null) invalid("INVALID_POINT_ACTIVITY");
        String country = data.countryCode() == null ? "" : data.countryCode().strip().toUpperCase(Locale.ROOT);
        if (!country.isEmpty() && !Set.of(Locale.getISOCountries()).contains(country)) invalid("INVALID_POINT_COUNTRY");
        validate(data);
        readSettings(" FOR UPDATE"); // Serialize edits with reward processing.
        Rule before = jdbc.query("SELECT * FROM point_policies WHERE activity=? AND country_code=?", this::mapRule,
                data.activity().name(),country).stream().findFirst().orElse(null);
        if (before != null && before.revision() != data.revision()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "POINT_POLICY_CHANGED");
        }
        UUID id = before == null ? UUID.randomUUID() : before.id();
        int revision = before == null ? 1 : before.revision() + 1;
        List<String> fields = data.profileFields() == null ? List.of() : data.profileFields();
        jdbc.update("""
                INSERT INTO point_policies(id,activity,country_code,name,enabled,goal,award,repeatable,daily_limit,
                  monthly_limit,daily_event_limit,monthly_point_limit,consecutive,profile_fields,min_account_days,
                  starts_at,ends_at,revision)
                VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,string_to_array(?,','),?,?,?,?)
                ON CONFLICT(activity,country_code) DO UPDATE SET
                  name=EXCLUDED.name,enabled=EXCLUDED.enabled,goal=EXCLUDED.goal,award=EXCLUDED.award,
                  repeatable=EXCLUDED.repeatable,daily_limit=EXCLUDED.daily_limit,monthly_limit=EXCLUDED.monthly_limit,
                  daily_event_limit=EXCLUDED.daily_event_limit,monthly_point_limit=EXCLUDED.monthly_point_limit,
                  consecutive=EXCLUDED.consecutive,profile_fields=EXCLUDED.profile_fields,
                  min_account_days=EXCLUDED.min_account_days,starts_at=EXCLUDED.starts_at,ends_at=EXCLUDED.ends_at,
                  revision=EXCLUDED.revision,effective_at=NOW()
                """, id,data.activity().name(),country,data.name().strip(),data.enabled(),data.goal(),data.award(),
                data.repeatable(),data.dailyLimit(),data.monthlyLimit(),data.dailyEventLimit(),data.monthlyPointLimit(),
                data.consecutive(),String.join(",",fields),data.minAccountDays(),timestamp(data.startsAt()),
                timestamp(data.endsAt()),revision);
        Rule updated = jdbc.queryForObject("SELECT * FROM point_policies WHERE id=?", this::mapRule,id);
        saveHistory(id.toString(), before, updated);
        return updated;
    }

    public List<Change> history(int page) {
        SuperAdminAuthHelper.requireSuperAdmin();
        if (page < 0) invalid("INVALID_PAGE");
        return jdbc.query("""
                SELECT scope,actor_id,before_config::text,after_config::text,changed_at
                FROM point_policy_history ORDER BY id DESC LIMIT 50 OFFSET ?
                """, (rs,n) -> new Change(rs.getString(1),rs.getObject(2,UUID.class),rs.getString(3),
                rs.getString(4),rs.getTimestamp(5).toInstant()), (long)page*50);
    }

    private void saveHistory(String scope, Object before, Object after) {
        try {
            jdbc.update("""
                    INSERT INTO point_policy_history(scope,actor_id,before_config,after_config)
                    VALUES (?,?,?::jsonb,?::jsonb)
                    """,scope,SecurityUtils.getCurrentUserId(),json.writeValueAsString(before),json.writeValueAsString(after));
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Cannot snapshot point policy",e);
        }
    }

    private static void validate(Rule data) {
        if (data.name()==null || data.name().isBlank() || data.name().length()>120
                || data.goal()<1 || data.goal()>100_000 || data.award()<1 || data.award()>1_000_000_000L
                || data.dailyLimit()<0 || data.dailyLimit()>10_000 || data.monthlyLimit()<0 || data.monthlyLimit()>100_000
                || data.dailyEventLimit()<0 || data.dailyEventLimit()>100_000 || data.monthlyPointLimit()<0
                || data.monthlyPointLimit()>100_000_000_000L || data.minAccountDays()<0 || data.minAccountDays()>365
                || data.startsAt()!=null && data.endsAt()!=null && !data.endsAt().isAfter(data.startsAt())) {
            invalid("INVALID_POINT_POLICY");
        }
        if (data.activity()==Activity.MONTHLY_CHECK_IN && data.goal()>28) invalid("INVALID_MONTHLY_GOAL");
        if ((data.activity()==Activity.PROFILE || data.activity()==Activity.DAILY_CHECK_IN) && data.goal()!=1) {
            invalid("INVALID_POINT_GOAL");
        }
        if (data.activity()==Activity.PROFILE && (data.repeatable() || data.profileFields()==null
                || data.profileFields().isEmpty() || !PROFILE_FIELDS.containsAll(data.profileFields()))) {
            invalid("INVALID_PROFILE_POINT_FIELDS");
        }
        if (data.activity()==Activity.REFERRAL && data.minAccountDays()<1) invalid("INVALID_REFERRAL_MINIMUM_AGE");
    }

    private Rule mapRule(ResultSet rs, int row) throws SQLException {
        return new Rule(rs.getObject("id",UUID.class),Activity.valueOf(rs.getString("activity")),
                rs.getString("country_code"),rs.getString("name"),rs.getBoolean("enabled"),rs.getInt("goal"),
                rs.getLong("award"),rs.getBoolean("repeatable"),rs.getInt("daily_limit"),rs.getInt("monthly_limit"),
                rs.getInt("daily_event_limit"),rs.getLong("monthly_point_limit"),rs.getBoolean("consecutive"),
                Arrays.asList((String[])rs.getArray("profile_fields").getArray()),rs.getInt("min_account_days"),
                instant(rs.getTimestamp("starts_at")),instant(rs.getTimestamp("ends_at")),rs.getInt("revision"));
    }

    private static Instant instant(Timestamp value) { return value==null ? null : value.toInstant(); }
    private static Timestamp timestamp(Instant value) { return value==null ? null : Timestamp.from(value); }

    static void invalid(String code) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,code);
    }
}
