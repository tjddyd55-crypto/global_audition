package com.audition.platform.domain.audition;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface AuditionRepository extends JpaRepository<Audition, UUID> {

    List<Audition> findAllByOrderByCreatedAtDesc();

    List<Audition> findByStatusOrderByCreatedAtDesc(String status);

    List<Audition> findByOwnerIdOrderByCreatedAtDesc(UUID ownerId);

    long countByOwnerId(UUID ownerId);

    long countByOwnerIdAndStatus(UUID ownerId, String status);

    @Query("SELECT COALESCE(MAX(a.seriesRound), 0) FROM Audition a WHERE a.groupId = :groupId")
    int findMaxSeriesRoundByGroupId(@Param("groupId") UUID groupId);

    @Query("""
            SELECT a FROM Audition a
            WHERE a.voteStartedAt IS NOT NULL
              AND a.voteStartAt IS NOT NULL
              AND a.voteEndAt IS NOT NULL
              AND a.voteStartAt <= :now
              AND a.voteEndAt > :now
              AND a.status IN ('OPEN', 'CLOSED')
            ORDER BY a.voteEndAt ASC
            """)
    List<Audition> findOpenPublicVotes(@Param("now") Instant now);
}
