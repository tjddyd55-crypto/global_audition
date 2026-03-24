package com.audition.platform.domain.audition;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ApplicationRoundSubmissionRepository extends JpaRepository<ApplicationRoundSubmission, UUID> {

    List<ApplicationRoundSubmission> findByApplicationIdOrderByRoundNumberAsc(UUID applicationId);

    Optional<ApplicationRoundSubmission> findByApplicationIdAndRoundId(UUID applicationId, UUID roundId);

    List<ApplicationRoundSubmission> findByRoundId(UUID roundId);

    boolean existsByRoundId(UUID roundId);

    @Query("SELECT CASE WHEN COUNT(s) > 0 THEN true ELSE false END FROM ApplicationRoundSubmission s "
            + "WHERE s.roundId = :roundId AND (s.submissionStatus <> 'NOT_SUBMITTED' OR s.submittedAt IS NOT NULL)")
    boolean existsNonTrivialActivityForRound(@Param("roundId") UUID roundId);

    long countByRoundId(UUID roundId);

    long countByRoundIdAndSubmissionStatus(UUID roundId, String submissionStatus);

    /**
     * 라운드 단위 공개 투표 — submission.vote_count 원자 조정.
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = "UPDATE application_round_submissions SET vote_count = vote_count + :delta "
            + "WHERE id = :id AND vote_count + :delta >= 0", nativeQuery = true)
    int adjustVoteCount(@Param("id") UUID id, @Param("delta") long delta);
}
