package com.audition.platform.domain.vote;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AuditionVoteCandidateRepository extends JpaRepository<AuditionVoteCandidate, AuditionVoteCandidate.PK> {

    List<AuditionVoteCandidate> findByAuditionIdAndRoundNumber(UUID auditionId, int roundNumber);

    long countByAuditionIdAndRoundNumber(UUID auditionId, int roundNumber);

    boolean existsByAuditionIdAndRoundNumberAndApplicationId(UUID auditionId, int roundNumber, UUID applicationId);

    void deleteByAuditionIdAndRoundNumber(UUID auditionId, int roundNumber);
}
