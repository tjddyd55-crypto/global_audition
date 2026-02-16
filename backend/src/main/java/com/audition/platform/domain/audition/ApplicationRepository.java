package com.audition.platform.domain.audition;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ApplicationRepository extends JpaRepository<Application, UUID> {

    List<Application> findByAuditionIdOrderByCreatedAtDesc(UUID auditionId);

    Optional<Application> findByAuditionIdAndApplicantId(UUID auditionId, UUID applicantId);

    boolean existsByAuditionIdAndApplicantId(UUID auditionId, UUID applicantId);

    List<Application> findByApplicantIdOrderByCreatedAtDesc(UUID applicantId);

    long countByApplicantId(UUID applicantId);

    long countByApplicantIdAndStatus(UUID applicantId, String status);

    long countByStatusAndAuditionIdIn(String status, List<UUID> auditionIds);

    long countByAuditionIdIn(List<UUID> auditionIds);

    List<Application> findTop10ByAuditionIdInOrderByCreatedAtDesc(List<UUID> auditionIds);

    List<Application> findTop10ByApplicantIdOrderByCreatedAtDesc(UUID applicantId);
}
