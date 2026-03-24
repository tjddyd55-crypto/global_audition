package com.audition.platform.domain.vote;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface VoteRepository extends JpaRepository<Vote, UUID> {

    Optional<Vote> findByAuditionIdAndUserId(UUID auditionId, UUID userId);

    Optional<Vote> findByUserIdAndApplicationId(UUID userId, UUID applicationId);

    void deleteByAuditionIdAndUserId(UUID auditionId, UUID userId);

    /** 라운드 단위 투표 (round_id NOT NULL) */
    Optional<Vote> findByRoundIdAndUserId(UUID roundId, UUID userId);

    List<Vote> findByRoundId(UUID roundId);

    long countByApplicationRoundSubmissionId(UUID applicationRoundSubmissionId);
}
