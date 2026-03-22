package com.audition.platform.domain.audition;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ApplicationRepository extends JpaRepository<Application, UUID> {

    List<Application> findByAuditionIdOrderByCreatedAtDesc(UUID auditionId);

    List<Application> findByAuditionIdAndStatusInOrderByCreatedAtDesc(UUID auditionId, Collection<String> statuses);

    Optional<Application> findByAuditionIdAndApplicantId(UUID auditionId, UUID applicantId);

    boolean existsByAuditionIdAndApplicantId(UUID auditionId, UUID applicantId);

    List<Application> findByApplicantIdOrderByCreatedAtDesc(UUID applicantId);

    long countByApplicantId(UUID applicantId);

    long countByApplicantIdAndStatus(UUID applicantId, String status);

    long countByStatusAndAuditionIdIn(String status, List<UUID> auditionIds);

    long countByAuditionIdIn(List<UUID> auditionIds);

    long countByAuditionId(UUID auditionId);

    List<Application> findTop10ByAuditionIdInOrderByCreatedAtDesc(List<UUID> auditionIds);

    List<Application> findTop10ByApplicantIdOrderByCreatedAtDesc(UUID applicantId);

    @Query("SELECT COALESCE(SUM(a.voteCount), 0) FROM Application a WHERE a.auditionId = :auditionId")
    long sumVoteCountByAuditionId(@Param("auditionId") UUID auditionId);

    /**
     * 투표 카운터 원자 조정. 감소 시 음수 방지(0행이면 실패).
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = "UPDATE applications SET vote_count = vote_count + :delta WHERE id = :id AND vote_count + :delta >= 0", nativeQuery = true)
    int adjustVoteCount(@Param("id") UUID id, @Param("delta") long delta);

    /** 영상 허브·추천 사이드바: 공개 가능한 지원만, 최신순 상한 */
    List<Application> findTop50ByStatusInOrderByCreatedAtDesc(Collection<String> statuses);
}
