package com.audition.platform.application.recommend;

import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RecommendationScoringTest {

    private static final Instant NOW = Instant.parse("2026-11-23T00:00:00Z");

    @Test
    void fieldAndResidenceOutrankAppliedPosting() {
        RecommendationScoring.Profile profile = new RecommendationScoring.Profile(
                "MN", "KR", Set.of("VOCAL"), 22, Set.of(), Set.of(), Set.of("applied"));
        RecommendationScoring.Scored vocalKr = RecommendationScoring.score(candidate(
                "a", "OPEN", "KR", "KR", new String[] {"VOCAL"}, new String[] {}, dueDays(10), 1), profile, NOW);
        RecommendationScoring.Scored applied = RecommendationScoring.score(candidate(
                "applied", "OPEN", "KR", "KR", new String[] {"VOCAL"}, new String[] {}, dueDays(10), 1), profile, NOW);
        assertTrue(vocalKr.reasons().contains(RecommendationScoring.REASON_FIELD));
        assertTrue(vocalKr.reasons().contains(RecommendationScoring.REASON_COUNTRY_RESIDENCE));
        assertTrue(vocalKr.score() > applied.score());
        assertEquals(RecommendationScoring.APPLIED_PENALTY, applied.score() - vocalKr.score());
    }

    @Test
    void globalPostingIsIncludedWithoutAutomaticCountryBonus() {
        RecommendationScoring.Profile profile = new RecommendationScoring.Profile(
                "KR", "KR", Set.of("DANCE"), 20, Set.of(), Set.of(), Set.of());
        RecommendationScoring.Scored global = RecommendationScoring.score(candidate(
                "g", "OPEN", "GLOBAL", null, new String[] {"DANCE"}, new String[] {}, dueDays(10), 0), profile, NOW);
        assertTrue(global.reasons().contains(RecommendationScoring.REASON_FIELD));
        assertFalse(global.reasons().contains(RecommendationScoring.REASON_COUNTRY_RESIDENCE));
        assertTrue(RecommendationScoring.passesCountryFilter(global.candidate(), "KR"));
    }

    @Test
    void languageCodeIsNotACountryMatch() {
        RecommendationScoring.Profile profile = new RecommendationScoring.Profile(
                "ko", "en", Set.of("VOCAL"), 20, Set.of(), Set.of(), Set.of());
        RecommendationScoring.Scored row = RecommendationScoring.score(candidate(
                "x", "OPEN", "KR", "KR", new String[] {"VOCAL"}, new String[] {}, dueDays(10), 0), profile, NOW);
        assertFalse(row.reasons().contains(RecommendationScoring.REASON_COUNTRY_RESIDENCE));
        assertFalse(row.reasons().contains(RecommendationScoring.REASON_COUNTRY_NATIONALITY));
    }

    @Test
    void closingSoonOnlyForOpenFutureDeadlinesWithinThreeDays() {
        RecommendationScoring.Candidate soon = candidate("s", "OPEN", "KR", "KR", new String[] {}, new String[] {}, dueDays(2), 0);
        RecommendationScoring.Candidate later = candidate("l", "OPEN", "KR", "KR", new String[] {}, new String[] {}, dueDays(10), 0);
        RecommendationScoring.Candidate closed = candidate("c", "CLOSED", "KR", "KR", new String[] {}, new String[] {}, dueDays(1), 0);
        RecommendationScoring.Candidate past = candidate("p", "OPEN", "KR", "KR", new String[] {}, new String[] {}, dueDays(-1), 0);
        assertTrue(RecommendationScoring.isClosingSoon(soon, NOW));
        assertFalse(RecommendationScoring.isClosingSoon(later, NOW));
        assertFalse(RecommendationScoring.isClosingSoon(closed, NOW));
        assertFalse(RecommendationScoring.isClosingSoon(past, NOW));
    }

    @Test
    void unparsableAgeDoesNotClaimEligible() {
        RecommendationScoring.Profile profile = new RecommendationScoring.Profile(
                "KR", "KR", Set.of(), 16, Set.of(), Set.of(), Set.of());
        RecommendationScoring.Scored unknown = RecommendationScoring.score(candidate(
                "u", "OPEN", "KR", "KR", new String[] {}, new String[] {"청소년 우대"}, dueDays(8), 0), profile, NOW);
        assertEquals(AgeEligibility.Status.UNKNOWN, unknown.eligibility());
    }

    private static Instant dueDays(int days) {
        return NOW.plusSeconds(days * 86400L);
    }

    private static RecommendationScoring.Candidate candidate(
            String id, String status, String country, String host, String[] fields, String[] quals, Instant due, int applicants) {
        return new RecommendationScoring.Candidate(
                id, status, country, host, fields, quals, due, due, null, NOW.minusSeconds(1000), applicants);
    }
}
