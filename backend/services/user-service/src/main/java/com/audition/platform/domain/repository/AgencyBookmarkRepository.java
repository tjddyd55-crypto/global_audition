package com.audition.platform.domain.repository;

import com.audition.platform.domain.entity.AgencyBookmark;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AgencyBookmarkRepository extends JpaRepository<AgencyBookmark, Long> {
    Page<AgencyBookmark> findByOwnerId(Long ownerId, Pageable pageable);

    Optional<AgencyBookmark> findByOwnerIdAndApplicantId(Long ownerId, Long applicantId);
}

