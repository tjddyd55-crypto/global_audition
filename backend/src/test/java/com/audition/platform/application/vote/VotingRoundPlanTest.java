package com.audition.platform.application.vote;

import com.audition.platform.domain.audition.Audition;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class VotingRoundPlanTest {

    @Test
    void nullPlanKeepsLegacyBehaviourForEveryRound() {
        assertTrue(VotingRoundPlan.enabledFor(null, 1));
        assertTrue(VotingRoundPlan.enabledFor(null, 7));
    }

    @Test
    void emptyPlanMeansNoVoting() {
        assertFalse(VotingRoundPlan.enabledFor(new Integer[0], 1));
    }

    @Test
    void onlyFinalRound() {
        Integer[] plan = {3};
        assertFalse(VotingRoundPlan.enabledFor(plan, 1));
        assertFalse(VotingRoundPlan.enabledFor(plan, 2));
        assertTrue(VotingRoundPlan.enabledFor(plan, 3));
    }

    @Test
    void normalizeSortsDedupesAndDefaultsCount() {
        VotingRoundPlan.Normalized n = VotingRoundPlan.normalize(3, Arrays.asList(3, 1, 3, null));
        assertEquals(3, n.count());
        assertArrayEquals(new Integer[] {1, 3}, n.rounds());
        assertEquals(2, VotingRoundPlan.normalize(null, List.of(2)).count());
        assertEquals(1, VotingRoundPlan.normalize(null, List.of()).count());
        assertArrayEquals(new Integer[0], VotingRoundPlan.normalize(4, List.of()).rounds());
    }

    @Test
    void normalizeRejectsOutOfRange() {
        assertThrows(ResponseStatusException.class, () -> VotingRoundPlan.normalize(2, List.of(3)));
        assertThrows(ResponseStatusException.class, () -> VotingRoundPlan.normalize(11, List.of()));
        assertThrows(ResponseStatusException.class, () -> VotingRoundPlan.normalize(3, List.of(0)));
    }

    @Test
    void activeRoundUsesCurrentRoundForMultiRoundAndSeriesOtherwise() {
        Audition multi = new Audition();
        multi.setProcessMode("MULTI_ROUND");
        multi.setCurrentRoundNumber(2);
        multi.setSeriesRound(1);
        assertEquals(2, VotingRoundPlan.activeRound(multi));
        multi.setVotingRounds(new Integer[] {3});
        assertFalse(VotingRoundPlan.enabledNow(multi));
        multi.setCurrentRoundNumber(3);
        assertTrue(VotingRoundPlan.enabledNow(multi));

        Audition series = new Audition();
        series.setProcessMode("SINGLE");
        series.setSeriesRound(2);
        assertEquals(2, VotingRoundPlan.activeRound(series));
        assertTrue(VotingRoundPlan.enabledNow(series));
    }

    @Test
    void roundApiWritesThroughToPlan() {
        Audition legacy = new Audition();
        assertFalse(VotingRoundPlan.setRoundEnabled(legacy, 2, true, 3), "NULL(모든 회차)에 켜기는 변화 없음");
        assertTrue(VotingRoundPlan.setRoundEnabled(legacy, 2, false, 3));
        assertArrayEquals(new Integer[] {1, 3}, legacy.getVotingRounds());
        assertEquals(3, legacy.getVotingRoundCount());

        Audition a = new Audition();
        a.setVotingRoundCount(2);
        a.setVotingRounds(new Integer[] {2});
        assertTrue(VotingRoundPlan.setRoundEnabled(a, 4, true, 4));
        assertArrayEquals(new Integer[] {2, 4}, a.getVotingRounds());
        assertEquals(4, a.getVotingRoundCount());
        assertTrue(VotingRoundPlan.setRoundEnabled(a, 2, false, 4));
        assertArrayEquals(new Integer[] {4}, a.getVotingRounds());
    }

    @Test
    void reviewMethodIsDerivedFromPlan() {
        assertEquals("PUBLIC_VOTE", VotingRoundPlan.effectiveReviewMethod("INTERNAL_REVIEW", true));
        assertEquals("INTERNAL_REVIEW", VotingRoundPlan.effectiveReviewMethod("PUBLIC_VOTE", false));
        assertEquals("FINAL_SELECTION", VotingRoundPlan.effectiveReviewMethod("FINAL_SELECTION", true));
    }
}
