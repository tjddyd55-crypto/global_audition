package com.audition.platform.domain.repository;

import com.audition.platform.domain.entity.FeedbackSession;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FeedbackSessionRepository extends JpaRepository<FeedbackSession, Long> {
    Page<FeedbackSession> findByApplicantId(Long applicantId, Pageable pageable);

    Page<FeedbackSession> findByInstructorId(Long instructorId, Pageable pageable);
}

