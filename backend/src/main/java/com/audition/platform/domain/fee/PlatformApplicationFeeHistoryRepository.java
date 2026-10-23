package com.audition.platform.domain.fee;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PlatformApplicationFeeHistoryRepository extends JpaRepository<PlatformApplicationFeeHistory, UUID> {

    List<PlatformApplicationFeeHistory> findTop20ByOrderByChangedAtDesc();
}
