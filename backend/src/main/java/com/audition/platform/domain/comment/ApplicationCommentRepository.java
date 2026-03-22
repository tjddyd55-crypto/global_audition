package com.audition.platform.domain.comment;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ApplicationCommentRepository extends JpaRepository<ApplicationComment, UUID> {

    List<ApplicationComment> findByApplicationIdOrderByCreatedAtAsc(UUID applicationId);
}
