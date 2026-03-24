package com.audition.platform.domain.audition;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AuditionRoundRepository extends JpaRepository<AuditionRound, UUID> {

    List<AuditionRound> findByAuditionIdOrderByRoundNumberAsc(UUID auditionId);

    Optional<AuditionRound> findByAuditionIdAndRoundNumber(UUID auditionId, int roundNumber);

    List<AuditionRound> findByAuditionIdAndActiveTrue(UUID auditionId);
}
