package com.audition.platform.domain.audition;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface ApplicationSnsLinkRepository extends JpaRepository<ApplicationSnsLink, UUID> {

    List<ApplicationSnsLink> findByApplicationIdOrderByCreatedAtAsc(UUID applicationId);

    long countByApplicationId(UUID applicationId);

    @Query("SELECT l.applicationId, COUNT(l) FROM ApplicationSnsLink l WHERE l.applicationId IN :ids GROUP BY l.applicationId")
    List<Object[]> countGroupedByApplicationIdIn(@Param("ids") Collection<UUID> ids);
}
