package com.audition.platform.domain.audition;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AuditionRoundNotificationRepository extends JpaRepository<AuditionRoundNotification, UUID> {

    List<AuditionRoundNotification> findByAuditionIdAndRoundIdOrderByCreatedAtDesc(UUID auditionId, UUID roundId);
}
