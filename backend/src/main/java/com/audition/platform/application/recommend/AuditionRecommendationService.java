package com.audition.platform.application.recommend;

import com.audition.platform.api.dto.AuditionResponse;
import com.audition.platform.api.dto.recommend.AuditionRecommendationResponse;
import com.audition.platform.api.dto.recommend.RecommendedAuditionItemResponse;
import com.audition.platform.application.AuditionService;
import com.audition.platform.domain.audition.Application;
import com.audition.platform.domain.audition.ApplicationRepository;
import com.audition.platform.domain.audition.RecruitFieldCodes;
import com.audition.platform.domain.user.User;
import com.audition.platform.domain.user.UserRepository;
import com.audition.platform.infra.SecurityUtils;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.Period;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 규칙 기반 맞춤 오디션 추천. 개인정보를 외부 AI로 보내지 않는다.
 */
@Service
public class AuditionRecommendationService {

    public static final int DEFAULT_LIMIT = 6;
    public static final int MAX_LIMIT = 20;

    private final AuditionService auditionService;
    private final UserRepository users;
    private final ApplicationRepository applications;
    private final JdbcTemplate jdbc;
    private final Clock clock;

    public AuditionRecommendationService(
            AuditionService auditionService,
            UserRepository users,
            ApplicationRepository applications,
            JdbcTemplate jdbc) {
        this(auditionService, users, applications, jdbc, Clock.systemUTC());
    }

    AuditionRecommendationService(
            AuditionService auditionService,
            UserRepository users,
            ApplicationRepository applications,
            JdbcTemplate jdbc,
            Clock clock) {
        this.auditionService = auditionService;
        this.users = users;
        this.applications = applications;
        this.jdbc = jdbc;
        this.clock = clock;
    }

    public AuditionRecommendationResponse recommend(String country, Integer limitRaw) {
        int limit = normalizeLimit(limitRaw);
        List<AuditionResponse> open = auditionService.listOpen(country);
        Instant now = clock.instant();
        UUID userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            return guestList(open, now, limit);
        }
        RecommendationScoring.Profile profile = loadProfile(userId);
        List<RecommendedAuditionItemResponse> personalized = scorePersonalized(open, profile, now, limit);
        if (!personalized.isEmpty()) {
            return pack(personalized, false, true);
        }
        AuditionRecommendationResponse fallback = guestList(open, now, limit);
        fallback.setFallback(true);
        fallback.setPersonalized(true);
        return fallback;
    }

    public List<AuditionResponse> closingSoon(String country, Integer limitRaw) {
        int limit = normalizeLimit(limitRaw);
        Instant now = clock.instant();
        List<AuditionResponse> open = auditionService.listOpen(country);
        return open.stream()
                .filter(row -> RecommendationScoring.isClosingSoon(candidate(row), now))
                .sorted((a, b) -> {
                    Instant da = RecommendationScoring.dueAt(candidate(a));
                    Instant db = RecommendationScoring.dueAt(candidate(b));
                    if (da == null && db == null) return 0;
                    if (da == null) return 1;
                    if (db == null) return -1;
                    return da.compareTo(db);
                })
                .limit(limit)
                .toList();
    }

    private List<RecommendedAuditionItemResponse> scorePersonalized(
            List<AuditionResponse> open,
            RecommendationScoring.Profile profile,
            Instant now,
            int limit) {
        List<RecommendationScoring.Scored> scored = new ArrayList<>();
        for (AuditionResponse row : open) {
            RecommendationScoring.Scored item = RecommendationScoring.score(candidate(row), profile, now);
            if (item.eligibility() == AgeEligibility.Status.INELIGIBLE) {
                continue;
            }
            scored.add(item);
        }
        scored.sort(RecommendationScoring.order());
        List<RecommendedAuditionItemResponse> out = new ArrayList<>();
        for (RecommendationScoring.Scored item : scored) {
            if (out.size() >= limit) {
                break;
            }
            AuditionResponse row = find(open, item.candidate().id());
            if (row != null) {
                out.add(toItem(row, item));
            }
        }
        return out;
    }

    private AuditionRecommendationResponse guestList(List<AuditionResponse> open, Instant now, int limit) {
        List<RecommendedAuditionItemResponse> items = open.stream()
                .map(row -> {
                    RecommendationScoring.Candidate c = candidate(row);
                    int score = RecommendationScoring.OPEN_BONUS
                            + (RecommendationScoring.isClosingSoon(c, now) ? RecommendationScoring.CLOSING_SOON : 0)
                            + Math.min(20, Math.max(0, c.applicantsCount()));
                    RecommendationScoring.Scored scored = new RecommendationScoring.Scored(
                            c, score,
                            RecommendationScoring.isClosingSoon(c, now)
                                    ? List.of(RecommendationScoring.REASON_CLOSING_SOON)
                                    : List.of(),
                            AgeEligibility.Status.UNKNOWN);
                    return toItem(row, scored);
                })
                .sorted((a, b) -> Integer.compare(b.getScore(), a.getScore()))
                .limit(limit)
                .toList();
        return pack(items, false, false);
    }

    private RecommendationScoring.Profile loadProfile(UUID userId) {
        User user = users.findById(userId).orElse(null);
        Set<String> fields = new HashSet<>();
        String nationality = null;
        String residence = null;
        Integer age = null;
        if (user != null) {
            nationality = user.getNationality();
            residence = user.getResidenceCountry() != null ? user.getResidenceCountry() : user.getCountryCode();
            for (String field : user.getActivityFields()) {
                if (field != null && !field.isBlank()) {
                    fields.add(RecruitFieldCodes.normalize(field).toUpperCase(Locale.ROOT));
                }
            }
            if (user.getBirthDate() != null) {
                age = Period.between(user.getBirthDate(), LocalDate.now(clock)).getYears();
            }
        }
        Set<String> savedFields = new HashSet<>();
        Set<String> savedCountries = new HashSet<>();
        jdbc.query("""
                SELECT a.recruit_fields, a.country_code, a.host_country
                FROM audition_saves s
                JOIN auditions a ON a.id = s.audition_id
                WHERE s.user_id = ? AND a.status IN ('OPEN', 'CLOSED')
                """, (rs, i) -> {
            java.sql.Array arr = rs.getArray("recruit_fields");
            if (arr != null && arr.getArray() instanceof String[] values) {
                for (String field : values) {
                    if (field != null && !field.isBlank()) {
                        savedFields.add(RecruitFieldCodes.normalize(field).toUpperCase(Locale.ROOT));
                    }
                }
            }
            String country = AudienceCountryCodes.normalize(rs.getString("country_code"));
            String host = AudienceCountryCodes.normalize(rs.getString("host_country"));
            if (country != null && !AudienceCountryCodes.isGlobal(country)) {
                savedCountries.add(country);
            }
            if (host != null && !AudienceCountryCodes.isGlobal(host)) {
                savedCountries.add(host);
            }
            return null;
        }, userId);
        Set<String> applied = applications.findByApplicantIdOrderByCreatedAtDesc(userId).stream()
                .map(Application::getAuditionId)
                .filter(id -> id != null)
                .map(UUID::toString)
                .collect(Collectors.toSet());
        return new RecommendationScoring.Profile(nationality, residence, fields, age, savedFields, savedCountries, applied);
    }

    private RecommendationScoring.Candidate candidate(AuditionResponse row) {
        return new RecommendationScoring.Candidate(
                row.getId() == null ? "" : row.getId().toString(),
                row.getStatus(),
                row.getCountryCode(),
                row.getHostCountry(),
                row.getRecruitFields(),
                row.getQualifications(),
                row.getDeadlineAt(),
                row.getEndDate(),
                row.getStartDate(),
                row.getCreatedAt(),
                row.getApplicantsCount());
    }

    private static RecommendedAuditionItemResponse toItem(AuditionResponse row, RecommendationScoring.Scored scored) {
        RecommendedAuditionItemResponse item = new RecommendedAuditionItemResponse();
        item.setAudition(row);
        item.setReasons(scored.reasons());
        item.setEligibility(scored.eligibility().name());
        item.setScore(scored.score());
        return item;
    }

    private static AuditionResponse find(List<AuditionResponse> rows, String id) {
        for (AuditionResponse row : rows) {
            if (row.getId() != null && row.getId().toString().equals(id)) {
                return row;
            }
        }
        return null;
    }

    private static AuditionRecommendationResponse pack(
            List<RecommendedAuditionItemResponse> items, boolean fallback, boolean personalized) {
        AuditionRecommendationResponse body = new AuditionRecommendationResponse();
        body.setItems(items);
        body.setFallback(fallback);
        body.setPersonalized(personalized);
        return body;
    }

    static int normalizeLimit(Integer limit) {
        if (limit == null || limit < 1) {
            return DEFAULT_LIMIT;
        }
        return Math.min(limit, MAX_LIMIT);
    }
}
