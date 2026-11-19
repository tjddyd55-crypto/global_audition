package com.audition.platform.application.casting;

import com.audition.platform.application.channel.CastingOfferEligibility;
import com.audition.platform.application.channel.ChannelPortfolioRules;
import com.audition.platform.application.channel.PublicChannelDiscoveryService;
import com.audition.platform.application.consent.ConsentService;
import com.audition.platform.application.consent.MinorPolicyService;
import com.audition.platform.application.me.ChannelShownFields;
import com.audition.platform.infra.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.sql.Array;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * 승인 기획사 전용 인재 검색 + 저장 인재(그룹·내부 메모).
 * 대상: 공개 채널 + '기획사 인재 검색 노출'을 켠 활성 지원자 + 국가별 정책상 필요한 보호자 확인 완료
 * + 개인정보 공개 범위 동의를 철회하지 않은 회원. 본인이 차단한 기획사는 제외. 미성년자라는 이유만으로 빼지 않는다.
 * 각 항목은 지원자가 공개로 고른 값만 보이고, 비공개 값(성별·연령대·국적 등)으로는 필터링도 하지 않는다.
 * 실명·생년월일·전화번호·이메일·주소는 검색 결과에 넣지 않는다.
 */
@Service
public class TalentSearchService {

    private static final Set<String> NARROW = Set.of("KR", "MN", "JP", "KH", "UZ");
    private final JdbcTemplate jdbc;
    private final CastingService casting;
    private final CastingOfferEligibility eligibility;
    private final PublicChannelDiscoveryService discovery;
    private final MinorPolicyService minorPolicy;
    private final ConsentService consents;

    public TalentSearchService(JdbcTemplate jdbc, CastingService casting, CastingOfferEligibility eligibility,
                               PublicChannelDiscoveryService discovery, MinorPolicyService minorPolicy,
                               ConsentService consents) {
        this.jdbc = jdbc;
        this.casting = casting;
        this.eligibility = eligibility;
        this.discovery = discovery;
        this.minorPolicy = minorPolicy;
        this.consents = consents;
    }

    public record Filter(String q, String nationality, String residence, List<String> ageBands, String field,
                         String language, Boolean hasCareer, Integer activeWithinDays, Boolean acceptsOffers,
                         String sort, Integer limit, Integer offset, String gender) {

        public Filter(String q, String nationality, String residence, List<String> ageBands, String field,
                      String language, Boolean hasCareer, Integer activeWithinDays, Boolean acceptsOffers,
                      String sort, Integer limit, Integer offset) {
            this(q, nationality, residence, ageBands, field, language, hasCareer, activeWithinDays, acceptsOffers,
                    sort, limit, offset, null);
        }
    }

    public record TalentCard(String userId, String nickname, String realName, String profileImageUrl,
                             String nationality, String residenceCountry, String ageBand, String mainField,
                             List<String> fields, List<String> languages, String shortBio, int careerCount,
                             long videoCount, long followers, Instant lastActiveAt, boolean acceptsOffers,
                             String featuredThumbnailUrl, boolean saved, String savedGroup, String lastOfferStatus,
                             boolean available, String gender) {
    }

    public record Page(List<TalentCard> items, int total) {
    }

    record Row(UUID id, String nickname, String name, String img, String nationality, String residence,
               LocalDate birthDate, String[] categories, String[] languages, String[] shown, String shortBio,
               boolean casting, String role, int careers, long videos, long followers, Instant created,
               Instant lastActive, Instant lastVideo, String country, String gender, MinorPolicyService.Status policy) {

        Row withPolicy(MinorPolicyService.Status p) {
            return new Row(id, nickname, name, img, nationality, residence, birthDate, categories, languages, shown,
                    shortBio, casting, role, careers, videos, followers, created, lastActive, lastVideo, country, gender, p);
        }

        boolean visible(String key) {
            return ChannelShownFields.visible(shown, key);
        }

        Instant activity() {
            Instant best = created;
            for (Instant t : new Instant[]{lastActive, lastVideo}) {
                if (t != null && (best == null || t.isAfter(best))) {
                    best = t;
                }
            }
            return best;
        }
    }

    public Page search(Filter f) {
        UUID agency = casting.requireApprovedAgency();
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        List<Row> rows = rows(agency, null);
        String needle = f.q() == null || f.q().isBlank() ? null : f.q().trim().toLowerCase(Locale.ROOT);
        String nat = up(f.nationality());
        String res = up(f.residence());
        String field = up(f.field());
        String lang = f.language() == null || f.language().isBlank() ? null : f.language().trim().toLowerCase(Locale.ROOT);
        Instant activeSince = f.activeWithinDays() != null && f.activeWithinDays() > 0
                ? Instant.now().minus(Duration.ofDays(f.activeWithinDays())) : null;
        List<Row> hits = new ArrayList<>();
        String gender = up(f.gender());
        for (Row r : rows) {
            if (gender != null && !(r.visible(ChannelShownFields.GENDER) && gender.equals(up(r.gender())))) {
                continue;
            }
            if (needle != null && !nameMatches(r, needle)) {
                continue;
            }
            if (nat != null && !countryMatches(r.visible(ChannelShownFields.NATIONALITY) ? up(r.nationality()) : null, nat)) {
                continue;
            }
            if (res != null && !countryMatches(r.visible(ChannelShownFields.RESIDENCE) ? up(r.residence()) : null, res)) {
                continue;
            }
            if (f.ageBands() != null && !f.ageBands().isEmpty()) {
                String band = r.visible(ChannelShownFields.AGE) ? ChannelPortfolioRules.ageBand(r.birthDate(), today) : null;
                if (band == null || !f.ageBands().contains(band)) {
                    continue;
                }
            }
            if (field != null && !"ALL".equals(field)
                    && !(r.visible(ChannelShownFields.SPECIALTIES) && ChannelPortfolioRules.matchesField(r.categories(), field))) {
                continue;
            }
            if (lang != null && !(r.visible(ChannelShownFields.LANGUAGES) && contains(r.languages(), lang))) {
                continue;
            }
            if (Boolean.TRUE.equals(f.hasCareer()) && r.careers() == 0) {
                continue;
            }
            if (activeSince != null && (r.activity() == null || r.activity().isBefore(activeSince))) {
                continue;
            }
            if (Boolean.TRUE.equals(f.acceptsOffers()) && !accepts(r, today)) {
                continue;
            }
            hits.add(r);
        }
        hits.sort(comparator(f.sort()));
        int from = Math.max(0, f.offset() == null ? 0 : f.offset());
        int size = Math.max(1, Math.min(60, f.limit() == null ? 30 : f.limit()));
        List<Row> page = from >= hits.size() ? List.of() : hits.subList(from, Math.min(hits.size(), from + size));
        return new Page(cards(agency, page, today), hits.size());
    }

    // ───── 저장 인재 ─────

    public record SavedView(String id, String group, String memo, Instant savedAt, TalentCard talent) {
    }

    public List<SavedView> saved(String group) {
        UUID agency = casting.requireApprovedAgency();
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        List<Object[]> saved = jdbc.query("""
                SELECT id, talent_user_id, group_name, memo, created_at FROM agency_saved_talents
                WHERE agency_user_id = ?""" + (group != null && !group.isBlank() ? " AND group_name = ?" : "")
                        + " ORDER BY created_at DESC LIMIT 500",
                (rs, i) -> new Object[]{rs.getObject(1, UUID.class), rs.getObject(2, UUID.class), rs.getString(3),
                        rs.getString(4), ts(rs.getTimestamp(5))},
                group != null && !group.isBlank() ? new Object[]{agency, group.trim()} : new Object[]{agency});
        List<UUID> ids = saved.stream().map(s -> (UUID) s[1]).toList();
        Map<UUID, Row> rowMap = new HashMap<>();
        for (Row r : rows(agency, ids)) {
            rowMap.put(r.id(), r);
        }
        Map<UUID, TalentCard> cards = new HashMap<>();
        for (TalentCard c : cards(agency, new ArrayList<>(rowMap.values()), today)) {
            cards.put(UUID.fromString(c.userId()), c);
        }
        List<SavedView> out = new ArrayList<>();
        for (Object[] s : saved) {
            UUID talent = (UUID) s[1];
            TalentCard card = cards.get(talent);
            if (card == null) {
                // 지원자가 채널을 비공개로 돌렸거나 검색 노출을 껐다 → 이름만 남기고 상세는 숨긴다.
                card = unavailable(talent);
            }
            out.add(new SavedView(s[0].toString(), (String) s[2], (String) s[3], (Instant) s[4], card));
        }
        return out;
    }

    public List<String> groups() {
        UUID agency = casting.requireApprovedAgency();
        return jdbc.queryForList("""
                SELECT DISTINCT group_name FROM agency_saved_talents
                WHERE agency_user_id = ? AND group_name IS NOT NULL ORDER BY group_name
                """, String.class, agency);
    }

    @Transactional
    public SavedView save(UUID talentId, String group, String memo) {
        UUID agency = casting.requireApprovedAgency();
        if (rows(agency, List.of(talentId)).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "TALENT_NOT_FOUND");
        }
        jdbc.update("""
                INSERT INTO agency_saved_talents (id, agency_user_id, talent_user_id, group_name, memo)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT (agency_user_id, talent_user_id) DO UPDATE SET
                    group_name = COALESCE(EXCLUDED.group_name, agency_saved_talents.group_name),
                    memo = COALESCE(EXCLUDED.memo, agency_saved_talents.memo), updated_at = NOW()
                """, UUID.randomUUID(), agency, talentId, CastingRules.text(group, 40), CastingRules.text(memo, 1000));
        return find(agency, talentId);
    }

    @Transactional
    public SavedView update(UUID talentId, String group, String memo) {
        UUID agency = casting.requireApprovedAgency();
        int n = jdbc.update("""
                UPDATE agency_saved_talents SET group_name = ?, memo = ?, updated_at = NOW()
                WHERE agency_user_id = ? AND talent_user_id = ?
                """, CastingRules.text(group, 40), CastingRules.text(memo, 1000), agency, talentId);
        if (n == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "SAVED_TALENT_NOT_FOUND");
        }
        return find(agency, talentId);
    }

    public void remove(UUID talentId) {
        UUID agency = casting.requireApprovedAgency();
        jdbc.update("DELETE FROM agency_saved_talents WHERE agency_user_id = ? AND talent_user_id = ?", agency, talentId);
    }

    private SavedView find(UUID agency, UUID talentId) {
        return saved(null).stream().filter(s -> s.talent().userId().equals(talentId.toString())).findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "SAVED_TALENT_NOT_FOUND"));
    }

    // ───── 내부 ─────

    private List<Row> rows(UUID agency, List<UUID> only) {
        String sql = """
                SELECT u.id, u.nickname, u.name, COALESCE(NULLIF(trim(u.profile_image_url), ''), NULLIF(trim(c.profile_image_url), '')) AS img,
                       u.nationality, u.residence_country, u.birth_date, u.channel_categories, u.languages,
                       u.channel_shown_fields, u.short_bio, u.casting_offers_enabled, u.role, u.created_at, u.last_active_at,
                       u.country_code, u.gender,
                       COALESCE(c.subscriber_count, 0) AS subs,
                       (SELECT COUNT(*) FROM channel_careers cc WHERE cc.user_id = u.id AND cc.visible = TRUE) AS careers,
                       COALESCE(v.cnt, 0) AS cnt, v.last_at
                FROM users u
                LEFT JOIN channels c ON c.owner_id = u.id
                LEFT JOIN (
                    SELECT owner_id, COUNT(*) AS cnt, MAX(created_at) AS last_at FROM channel_videos
                    WHERE visibility = 'PUBLIC' AND COALESCE(moderation_hidden, FALSE) = FALSE GROUP BY owner_id
                ) v ON v.owner_id = u.id
                WHERE u.is_channel_public = TRUE
                  AND u.talent_search_visible = TRUE
                  AND u.role = 'APPLICANT'
                  AND COALESCE(u.account_status, 'ACTIVE') = 'ACTIVE'
                  AND COALESCE(u.channel_moderation_hidden, FALSE) = FALSE
                  AND NOT EXISTS (SELECT 1 FROM casting_agency_blocks b WHERE b.talent_user_id = u.id AND b.agency_user_id = ?)
                """;
        if (only != null) {
            if (only.isEmpty()) {
                return List.of();
            }
            return withPolicy(jdbc.query(sql + " AND u.id = ANY (?)", ps -> {
                ps.setObject(1, agency);
                ps.setArray(2, ps.getConnection().createArrayOf("uuid", only.toArray()));
            }, (rs, i) -> map(rs)));
        }
        return withPolicy(jdbc.query(sql, (rs, i) -> map(rs), agency));
    }

    /** 국가별 미성년자 정책 + 동의 상태로 검색 대상만 남긴다(서버 검증). */
    private List<Row> withPolicy(List<Row> raw) {
        if (raw.isEmpty()) {
            return raw;
        }
        List<UUID> ids = raw.stream().map(Row::id).toList();
        Set<UUID> guardian = minorPolicy.guardianConfirmedAmong(ids);
        Set<UUID> withdrawn = consents.withdrawnAmong(ids, ConsentService.PRIVACY_DISCLOSURE);
        Map<String, MinorPolicyService.Policy> policies = minorPolicy.byCountry();
        List<Row> out = new ArrayList<>();
        for (Row r : raw) {
            if (withdrawn.contains(r.id())) {
                continue;
            }
            MinorPolicyService.Status st = MinorPolicyService.evaluate(r.birthDate(),
                    MinorPolicyService.resolvePolicy(policies, MinorPolicyService.policyCountry(r.country(), r.residence(), r.nationality())),
                    guardian.contains(r.id()));
            if (!st.searchAllowed()) {
                continue;
            }
            out.add(r.withPolicy(st));
        }
        return out;
    }

    private List<TalentCard> cards(UUID agency, List<Row> page, LocalDate today) {
        if (page.isEmpty()) {
            return List.of();
        }
        List<UUID> ids = page.stream().map(Row::id).toList();
        Map<UUID, String[]> saved = new HashMap<>();
        Map<UUID, String> lastOffer = new HashMap<>();
        jdbc.query("SELECT talent_user_id, group_name FROM agency_saved_talents WHERE agency_user_id = ? AND talent_user_id = ANY (?)",
                ps -> {
                    ps.setObject(1, agency);
                    ps.setArray(2, ps.getConnection().createArrayOf("uuid", ids.toArray()));
                }, rs -> {
                    saved.put(rs.getObject(1, UUID.class), new String[]{rs.getString(2)});
                });
        jdbc.query("""
                SELECT DISTINCT ON (talent_user_id) talent_user_id, status FROM casting_offers
                WHERE agency_user_id = ? AND talent_user_id = ANY (?) ORDER BY talent_user_id, created_at DESC
                """, ps -> {
            ps.setObject(1, agency);
            ps.setArray(2, ps.getConnection().createArrayOf("uuid", ids.toArray()));
        }, rs -> {
            lastOffer.put(rs.getObject(1, UUID.class), rs.getString(2));
        });
        Map<UUID, PublicChannelDiscoveryService.Featured> feat = discovery.featured(ids);
        List<TalentCard> out = new ArrayList<>();
        for (Row r : page) {
            String[] s = saved.get(r.id());
            PublicChannelDiscoveryService.Featured fe = feat.get(r.id());
            out.add(new TalentCard(r.id().toString(), r.nickname(),
                    null, r.img(),
                    r.visible(ChannelShownFields.NATIONALITY) ? r.nationality() : null,
                    r.visible(ChannelShownFields.RESIDENCE) ? r.residence() : null,
                    r.visible(ChannelShownFields.AGE) ? ChannelPortfolioRules.ageBand(r.birthDate(), today) : null,
                    r.visible(ChannelShownFields.SPECIALTIES) ? ChannelPortfolioRules.mainField(r.categories()) : null,
                    r.visible(ChannelShownFields.SPECIALTIES) ? ChannelPortfolioRules.fieldCodes(r.categories()) : List.of(),
                    r.visible(ChannelShownFields.LANGUAGES) && r.languages() != null ? List.of(r.languages()) : List.of(),
                    r.visible(ChannelShownFields.SHORT_BIO) ? r.shortBio() : null,
                    r.careers(), r.videos(), r.followers(), r.activity(), accepts(r, today),
                    fe == null ? null : fe.thumbnailUrl(), s != null, s == null ? null : s[0], lastOffer.get(r.id()), true,
                    r.visible(ChannelShownFields.GENDER) ? r.gender() : null));
        }
        return out;
    }

    private TalentCard unavailable(UUID talent) {
        String nick = jdbc.query("SELECT nickname FROM users WHERE id = ?", (rs, i) -> rs.getString(1), talent)
                .stream().findFirst().orElse(null);
        return new TalentCard(talent.toString(), nick, null, null, null, null, null, null, List.of(), List.of(), null,
                0, 0, 0, null, false, null, true, null, null, false, null);
    }

    private boolean accepts(Row r, LocalDate today) {
        return r.casting() && r.policy() != null && r.policy().offersAllowed();
    }

    static boolean nameMatches(Row r, String needle) {
        // 실명은 검색 결과·검색어 매칭에 쓰지 않는다.
        return r.nickname() != null && r.nickname().toLowerCase(Locale.ROOT).contains(needle);
    }

    static boolean countryMatches(String value, String wanted) {
        if (value == null) {
            return false;
        }
        if ("OTHER".equals(wanted)) {
            return !NARROW.contains(value);
        }
        return wanted.equals(value);
    }

    static Comparator<Row> comparator(String sort) {
        String s = sort == null ? "RECENT_ACTIVITY" : sort.trim().toUpperCase(Locale.ROOT);
        Comparator<Row> byName = Comparator.comparing(r -> r.nickname() == null ? "" : r.nickname(), String.CASE_INSENSITIVE_ORDER);
        Comparator<Row> primary = switch (s) {
            case "NEWEST" -> Comparator.comparing(Row::created, Comparator.nullsLast(Comparator.reverseOrder()));
            case "FOLLOWERS" -> Comparator.comparingLong(Row::followers).reversed();
            default -> Comparator.comparing(Row::activity, Comparator.nullsLast(Comparator.reverseOrder()));
        };
        return primary.thenComparing(byName);
    }

    private static boolean contains(String[] arr, String v) {
        if (arr == null) {
            return false;
        }
        for (String a : arr) {
            if (v.equalsIgnoreCase(a)) {
                return true;
            }
        }
        return false;
    }

    private static String up(String s) {
        return s == null || s.isBlank() || "ALL".equalsIgnoreCase(s.trim()) ? null : s.trim().toUpperCase(Locale.ROOT);
    }

    private static Row map(ResultSet rs) throws SQLException {
        java.sql.Date bd = rs.getDate("birth_date");
        return new Row(rs.getObject("id", UUID.class), rs.getString("nickname"), rs.getString("name"), rs.getString("img"),
                rs.getString("nationality"), rs.getString("residence_country"), bd == null ? null : bd.toLocalDate(),
                arr(rs.getArray("channel_categories")), arr(rs.getArray("languages")),
                rs.getArray("channel_shown_fields") == null ? null : arr(rs.getArray("channel_shown_fields")),
                rs.getString("short_bio"), rs.getBoolean("casting_offers_enabled"), rs.getString("role"),
                rs.getInt("careers"), rs.getLong("cnt"), rs.getLong("subs"), ts(rs.getTimestamp("created_at")),
                ts(rs.getTimestamp("last_active_at")), ts(rs.getTimestamp("last_at")), rs.getString("country_code"),
                rs.getString("gender"), null);
    }

    private static String[] arr(Array a) throws SQLException {
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
