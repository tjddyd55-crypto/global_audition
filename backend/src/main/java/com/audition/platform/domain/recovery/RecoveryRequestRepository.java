package com.audition.platform.domain.recovery;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface RecoveryRequestRepository extends JpaRepository<RecoveryRequest, UUID> {

    Page<RecoveryRequest> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);
}
