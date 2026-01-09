package com.audition.platform.domain.repository;

import com.audition.platform.domain.entity.AuditionOffer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AuditionOfferRepository extends JpaRepository<AuditionOffer, Long> {

    Page<AuditionOffer> findByUserId(Long userId, Pageable pageable);

    Page<AuditionOffer> findByBusinessId(Long businessId, Pageable pageable);

    @Query("SELECT o FROM AuditionOffer o WHERE o.businessId = :businessId AND o.videoContentId = :videoContentId")
    Optional<AuditionOffer> findByBusinessIdAndVideoContentId(
            @Param("businessId") Long businessId,
            @Param("videoContentId") Long videoContentId
    );

    @Query("SELECT COUNT(o) FROM AuditionOffer o WHERE o.userId = :userId AND o.status = 'PENDING'")
    Long countPendingByUserId(@Param("userId") Long userId);
}
