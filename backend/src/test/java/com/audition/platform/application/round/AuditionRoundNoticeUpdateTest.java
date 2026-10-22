package com.audition.platform.application.round;

import com.audition.platform.domain.audition.ApplicationRoundSubmissionRepository;
import com.audition.platform.domain.audition.AuditionRepository;
import com.audition.platform.domain.audition.AuditionRound;
import com.audition.platform.domain.audition.AuditionRoundRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuditionRoundNoticeUpdateTest {

    @Mock private AuditionRoundRepository rounds;
    @Mock private ApplicationRoundSubmissionRepository submissions;
    @Mock private AuditionRepository auditions;

    @Test
    void noticeTextUpdateLeavesScheduleStatusAndReviewUntouched() {
        UUID auditionId = UUID.randomUUID();
        UUID roundId = UUID.randomUUID();
        Instant start = Instant.parse("2026-01-01T00:00:00Z");
        Instant end = Instant.parse("2026-02-01T00:00:00Z");
        AuditionRound round = new AuditionRound();
        round.setId(roundId);
        round.setAuditionId(auditionId);
        round.setRoundName("1차");
        round.setActive(true);
        round.setLocked(false);
        round.setStartAt(start);
        round.setEndAt(end);
        round.setReviewMethod("INTERNAL_REVIEW");
        round.setRequiredSubmissionType("VIDEO");
        when(rounds.findById(roundId)).thenReturn(Optional.of(round));
        when(rounds.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        AuditionRound saved = new AuditionRoundService(rounds, submissions, auditions)
                .updateNotices(auditionId, roundId, "제목", "본문", "제출", "안내", "ko");

        assertEquals("제목", saved.getAnnouncementTitle());
        assertEquals("본문", saved.getAnnouncementBody());
        assertEquals("제출", saved.getSubmissionLabel());
        assertEquals("안내", saved.getSubmissionGuide());
        assertEquals("ko", saved.getNoticeSourceLocale());
        assertEquals("1차", saved.getRoundName());
        assertTrue(saved.isActive());
        assertEquals(start, saved.getStartAt());
        assertEquals(end, saved.getEndAt());
        assertEquals("INTERNAL_REVIEW", saved.getReviewMethod());
        assertEquals("VIDEO", saved.getRequiredSubmissionType());
        verify(auditions, org.mockito.Mockito.never()).save(any());
    }
}
