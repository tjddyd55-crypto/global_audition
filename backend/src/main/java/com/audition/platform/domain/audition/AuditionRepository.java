package com.audition.platform.domain.audition;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AuditionRepository extends JpaRepository<Audition, UUID> {

    List<Audition> findAllByOrderByCreatedAtDesc();

    List<Audition> findByOwnerIdOrderByCreatedAtDesc(UUID ownerId);
}
