package com.audition.platform.application.notifications;

import com.audition.platform.application.casting.UserNotificationService;
import com.audition.platform.application.recommend.AgeEligibility;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.sql.Date;
import java.sql.Timestamp;
import java.time.Clock;
import java.time.Period;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * 앱 내부 알림 보충: 관심 공고 D-3/D-1, 조건에 맞는 신규 공고, 누락된 결과·제안 점검.
 * 푸시는 보내지 않는다. 중복은 user_notifications.dedupe_key 로 막는다.
 */
@Service
public class InAppNotificationFanout {

    public static final String SAVED_AUDITION_DEADLINE = "SAVED_AUDITION_DEADLINE";
    public static final String NEW_MATCHING_AUDITION = "NEW_MATCHING_AUDITION";
    public static final String APPLICATION_RESULT = "APPLICATION_RESULT";

    private static final Logger log = LoggerFactory.getLogger(InAppNotificationFanout.class);

    private final JdbcTemplate jdbc;
    private final UserNotificationService notifications;
    private final Clock clock;

    @Autowired
    public InAppNotificationFanout(JdbcTemplate jdbc, UserNotificationService notifications) {
        this(jdbc, notifications, Clock.systemUTC());
    }

    InAppNotificationFanout(JdbcTemplate jdbc, UserNotificationService notifications, Clock clock) {
        this.jdbc = jdbc;
        this.notifications = notifications;
        this.clock = clock;
    }

    public int sweep() {
        int deadlines = fanoutSavedDeadlines();
        int matches = fanoutNewMatches();
        int results = backfillResults();
        int offers = backfillOffers();
        if (deadlines + matches + results + offers > 0) {
            log.info("in-app notification sweep deadlines={} matches={} results={} offers={}",
                    deadlines, matches, results, offers);
        }
        return deadlines + matches + results + offers;
    }

    int fanoutSavedDeadlines() {
        LocalDate today = LocalDate.now(clock);
        int count = 0;
        List<DeadlineRow> rows = jdbc.query("""
                SELECT s.user_id, a.id AS audition_id, a.title, a.end_date
                FROM audition_saves s
                JOIN auditions a ON a.id = s.audition_id
                LEFT JOIN user_notification_settings pref ON pref.user_id = s.user_id
                WHERE a.status = 'OPEN'
                  AND a.end_date IS NOT NULL
                  AND COALESCE(pref.saved_deadline, TRUE)
                """, (rs, i) -> new DeadlineRow(
                rs.getObject("user_id", UUID.class),
                rs.getObject("audition_id", UUID.class),
                rs.getString("title"),
                ts(rs.getTimestamp("end_date"))));
        for (DeadlineRow row : rows) {
            int days = remainingDays(today, row.endDate());
            if (days != 3 && days != 1) {
                continue;
            }
            String key = "saved-deadline:" + row.auditionId() + ":D" + days;
            notifications.notify(row.userId(), SAVED_AUDITION_DEADLINE,
                    Map.of("title", safe(row.title()), "days", String.valueOf(days), "auditionId", row.auditionId().toString()),
                    "/auditions/" + row.auditionId(), key);
            count++;
        }
        return count;
    }

    int fanoutNewMatches() {
        Instant since = clock.instant().minus(48, ChronoUnit.HOURS);
        int count = 0;
        List<MatchAudition> auditions = jdbc.query("""
                SELECT id, title, country_code, recruit_fields, qualifications, owner_id, created_at
                FROM auditions
                WHERE status = 'OPEN' AND created_at >= ?
                """, (rs, i) -> new MatchAudition(
                rs.getObject("id", UUID.class),
                rs.getString("title"),
                rs.getString("country_code"),
                toArray(rs.getArray("recruit_fields")),
                toArray(rs.getArray("qualifications")),
                rs.getObject("owner_id", UUID.class)), Timestamp.from(since));
        for (MatchAudition audition : auditions) {
            count += notifyMatchingUsers(audition);
        }
        return count;
    }

    private int notifyMatchingUsers(MatchAudition audition) {
        int count = 0;
        List<MatchUser> users = jdbc.query("""
                SELECT u.id, u.nationality, u.residence_country, u.country_code, u.birth_date, u.activity_fields
                FROM users u
                LEFT JOIN user_notification_settings pref ON pref.user_id = u.id
                WHERE COALESCE(pref.new_match, TRUE)
                  AND (? IS NULL OR u.id <> ?)
                  AND u.activity_fields IS NOT NULL AND cardinality(u.activity_fields) > 0
                  AND NOT EXISTS (
                    SELECT 1 FROM applications ap WHERE ap.applicant_id = u.id AND ap.audition_id = ?
                  )
                """, (rs, i) -> new MatchUser(
                rs.getObject("id", UUID.class),
                rs.getString("nationality"),
                rs.getString("residence_country"),
                rs.getString("country_code"),
                rs.getDate("birth_date"),
                toArray(rs.getArray("activity_fields"))), audition.ownerId(), audition.ownerId(), audition.id());
        for (MatchUser user : users) {
            if (!countryMatches(audition.countryCode(), user) || !fieldMatches(audition.recruitFields(), user.activityFields())) {
                continue;
            }
            if (ageIneligible(audition.qualifications(), user.birthDate())) {
                continue;
            }
            notifications.notify(user.id(), NEW_MATCHING_AUDITION,
                    Map.of("title", safe(audition.title()), "auditionId", audition.id().toString()),
                    "/auditions/" + audition.id(),
                    "new-match:" + audition.id());
            count++;
        }
        return count;
    }

    int backfillResults() {
        int[] holder = new int[] {0};
        jdbc.query("""
                SELECT a.id, a.applicant_id, a.audition_id, a.status, au.title
                FROM applications a
                JOIN auditions au ON au.id = a.audition_id
                LEFT JOIN user_notification_settings pref ON pref.user_id = a.applicant_id
                WHERE a.status IN ('ACCEPTED', 'REJECTED')
                  AND COALESCE(pref.results, TRUE)
                  AND NOT EXISTS (
                    SELECT 1 FROM audition_round_notifications n
                    WHERE n.application_id = a.id AND n.channel = 'IN_APP'
                      AND n.notification_type IN ('PASS_NOTICE', 'FAIL_NOTICE', 'FINAL_NOTICE')
                  )
                """, rs -> {
            UUID applicationId = rs.getObject("id", UUID.class);
            UUID userId = rs.getObject("applicant_id", UUID.class);
            UUID auditionId = rs.getObject("audition_id", UUID.class);
            String status = rs.getString("status");
            String title = safe(rs.getString("title"));
            notifications.notify(userId, APPLICATION_RESULT,
                    Map.of("title", title, "status", status, "auditionId", auditionId.toString()),
                    "/auditions/" + auditionId,
                    "application-result:" + applicationId);
            holder[0]++;
        });
        return holder[0];
    }

    int backfillOffers() {
        int[] holder = new int[] {0};
        jdbc.query("""
                SELECT o.id, o.talent_user_id
                FROM casting_offers o
                LEFT JOIN user_notification_settings pref ON pref.user_id = o.talent_user_id
                WHERE o.status IN ('SENT', 'READ')
                  AND COALESCE(pref.offers, TRUE)
                  AND NOT EXISTS (
                    SELECT 1 FROM user_notifications n
                    WHERE n.user_id = o.talent_user_id
                      AND n.dedupe_key = 'offer-new:' || o.id::text
                  )
                """, rs -> {
            UUID offerId = rs.getObject("id", UUID.class);
            UUID userId = rs.getObject("talent_user_id", UUID.class);
            notifications.notify(userId, UserNotificationService.CASTING_OFFER_NEW,
                    Map.of("offerId", offerId.toString()),
                    "/my/studio/casting/" + offerId,
                    "offer-new:" + offerId);
            holder[0]++;
        });
        return holder[0];
    }

    static int remainingDays(LocalDate today, Instant endDate) {
        if (endDate == null) {
            return -1;
        }
        LocalDate end = endDate.atZone(ZoneOffset.UTC).toLocalDate();
        return (int) ChronoUnit.DAYS.between(today, end);
    }

    static boolean countryMatches(String auditionCountry, MatchUser user) {
        String code = normalize(auditionCountry);
        if (code.isEmpty() || "ALL".equals(code) || "GLOBAL".equals(code)) {
            return true;
        }
        return code.equals(normalize(user.residenceCountry()))
                || code.equals(normalize(user.countryCode()))
                || code.equals(normalize(user.nationality()));
    }

    static boolean fieldMatches(String[] recruit, String[] activity) {
        if (recruit == null || recruit.length == 0 || activity == null || activity.length == 0) {
            return false;
        }
        for (String field : recruit) {
            String want = normalize(field);
            if (want.isEmpty()) continue;
            for (String have : activity) {
                if (want.equals(normalize(have))) {
                    return true;
                }
            }
        }
        return false;
    }

    private boolean ageIneligible(String[] qualifications, Date birthDate) {
        if (birthDate == null) {
            return false;
        }
        int age = Period.between(birthDate.toLocalDate(), LocalDate.now(clock)).getYears();
        return AgeEligibility.evaluate(qualifications, age) == AgeEligibility.Status.INELIGIBLE;
    }


    private static String[] toArray(java.sql.Array array) {
        try {
            if (array == null) return new String[0];
            Object raw = array.getArray();
            if (raw instanceof String[] strings) return strings;
            if (raw instanceof Object[] objects) {
                String[] out = new String[objects.length];
                for (int i = 0; i < objects.length; i++) {
                    out[i] = objects[i] == null ? "" : String.valueOf(objects[i]);
                }
                return out;
            }
        } catch (Exception ignored) {
            // 손상된 배열은 빈 값으로 본다.
        }
        return new String[0];
    }

    private static Instant ts(java.sql.Timestamp t) {
        return t == null ? null : t.toInstant();
    }

    private static String normalize(String value) {
        return value == null ? "" : value.trim().toUpperCase();
    }

    private static String safe(String value) {
        return value == null ? "" : value;
    }

    record DeadlineRow(UUID userId, UUID auditionId, String title, Instant endDate) {}
    record MatchAudition(UUID id, String title, String countryCode, String[] recruitFields, String[] qualifications, UUID ownerId) {}
    record MatchUser(UUID id, String nationality, String residenceCountry, String countryCode, Date birthDate, String[] activityFields) {}
}
