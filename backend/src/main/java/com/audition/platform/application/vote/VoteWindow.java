package com.audition.platform.application.vote;

import com.audition.platform.domain.audition.Audition;

import java.time.Instant;

/**
 * 공개 투표 구간은 서버 시각으로만 판정한다. 기획사가 시작을 누르기 전에는 목록에 나오지 않는다.
 */
public final class VoteWindow {

    public enum Phase {
        /** 아직 투표 시작을 누르지 않았거나 일정이 없다. */
        NOT_STARTED,
        /** 시작은 확정됐으나 시작 시각 전. */
        SCHEDULED,
        /** 시작 시각 이상, 종료 시각 미만. */
        OPEN,
        /** 종료 시각 이후. */
        CLOSED
    }

    private VoteWindow() {
    }

    public static Phase phase(Audition audition, Instant now) {
        if (audition == null) {
            return Phase.NOT_STARTED;
        }
        return phase(audition.getVoteStartedAt(), audition.getVoteStartAt(), audition.getVoteEndAt(), now);
    }

    public static Phase phase(Instant startedAt, Instant startAt, Instant endAt, Instant now) {
        if (startedAt == null || startAt == null || endAt == null || now == null) {
            return Phase.NOT_STARTED;
        }
        if (now.isBefore(startAt)) {
            return Phase.SCHEDULED;
        }
        if (!now.isBefore(endAt)) {
            return Phase.CLOSED;
        }
        return Phase.OPEN;
    }

    public static boolean isOpen(Audition audition, Instant now) {
        return phase(audition, now) == Phase.OPEN;
    }

    public static boolean hasStarted(Phase phase) {
        return phase == Phase.SCHEDULED || phase == Phase.OPEN || phase == Phase.CLOSED;
    }
}
