package com.audition.platform.application.channel;

import com.audition.platform.api.dto.channel.PublicChannelListItemResponse;
import com.audition.platform.application.me.ChannelShownFields;
import com.audition.platform.application.user.NationalityCodes;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.sql.Array;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * 공개 채널 목록(검색·국가·분야·정렬). 비공개 채널, 정지 계정, 운영자가 숨긴 채널은 넣지 않는다.
 * 숫자는 실제 집계(구독=팔로워, 공개 영상 내부 조회수 합)만 쓰고 임의 값을 만들지 않는다.
 */
@Service
public class PublicChannelDiscoveryService {

    public static final List<String> SORTS = List.of("NEWEST", "RECENT_ACTIVITY", "POPULAR", "VIEWS", "FOLLOWERS");
    private static final Set<String> NARROW_COUNTRIES = Set.of("KR", "MN", "JP", "KH", "UZ");

    private final JdbcTemplate jdbc;

    public PublicChannelDiscoveryService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public record Row(UUID userId, String nickname, String profileImage, String introText, String shortBio,
                      String nationality, String residence, String[] categories, String[] shown, UUID featuredVideoId,
                      Instant createdAt, Instant lastActiveAt, long subscribers, long videoCount, long totalViews,
                      long likes, Instant lastVideoAt, Instant channelUpdatedAt) {

        boolean visible(String key) {
            return ChannelShownFields.visible(shown, key);
        }

        Instant activity() {
            Instant best = createdAt;
            for (Instant t : new Instant[]{lastActiveAt, lastVideoAt, channelUpdatedAt}) {
                if (t != null && (best == null || t.isAfter(best))) {
                    best = t;
                }
            }
            return best;
        }

        long popularity() {
            return subscribers * 20 + likes * 5 + totalViews;
        }
    }

    public List<Row> rows() {
        return jdbc.query("""
                SELECT u.id, u.nickname, COALESCE(NULLIF(trim(u.profile_image_url), ''), NULLIF(trim(c.profile_image_url), '')) AS img,
                       u.intro_text, u.short_bio, u.nationality, u.residence_country, u.channel_categories,
                       u.channel_shown_fields, u.featured_video_id, u.created_at, u.last_active_at,
                       COALESCE(c.subscriber_count, 0) AS subs, c.updated_at AS ch_updated,
                       COALESCE(v.cnt, 0) AS cnt, COALESCE(v.views, 0) AS views, COALESCE(v.likes, 0) AS likes, v.last_at
                FROM users u
                LEFT JOIN channels c ON c.owner_id = u.id
                LEFT JOIN (
                    SELECT owner_id, COUNT(*) AS cnt, SUM(view_count) AS views, SUM(like_count) AS likes, MAX(created_at) AS last_at
                    FROM channel_videos WHERE visibility = 'PUBLIC' AND COALESCE(moderation_hidden, FALSE) = FALSE
                    GROUP BY owner_id
                ) v ON v.owner_id = u.id
                WHERE u.is_channel_public = TRUE
                  AND u.role IN ('APPLICANT', 'ADMIN')
                  AND COALESCE(u.account_status, 'ACTIVE') = 'ACTIVE'
                  AND COALESCE(u.channel_moderation_hidden, FALSE) = FALSE
                """, (rs, n) -> map(rs));
    }

    public record Featured(UUID videoId, String thumbnailUrl) {
    }

    public Map<UUID, Featured> featured(List<UUID> owners) {
        Map<UUID, Featured> out = new HashMap<>();
        if (owners.isEmpty()) {
            return out;
        }
        jdbc.query("""
                SELECT DISTINCT ON (v.owner_id) v.owner_id, v.id, v.thumbnail_url, v.youtube_video_id
                FROM channel_videos v JOIN users u ON u.id = v.owner_id
                WHERE v.owner_id = ANY (?) AND v.visibility = 'PUBLIC' AND COALESCE(v.moderation_hidden, FALSE) = FALSE
                ORDER BY v.owner_id, (v.id = u.featured_video_id) DESC NULLS LAST, v.created_at DESC
                """, ps -> ps.setArray(1, ps.getConnection().createArrayOf("uuid", owners.toArray())), rs -> {
            String thumb = rs.getString("thumbnail_url");
            String yt = rs.getString("youtube_video_id");
            if ((thumb == null || thumb.isBlank()) && yt != null) {
                thumb = YoutubeVideoRef.thumbnailUrl(yt);
            }
            out.put(rs.getObject("owner_id", UUID.class), new Featured(rs.getObject("id", UUID.class), thumb));
        });
        return out;
    }

    public List<PublicChannelListItemResponse> list(String q, String country, String field, String legacyCategory,
                                                    String sort, Integer limit, Integer offset) {
        String wantedCountry = normCountry(country);
        String wantedField = field != null && !field.isBlank() ? field : legacyCategory;
        String needle = q == null || q.isBlank() ? null : q.trim().toLowerCase(Locale.ROOT);
        List<Row> hits = new ArrayList<>();
        for (Row r : rows()) {
            if (needle != null && (r.nickname() == null || !r.nickname().toLowerCase(Locale.ROOT).contains(needle))) {
                continue;
            }
            if (wantedCountry != null && !countryMatches(r, wantedCountry)) {
                continue;
            }
            if (wantedField != null && !wantedField.isBlank() && !"ALL".equalsIgnoreCase(wantedField)
                    && !(r.visible(ChannelShownFields.SPECIALTIES) && fieldMatches(r.categories(), wantedField))) {
                continue;
            }
            hits.add(r);
        }
        hits.sort(comparator(sort));
        int from = Math.max(0, offset == null ? 0 : offset);
        int size = Math.max(1, Math.min(100, limit == null ? 60 : limit));
        List<Row> page = from >= hits.size() ? List.of() : hits.subList(from, Math.min(hits.size(), from + size));
        Map<UUID, Featured> feat = featured(page.stream().map(Row::userId).toList());
        return page.stream().map(r -> toItem(r, feat.get(r.userId()))).toList();
    }

    static boolean fieldMatches(String[] categories, String wanted) {
        if (ChannelPortfolioRules.matchesField(categories, wanted)) {
            return true;
        }
        // 레거시 자유 입력 분야(예: "보컬")도 그대로 찾는다.
        String w = wanted.trim().toLowerCase(Locale.ROOT);
        if (categories == null) {
            return false;
        }
        for (String c : categories) {
            if (c != null && c.toLowerCase(Locale.ROOT).contains(w)) {
                return true;
            }
        }
        return false;
    }

    static boolean countryMatches(Row r, String wanted) {
        String nat = r.visible(ChannelShownFields.NATIONALITY) ? up(r.nationality()) : null;
        String res = r.visible(ChannelShownFields.RESIDENCE) ? up(r.residence()) : null;
        if ("OTHER".equals(wanted)) {
            return (nat != null && !NARROW_COUNTRIES.contains(nat)) || (res != null && !NARROW_COUNTRIES.contains(res));
        }
        return wanted.equals(nat) || wanted.equals(res);
    }

    static Comparator<Row> comparator(String sort) {
        String s = sort == null ? "NEWEST" : sort.trim().toUpperCase(Locale.ROOT);
        Comparator<Row> byName = Comparator.comparing(r -> r.nickname() == null ? "" : r.nickname(), String.CASE_INSENSITIVE_ORDER);
        Comparator<Row> primary = switch (s) {
            case "RECENT_ACTIVITY" -> Comparator.comparing(Row::activity, Comparator.nullsLast(Comparator.reverseOrder()));
            case "POPULAR" -> Comparator.comparingLong(Row::popularity).reversed();
            case "VIEWS" -> Comparator.comparingLong(Row::totalViews).reversed();
            case "FOLLOWERS" -> Comparator.comparingLong(Row::subscribers).reversed();
            default -> Comparator.comparing(Row::createdAt, Comparator.nullsLast(Comparator.reverseOrder()));
        };
        return primary.thenComparing(byName);
    }

    private PublicChannelListItemResponse toItem(Row r, Featured f) {
        PublicChannelListItemResponse row = new PublicChannelListItemResponse();
        row.setUserId(r.userId().toString());
        row.setNickname(r.nickname());
        row.setProfileImage(r.profileImage());
        if (r.visible(ChannelShownFields.INTRO)) {
            row.setIntroText(trim(r.introText()));
        }
        if (r.visible(ChannelShownFields.SHORT_BIO)) {
            row.setShortBio(trim(r.shortBio()));
        }
        if (r.visible(ChannelShownFields.NATIONALITY)) {
            row.setNationality(trim(r.nationality()));
        }
        if (r.visible(ChannelShownFields.RESIDENCE)) {
            row.setResidenceCountry(trim(r.residence()));
        }
        if (r.visible(ChannelShownFields.SPECIALTIES)) {
            row.setCategories(r.categories() == null ? List.of() : List.of(r.categories()));
            row.setMainField(ChannelPortfolioRules.mainField(r.categories()));
        }
        row.setSubscriberCount(r.subscribers());
        row.setVideoCount(r.videoCount());
        row.setTotalViews(r.totalViews());
        row.setCreatedAt(r.createdAt());
        row.setLastActiveAt(r.activity());
        if (f != null) {
            row.setFeaturedVideoId(f.videoId().toString());
            row.setFeaturedThumbnailUrl(f.thumbnailUrl());
        }
        return row;
    }

    private static String normCountry(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String c = raw.trim().toUpperCase(Locale.ROOT);
        if ("ALL".equals(c) || "GLOBAL".equals(c)) {
            return null;
        }
        return NationalityCodes.ALLOWED.contains(c) ? c : c;
    }

    private static String up(String s) {
        return s == null || s.isBlank() ? null : s.trim().toUpperCase(Locale.ROOT);
    }

    private static String trim(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    private static Row map(ResultSet rs) throws SQLException {
        return new Row(rs.getObject("id", UUID.class), rs.getString("nickname"), rs.getString("img"),
                rs.getString("intro_text"), rs.getString("short_bio"), rs.getString("nationality"),
                rs.getString("residence_country"), arr(rs.getArray("channel_categories")),
                rs.getArray("channel_shown_fields") == null ? null : arr(rs.getArray("channel_shown_fields")),
                rs.getObject("featured_video_id", UUID.class), ts(rs.getTimestamp("created_at")),
                ts(rs.getTimestamp("last_active_at")), rs.getLong("subs"), rs.getLong("cnt"), rs.getLong("views"),
                rs.getLong("likes"), ts(rs.getTimestamp("last_at")), ts(rs.getTimestamp("ch_updated")));
    }

    static String[] arr(Array a) throws SQLException {
        if (a == null) {
            return new String[0];
        }
        Object o = a.getArray();
        return o instanceof String[] s ? s : new String[0];
    }

    private static Instant ts(Timestamp t) {
        return t == null ? null : t.toInstant();
    }
}
