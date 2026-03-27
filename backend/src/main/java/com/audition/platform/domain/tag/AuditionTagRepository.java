package com.audition.platform.domain.tag;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AuditionTagRepository extends JpaRepository<AuditionTag, UUID> {

    void deleteByAuditionId(UUID auditionId);

    List<AuditionTag> findByAuditionIdOrderByIdAsc(UUID auditionId);
}
