package com.audition.platform.domain.repository;

import com.audition.platform.domain.entity.CreativeAsset;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 창작물 자산 Repository
 * 작업: GA_20260202_CREATIVE_REGISTRY_EXTENSION
 */
@Repository
public interface CreativeAssetRepository extends JpaRepository<CreativeAsset, Long> {
    
    Page<CreativeAsset> findByUserId(Long userId, Pageable pageable);
    
    Optional<CreativeAsset> findByIdAndUserId(Long id, Long userId);
    
    List<CreativeAsset> findByIdIn(List<Long> assetIds);
    
    Optional<CreativeAsset> findByContentHash(String contentHash);
    
    Page<CreativeAsset> findByUserIdAndAccessControl(Long userId, CreativeAsset.AccessControl accessControl, Pageable pageable);
}
