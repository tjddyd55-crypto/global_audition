package com.audition.platform.domain.audition;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AuditionRoundResultLogRepository extends JpaRepository<AuditionRoundResultLog, UUID> {

    List<AuditionRoundResultLog> findByApplicationIdOrderByCreatedAtAsc(UUID applicationId);
}
