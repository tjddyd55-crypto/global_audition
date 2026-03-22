package com.audition.platform.domain.like;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ApplicationLikeRepository extends JpaRepository<ApplicationLike, UUID> {

    boolean existsByApplicationIdAndUserId(UUID applicationId, UUID userId);

    Optional<ApplicationLike> findByApplicationIdAndUserId(UUID applicationId, UUID userId);

    void deleteByApplicationIdAndUserId(UUID applicationId, UUID userId);
}
