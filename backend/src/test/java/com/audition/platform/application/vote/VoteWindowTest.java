package com.audition.platform.application.vote;

import com.audition.platform.domain.audition.Audition;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class VoteWindowTest {

    private static final Instant T0 = Instant.parse("2026-11-23T00:00:00Z");
    private static final Instant START = Instant.parse("2026-11-23T10:00:00Z");
    private static final Instant END = Instant.parse("2026-11-23T12:00:00Z");

    @Test
    void notStartedWhenOwnerHasNotConfirmed() {
        assertEquals(VoteWindow.Phase.NOT_STARTED, VoteWindow.phase(null, START, END, T0));
        Audition a = new Audition();
        a.setVoteStartAt(START);
        a.setVoteEndAt(END);
        assertEquals(VoteWindow.Phase.NOT_STARTED, VoteWindow.phase(a, START));
    }

    @Test
    void scheduledOpenClosedByServerInstant() {
        Instant started = Instant.parse("2026-11-22T00:00:00Z");
        assertEquals(VoteWindow.Phase.SCHEDULED, VoteWindow.phase(started, START, END, Instant.parse("2026-11-23T09:59:59Z")));
        assertEquals(VoteWindow.Phase.OPEN, VoteWindow.phase(started, START, END, START));
        assertEquals(VoteWindow.Phase.OPEN, VoteWindow.phase(started, START, END, Instant.parse("2026-11-23T11:59:59Z")));
        assertEquals(VoteWindow.Phase.CLOSED, VoteWindow.phase(started, START, END, END));
        assertEquals(VoteWindow.Phase.CLOSED, VoteWindow.phase(started, START, END, Instant.parse("2026-11-23T12:00:00.001Z")));
    }

    @Test
    void hasStartedIncludesScheduled() {
        assertFalse(VoteWindow.hasStarted(VoteWindow.Phase.NOT_STARTED));
        assertTrue(VoteWindow.hasStarted(VoteWindow.Phase.SCHEDULED));
        assertTrue(VoteWindow.hasStarted(VoteWindow.Phase.OPEN));
        assertTrue(VoteWindow.hasStarted(VoteWindow.Phase.CLOSED));
    }
}
