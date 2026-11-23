package com.audition.platform.application.recommend;

import com.audition.platform.application.AuditionService;
import com.audition.platform.domain.audition.RecruitFieldCodes;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * 규칙 기반 추천 점수. 외부 AI 없이 프로필·공고 필드만 비교한다.
 */
public final class RecommendationScoring {

    public static final int FIELD_MATCH = 40;
    public static final int COUNTRY_MATCH = 30;
    public static final int OPEN_BONUS = 15;
    public static final int CLOSING_SOON = 10;
    public static final int SAVED_AFFINITY = 8;
    public static final int APPLIED_PENALTY = -25;
    public static final int CLOSING_SOON_DAYS = 3;

    public static final String REASON_FIELD = "FIELD_MATCH";
    public static final String REASON_COUNTRY_RESIDENCE = "COUNTRY_RESIDENCE";
    public static final String REASON_COUNTRY_NATIONALITY = "COUNTRY_NATIONALITY";
    public static final String REASON_CLOSING_SOON = "CLOSING_SOON";
    public static final String REASON_SAVED_AFFINITY = "SAVED_AFFINITY";

    public record Profile(
            String nationality,
            String residenceCountry,
            Set<String> activityFields,
            Integer ageYears,
            Set<String> savedFields,
            Set<String> savedCountries,
            Set<String> appliedAuditionIds) {
    }

    public record Candidate(
            String id,
            String status,
            String countryCode,
            String hostCountry,
            String[] recruitFields,
            String[] qualifications,
            Instant deadlineAt,
            Instant endDate,
            Instant startDate,
            Instant createdAt,
            int applicantsCount) {
    }

    public record Scored(
            Candidate candidate,
            int score,
            List<String> reasons,
            AgeEligibility.Status eligibility) {
    }

    private RecommendationScoring() {
    }

    public static Instant dueAt(Candidate c) {
        if (c.endDate() != null) {
            return c.endDate();
        }
        return c.deadlineAt();
    }

    public static boolean isClosingSoon(Candidate c, Instant now) {
        if (!"OPEN".equals(c.status())) {
            return false;
        }
        Instant due = dueAt(c);
        if (due == null || now == null || due.isBefore(now)) {
            return false;
        }
        return !due.isAfter(now.plus(CLOSING_SOON_DAYS, ChronoUnit.DAYS));
    }

    public static boolean matchesUserCountry(String audience, String host, String nationality, String residence) {
        String target = AudienceCountryCodes.normalize(audience);
        String hostN = AudienceCountryCodes.normalize(host);
        if (AudienceCountryCodes.isGlobal(target) || (hostN != null && AudienceCountryCodes.isGlobal(hostN) && AudienceCountryCodes.isGlobal(target))) {
            return true;
        }
        String nat = AudienceCountryCodes.normalize(nationality);
        String res = AudienceCountryCodes.normalize(residence);
        return countryEquals(target, nat) || countryEquals(target, res)
                || countryEquals(hostN, nat) || countryEquals(hostN, res);
    }

    public static boolean countryEquals(String left, String right) {
        if (left == null || right == null || AudienceCountryCodes.isGlobal(left) || AudienceCountryCodes.isGlobal(right)) {
            return false;
        }
        return left.equals(right);
    }

    public static boolean fieldOverlap(String[] recruitFields, Set<String> wanted) {
        if (wanted == null || wanted.isEmpty() || recruitFields == null) {
            return false;
        }
        for (String value : recruitFields) {
            if (value == null || value.isBlank()) {
                continue;
            }
            String code = RecruitFieldCodes.normalize(value).toUpperCase(Locale.ROOT);
            if (wanted.contains(code)) {
                return true;
            }
        }
        return false;
    }

    public static Scored score(Candidate candidate, Profile profile, Instant now) {
        List<String> reasons = new ArrayList<>();
        int score = 0;
        AgeEligibility.Status eligibility = AgeEligibility.evaluate(candidate.qualifications(), profile == null ? null : profile.ageYears());

        if ("OPEN".equals(candidate.status())) {
            score += OPEN_BONUS;
        }
        if (isClosingSoon(candidate, now)) {
            score += CLOSING_SOON;
            reasons.add(REASON_CLOSING_SOON);
        }

        if (profile != null) {
            if (fieldOverlap(candidate.recruitFields(), profile.activityFields())) {
                score += FIELD_MATCH;
                reasons.add(REASON_FIELD);
            }
            String target = AudienceCountryCodes.normalize(candidate.countryCode());
            String host = AudienceCountryCodes.normalize(candidate.hostCountry());
            String res = AudienceCountryCodes.normalize(profile.residenceCountry());
            String nat = AudienceCountryCodes.normalize(profile.nationality());
            boolean resMatch = countryEquals(target, res) || countryEquals(host, res);
            boolean natMatch = countryEquals(target, nat) || countryEquals(host, nat);
            if (resMatch || natMatch) {
                score += COUNTRY_MATCH;
                if (resMatch) {
                    reasons.add(REASON_COUNTRY_RESIDENCE);
                } else {
                    reasons.add(REASON_COUNTRY_NATIONALITY);
                }
            }
            if (fieldOverlap(candidate.recruitFields(), profile.savedFields())
                    || countryInSaved(target, host, profile.savedCountries())) {
                score += SAVED_AFFINITY;
                reasons.add(REASON_SAVED_AFFINITY);
            }
            if (profile.appliedAuditionIds() != null && profile.appliedAuditionIds().contains(candidate.id())) {
                score += APPLIED_PENALTY;
            }
        }

        return new Scored(candidate, score, List.copyOf(reasons), eligibility);
    }

    private static boolean countryInSaved(String target, String host, Set<String> saved) {
        if (saved == null || saved.isEmpty()) {
            return false;
        }
        return (target != null && saved.contains(target)) || (host != null && saved.contains(host));
    }

    public static Comparator<Scored> order() {
        return Comparator.comparingInt(Scored::score).reversed()
                .thenComparing(s -> s.candidate().createdAt(), Comparator.nullsLast(Comparator.reverseOrder()));
    }

    public static boolean passesCountryFilter(Candidate candidate, String requestedCountry) {
        return AuditionService.matchesPublicCountry(candidate.countryCode(), candidate.hostCountry(), requestedCountry);
    }
}
