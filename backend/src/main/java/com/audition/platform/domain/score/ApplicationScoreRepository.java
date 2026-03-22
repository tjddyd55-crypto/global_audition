package com.audition.platform.domain.score;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ApplicationScoreRepository extends JpaRepository<ApplicationScore, UUID> {

    long countByAuditionId(UUID auditionId);

    List<ApplicationScore> findByAuditionId(UUID auditionId);

    List<ApplicationScore> findByAuditionIdIn(Collection<UUID> auditionIds);

    Optional<ApplicationScore> findByApplicationId(UUID applicationId);
}
