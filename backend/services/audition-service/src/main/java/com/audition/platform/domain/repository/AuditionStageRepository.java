package com.audition.platform.domain.repository;

import com.audition.platform.domain.entity.AuditionStage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AuditionStageRepository extends JpaRepository<AuditionStage, Long> {
    long countByAuditionId(Long auditionId);

    boolean existsByAuditionIdAndStageNumber(Long auditionId, Integer stageNumber);

    List<AuditionStage> findByAuditionIdOrderByStageNumberAsc(Long auditionId);
}

