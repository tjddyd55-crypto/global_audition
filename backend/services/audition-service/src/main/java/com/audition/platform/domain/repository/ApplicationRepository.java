package com.audition.platform.domain.repository;

import com.audition.platform.domain.entity.Application;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {

    long countByStatus(Application.ApplicationStatus status);

    long countByFinalResult(Application.ScreeningResult result);

    Optional<Application> findByUserIdAndAuditionId(Long userId, Long auditionId);

    Page<Application> findByAuditionId(Long auditionId, Pageable pageable);

    Page<Application> findByUserId(Long userId, Pageable pageable);

    @Query("SELECT a FROM Application a WHERE a.audition.id = :auditionId AND a.result1 = :result")
    List<Application> findByAuditionIdAndResult1(
            @Param("auditionId") Long auditionId,
            @Param("result") Application.ScreeningResult result
    );

    @Query("SELECT a FROM Application a WHERE a.audition.id = :auditionId AND a.result1 = :result1 AND a.result2 = :result2")
    List<Application> findByAuditionIdAndResult1AndResult2(
            @Param("auditionId") Long auditionId,
            @Param("result1") Application.ScreeningResult result1,
            @Param("result2") Application.ScreeningResult result2
    );

    @Query("SELECT a FROM Application a WHERE a.audition.id = :auditionId AND a.result1 = :result1 AND a.result2 = :result2 AND a.result3 = :result3")
    List<Application> findByAuditionIdAndAllResults(
            @Param("auditionId") Long auditionId,
            @Param("result1") Application.ScreeningResult result1,
            @Param("result2") Application.ScreeningResult result2,
            @Param("result3") Application.ScreeningResult result3
    );

    @Query("SELECT a FROM Application a WHERE a.audition.id = :auditionId AND a.finalResult = :result")
    List<Application> findByAuditionIdAndFinalResult(
            @Param("auditionId") Long auditionId,
            @Param("result") Application.ScreeningResult result
    );

    Page<Application> findByAuditionIdAndCurrentStage(Long auditionId, Integer currentStage, Pageable pageable);

    Page<Application> findByAuditionIdAndStatus(Long auditionId, Application.ApplicationStatus status, Pageable pageable);

    @Query("SELECT COUNT(DISTINCT a.userId) FROM Application a WHERE a.audition.id IN :auditionIds")
    long countDistinctUsersByAuditionIds(@Param("auditionIds") List<Long> auditionIds);

    @Query("SELECT a.currentStage, COUNT(a) FROM Application a WHERE a.audition.id = :auditionId GROUP BY a.currentStage")
    List<Object[]> countByAuditionIdGroupByCurrentStage(@Param("auditionId") Long auditionId);

    // 작업: 2026_15_recommendation_ranking
    long countByAuditionId(Long auditionId);

    @Query(value = "SELECT user_id, COUNT(*) as cnt FROM applications WHERE final_result = 'PASS' GROUP BY user_id ORDER BY cnt DESC LIMIT :limit", nativeQuery = true)
    List<Object[]> findTopApplicantsByFinalPass(@Param("limit") int limit);

    @Query(value = "SELECT user_id, COUNT(*) as cnt FROM applications GROUP BY user_id ORDER BY cnt DESC LIMIT :limit", nativeQuery = true)
    List<Object[]> findTopApplicantsByApplicationCount(@Param("limit") int limit);
}
