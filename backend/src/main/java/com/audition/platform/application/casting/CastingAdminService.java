package com.audition.platform.application.casting;

import com.audition.platform.application.audit.AdminAuditLogService;
import com.audition.platform.application.org.OrgAccess;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * 슈퍼관리자: 채널·캐스팅 통계, 신고 처리, 기획사 제안 권한 제한·한도, 채널/영상 숨김.
 * 모든 변경은 감사 로그에 남긴다. 관리자는 계약을 만들지 않는다.
 */
@Service
public class CastingAdminService {

    private final OrgAccess access;
    private final JdbcTemplate jdbc;
    private final CastingSafetyStore safety;
    private final AdminAuditLogService audit;

    public CastingAdminService(OrgAccess access, JdbcTemplate jdbc, CastingSafetyStore safety, AdminAuditLogService audit) {
        this.access = access;
        this.jdbc = jdbc;
        this.safety = safety;
        this.audit = audit;
    }

    public record CountRow(String key, long count) {
    }

    public record DailyRow(LocalDate day, long sent, long accepted) {
    }

    public record AgencyRow(String agencyUserId, String name, long sent, long accepted, long declined, long open,
                            double acceptanceRate, boolean restricted, Integer dailyLimit, long openReports) {
    }

    public record Stats(long publicChannels, List<CountRow> channelsByCountry, List<CountRow> talentsByField,
                        long publicVideos, long talentSearchVisible, long castingOptIn, List<DailyRow> dailyOffers,
                        List<AgencyRow> offersByAgency, long totalOffers, double acceptanceRate,
                        List<CountRow> offersByStatus, List<CountRow> reportsByStatus) {
    }

    public Stats stats() {
        access.requireHq();
        long publicChannels = one("""
                SELECT COUNT(*) FROM users WHERE is_channel_public = TRUE AND role IN ('APPLICANT','ADMIN')
                  AND COALESCE(account_status,'ACTIVE') = 'ACTIVE' AND COALESCE(channel_moderation_hidden, FALSE) = FALSE
                """);
        List<CountRow> byCountry = counts("""
                SELECT COALESCE(NULLIF(upper(nationality), ''), 'UNSPECIFIED') AS k, COUNT(*) FROM users
                WHERE is_channel_public = TRUE AND role IN ('APPLICANT','ADMIN') AND COALESCE(account_status,'ACTIVE') = 'ACTIVE'
                GROUP BY 1 ORDER BY 2 DESC
                """);
        List<CountRow> byField = counts("""
                SELECT upper(f) AS k, COUNT(DISTINCT u.id) FROM users u, unnest(u.channel_categories) AS f
                WHERE u.is_channel_public = TRUE AND u.role = 'APPLICANT' GROUP BY 1 ORDER BY 2 DESC LIMIT 20
                """);
        long videos = one("SELECT COUNT(*) FROM channel_videos WHERE visibility = 'PUBLIC' AND COALESCE(moderation_hidden, FALSE) = FALSE");
        long searchVisible = one("SELECT COUNT(*) FROM users WHERE talent_search_visible = TRUE AND is_channel_public = TRUE");
        long optIn = one("SELECT COUNT(*) FROM users WHERE casting_offers_enabled = TRUE");
        List<DailyRow> daily = jdbc.query("""
                SELECT d::date AS day,
                       (SELECT COUNT(*) FROM casting_offers o WHERE o.created_at::date = d::date) AS sent,
                       (SELECT COUNT(*) FROM casting_offers o WHERE o.status = 'ACCEPTED' AND o.responded_at::date = d::date) AS accepted
                FROM generate_series(CURRENT_DATE - INTERVAL '13 days', CURRENT_DATE, INTERVAL '1 day') AS d
                ORDER BY d
                """, (rs, i) -> new DailyRow(rs.getDate("day").toLocalDate(), rs.getLong("sent"), rs.getLong("accepted")));
        List<AgencyRow> agencies = jdbc.query("""
                SELECT o.agency_user_id, COALESCE(NULLIF(u.display_name, ''), u.nickname, u.email) AS name,
                       COUNT(*) AS sent,
                       COUNT(*) FILTER (WHERE o.status = 'ACCEPTED') AS accepted,
                       COUNT(*) FILTER (WHERE o.status = 'DECLINED') AS declined,
                       COUNT(*) FILTER (WHERE o.status IN ('SENT','READ')) AS open,
                       COALESCE(c.offers_restricted, FALSE) AS restricted, c.daily_limit,
                       (SELECT COUNT(*) FROM casting_reports r WHERE r.agency_user_id = o.agency_user_id AND r.status = 'OPEN') AS reports
                FROM casting_offers o JOIN users u ON u.id = o.agency_user_id
                LEFT JOIN agency_casting_controls c ON c.agency_user_id = o.agency_user_id
                GROUP BY o.agency_user_id, u.display_name, u.nickname, u.email, c.offers_restricted, c.daily_limit
                ORDER BY sent DESC LIMIT 50
                """, (rs, i) -> {
            long sent = rs.getLong("sent");
            long accepted = rs.getLong("accepted");
            long declined = rs.getLong("declined");
            return new AgencyRow(rs.getString("agency_user_id"), rs.getString("name"), sent, accepted, declined,
                    rs.getLong("open"), rate(accepted, accepted + declined), rs.getBoolean("restricted"),
                    (Integer) rs.getObject("daily_limit"), rs.getLong("reports"));
        });
        long total = one("SELECT COUNT(*) FROM casting_offers");
        long accepted = one("SELECT COUNT(*) FROM casting_offers WHERE status = 'ACCEPTED'");
        long responded = one("SELECT COUNT(*) FROM casting_offers WHERE status IN ('ACCEPTED','DECLINED')");
        return new Stats(publicChannels, byCountry, byField, videos, searchVisible, optIn, daily, agencies, total,
                rate(accepted, responded), counts("SELECT status, COUNT(*) FROM casting_offers GROUP BY 1 ORDER BY 1"),
                counts("SELECT status, COUNT(*) FROM casting_reports GROUP BY 1 ORDER BY 1"));
    }

    public record ReportView(String id, String offerId, String offerTitle, String agencyUserId, String agencyName,
                             String reporterUserId, String reporterName, String reason, String detail, String status,
                             String resolutionNote, Instant createdAt, Instant handledAt) {
    }

    public List<ReportView> reports(String status) {
        access.requireHq();
        String s = status == null || status.isBlank() ? null : status.trim().toUpperCase();
        return jdbc.query("""
                SELECT r.id, r.offer_id, o.title, r.agency_user_id,
                       COALESCE(NULLIF(a.display_name, ''), a.nickname, a.email) AS agency_name,
                       r.reporter_user_id, COALESCE(NULLIF(p.nickname, ''), p.display_name) AS reporter_name,
                       r.reason, r.detail, r.status, r.resolution_note, r.created_at, r.handled_at
                FROM casting_reports r
                LEFT JOIN casting_offers o ON o.id = r.offer_id
                JOIN users a ON a.id = r.agency_user_id
                JOIN users p ON p.id = r.reporter_user_id
                """ + (s != null ? " WHERE r.status = ?" : "") + " ORDER BY r.created_at DESC LIMIT 300",
                (rs, i) -> new ReportView(rs.getString("id"), rs.getString("offer_id"), rs.getString("title"),
                        rs.getString("agency_user_id"), rs.getString("agency_name"), rs.getString("reporter_user_id"),
                        rs.getString("reporter_name"), rs.getString("reason"), rs.getString("detail"),
                        rs.getString("status"), rs.getString("resolution_note"),
                        CastingOfferStore.ts(rs, "created_at"), CastingOfferStore.ts(rs, "handled_at")),
                s != null ? new Object[]{s} : new Object[]{});
    }

    @Transactional
    public void resolveReport(UUID id, String status, String note, boolean restrictAgency) {
        OrgAccess.Actor admin = access.requireHq();
        String s = status == null ? "" : status.trim().toUpperCase();
        if (!List.of("RESOLVED", "DISMISSED").contains(s)) {
            throw CastingRules.bad("REPORT_STATUS_INVALID");
        }
        CastingSafetyStore.Report before = safety.findReport(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "REPORT_NOT_FOUND"));
        if (safety.resolveReport(id, s, CastingRules.text(note, 1000), admin.id()) == 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "REPORT_ALREADY_HANDLED");
        }
        audit.log(admin.id(), "CASTING_REPORT_" + s, "CASTING_REPORT", id.toString(),
                Map.of("status", before.status()), Map.of("status", s));
        if (restrictAgency) {
            setControl(before.agencyUserId(), true, "REPORT:" + id, null);
        }
    }

    @Transactional
    public CastingSafetyStore.Control setControl(UUID agencyUserId, boolean restricted, String reason, Integer dailyLimit) {
        OrgAccess.Actor admin = access.requireHq();
        if (dailyLimit != null && (dailyLimit < 0 || dailyLimit > 500)) {
            throw CastingRules.bad("DAILY_LIMIT_INVALID");
        }
        Integer role = jdbc.queryForObject("SELECT COUNT(*) FROM users WHERE id = ? AND role IN ('AGENCY','AGENCY_ADMIN')",
                Integer.class, agencyUserId);
        if (role == null || role == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "AGENCY_NOT_FOUND");
        }
        CastingSafetyStore.Control before = safety.control(agencyUserId).orElse(null);
        safety.upsertControl(agencyUserId, restricted, CastingRules.text(reason, 300), dailyLimit, admin.id());
        CastingSafetyStore.Control after = safety.control(agencyUserId).orElseThrow();
        audit.log(admin.id(), "CASTING_AGENCY_CONTROL", "AGENCY", agencyUserId.toString(), before, after);
        return after;
    }

    public record AgencyControlView(String agencyUserId, String email, String name, boolean approved,
                                    boolean restricted, String reason, Integer dailyLimit, String planCode,
                                    long sent30d, long openReports) {
    }

    public List<AgencyControlView> agencies() {
        access.requireHq();
        return jdbc.query("""
                SELECT u.id, u.email, COALESCE(NULLIF(u.display_name, ''), u.nickname) AS name,
                       EXISTS (SELECT 1 FROM crm_agencies a WHERE a.linked_user_id = u.id AND a.approval_state = 'APPROVED' AND a.stage = 'ACTIVE') AS approved,
                       COALESCE(c.offers_restricted, FALSE) AS restricted, c.restricted_reason, c.daily_limit,
                       COALESCE(c.plan_code, 'FREE') AS plan_code,
                       (SELECT COUNT(*) FROM casting_offers o WHERE o.agency_user_id = u.id AND o.created_at > NOW() - INTERVAL '30 days') AS sent,
                       (SELECT COUNT(*) FROM casting_reports r WHERE r.agency_user_id = u.id AND r.status = 'OPEN') AS reports
                FROM users u LEFT JOIN agency_casting_controls c ON c.agency_user_id = u.id
                WHERE u.role IN ('AGENCY','AGENCY_ADMIN') AND COALESCE(u.account_status, 'ACTIVE') = 'ACTIVE'
                ORDER BY approved DESC, sent DESC, name LIMIT 500
                """, (rs, i) -> new AgencyControlView(rs.getString("id"), rs.getString("email"), rs.getString("name"),
                rs.getBoolean("approved"), rs.getBoolean("restricted"), rs.getString("restricted_reason"),
                (Integer) rs.getObject("daily_limit"), rs.getString("plan_code"), rs.getLong("sent"), rs.getLong("reports")));
    }

    @Transactional
    public void moderateChannel(UUID userId, boolean hidden, String reason) {
        OrgAccess.Actor admin = access.requireHq();
        int n = jdbc.update("UPDATE users SET channel_moderation_hidden = ? WHERE id = ?", hidden, userId);
        if (n == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND");
        }
        audit.log(admin.id(), hidden ? "CHANNEL_HIDE" : "CHANNEL_UNHIDE", "CHANNEL", userId.toString(), null,
                reasonMap(reason));
    }

    @Transactional
    public void moderateVideo(UUID videoId, boolean hidden, String reason) {
        OrgAccess.Actor admin = access.requireHq();
        int n = jdbc.update("UPDATE channel_videos SET moderation_hidden = ? WHERE id = ?", hidden, videoId);
        if (n == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "VIDEO_NOT_FOUND");
        }
        audit.log(admin.id(), hidden ? "CHANNEL_VIDEO_HIDE" : "CHANNEL_VIDEO_UNHIDE", "CHANNEL_VIDEO", videoId.toString(),
                null, reasonMap(reason));
    }

    public record ModerationChannel(String userId, String nickname, String email, boolean publicChannel,
                                    boolean hidden, long videos, long openReportsAsAgency) {
    }

    public List<ModerationChannel> channels(String q) {
        access.requireHq();
        String needle = q == null || q.isBlank() ? null : "%" + q.trim().toLowerCase() + "%";
        return jdbc.query("""
                SELECT u.id, u.nickname, u.email, u.is_channel_public, COALESCE(u.channel_moderation_hidden, FALSE) AS hidden,
                       (SELECT COUNT(*) FROM channel_videos v WHERE v.owner_id = u.id) AS videos
                FROM users u WHERE u.role IN ('APPLICANT','ADMIN')
                """ + (needle != null ? " AND (lower(u.nickname) LIKE ? OR lower(u.email) LIKE ?)" : " AND (u.is_channel_public = TRUE OR u.channel_moderation_hidden = TRUE)")
                        + " ORDER BY hidden DESC, u.created_at DESC LIMIT 200",
                (rs, i) -> new ModerationChannel(rs.getString("id"), rs.getString("nickname"), rs.getString("email"),
                        rs.getBoolean("is_channel_public"), rs.getBoolean("hidden"), rs.getLong("videos"), 0),
                needle != null ? new Object[]{needle, needle} : new Object[]{});
    }

    public record ModerationVideo(String videoId, String title, String videoUrl, String visibility, boolean hidden,
                                  String embedStatus, long viewCount) {
    }

    public List<ModerationVideo> channelVideos(UUID userId) {
        access.requireHq();
        return jdbc.query("""
                SELECT id, title, video_url, visibility, COALESCE(moderation_hidden, FALSE) AS hidden, embed_status, view_count
                FROM channel_videos WHERE owner_id = ? ORDER BY created_at DESC LIMIT 100
                """, (rs, i) -> new ModerationVideo(rs.getString("id"), rs.getString("title"), rs.getString("video_url"),
                rs.getString("visibility"), rs.getBoolean("hidden"), rs.getString("embed_status"), rs.getLong("view_count")), userId);
    }

    private Map<String, String> reasonMap(String reason) {
        Map<String, String> m = new LinkedHashMap<>();
        m.put("reason", CastingRules.text(reason, 300));
        return m;
    }

    private long one(String sql) {
        Long n = jdbc.queryForObject(sql, Long.class);
        return n == null ? 0 : n;
    }

    private List<CountRow> counts(String sql) {
        return jdbc.query(sql, (rs, i) -> new CountRow(rs.getString(1), rs.getLong(2)));
    }

    static double rate(long part, long whole) {
        return whole <= 0 ? 0 : Math.round(part * 1000.0 / whole) / 10.0;
    }
}
