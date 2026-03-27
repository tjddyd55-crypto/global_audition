package com.audition.platform.domain.audition;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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
}
