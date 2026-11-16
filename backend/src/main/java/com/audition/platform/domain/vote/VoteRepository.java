package com.audition.platform.domain.vote;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface VoteRepository extends JpaRepository<Vote, UUID> {

    /** 회차 단위 내 표 (사용자는 오디션·회차마다 1표). */
    Optional<Vote> findByAuditionIdAndUserIdAndRoundNumber(UUID auditionId, UUID userId, Integer roundNumber);

    long countByAuditionIdAndRoundNumber(UUID auditionId, Integer roundNumber);

    long countByAuditionId(UUID auditionId);

    /** [applicationId, count] — 해당 회차 득표 집계. */
    @Query("select v.applicationId, count(v) from Vote v "
            + "where v.auditionId = :auditionId and v.roundNumber = :roundNumber group by v.applicationId")
    List<Object[]> countByApplicationForRound(
            @Param("auditionId") UUID auditionId, @Param("roundNumber") Integer roundNumber);
}
