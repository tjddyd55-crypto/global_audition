package com.audition.platform.domain.audition;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ApplicationVideoRepository extends JpaRepository<ApplicationVideo, UUID> {

    List<ApplicationVideo> findByApplicationIdOrderByCreatedAtDesc(UUID applicationId);

    Optional<ApplicationVideo> findFirstByApplicationIdOrderByCreatedAtAsc(UUID applicationId);

    /** 대표 영상 MVP: 가장 최근 업로드 1건 */
    Optional<ApplicationVideo> findFirstByApplicationIdOrderByCreatedAtDesc(UUID applicationId);

    Optional<ApplicationVideo> findByIdAndApplicationId(UUID id, UUID applicationId);
}
