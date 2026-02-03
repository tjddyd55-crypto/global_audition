package com.audition.platform.domain.repository;

import com.audition.platform.domain.entity.ApplicantProfile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ApplicantProfileRepository extends JpaRepository<ApplicantProfile, Long> {

    Optional<ApplicantProfile> findByUserId(Long userId);

    @Query("""
            SELECT p
            FROM ApplicantProfile p
            WHERE (p.channelVisibility = :visibility OR p.channelVisibility IS NULL)
              AND (:country IS NULL OR p.country = :country)
              AND (:keyword IS NULL OR LOWER(p.stageName) LIKE LOWER(CONCAT('%', :keyword, '%'))
                               OR LOWER(p.bio) LIKE LOWER(CONCAT('%', :keyword, '%')))
            """)
    Page<ApplicantProfile> searchPublicProfiles(
            @Param("visibility") ApplicantProfile.ChannelVisibility visibility,
            @Param("country") String country,
            @Param("keyword") String keyword,
            Pageable pageable
    );

    // 작업: 2026_18_portfolio_builder
    Optional<ApplicantProfile> findByPortfolioSlug(String portfolioSlug);
    boolean existsByPortfolioSlug(String portfolioSlug);
}
