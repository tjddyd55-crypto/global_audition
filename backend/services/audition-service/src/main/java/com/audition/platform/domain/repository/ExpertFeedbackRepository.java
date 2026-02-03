package com.audition.platform.domain.repository;

import com.audition.platform.domain.entity.ExpertFeedback;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 전문가 평가 Repository
 * 작업: GA_20260202_CREATIVE_REGISTRY_EXTENSION
 */
@Repository
public interface ExpertFeedbackRepository extends JpaRepository<ExpertFeedback, Long> {
    
    Page<ExpertFeedback> findByAssetId(Long assetId, Pageable pageable);
    
    List<ExpertFeedback> findByAssetId(Long assetId);
    
    Page<ExpertFeedback> findByEvaluatorId(Long evaluatorId, Pageable pageable);
}
