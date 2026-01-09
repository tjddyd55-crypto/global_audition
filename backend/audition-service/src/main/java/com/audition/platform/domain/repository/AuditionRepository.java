package com.audition.platform.domain.repository;

import com.audition.platform.domain.entity.Audition;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface AuditionRepository extends JpaRepository<Audition, Long> {

    Page<Audition> findByStatusIn(List<Audition.AuditionStatus> statuses, Pageable pageable);

    Page<Audition> findByBusinessIdAndStatusIn(
            Long businessId,
            List<Audition.AuditionStatus> statuses,
            Pageable pageable
    );

    Page<Audition> findByCategoryAndStatusIn(
            Audition.AuditionCategory category,
            List<Audition.AuditionStatus> statuses,
            Pageable pageable
    );

    @Query("SELECT a FROM Audition a WHERE a.endDate < :date AND a.status = :status")
    List<Audition> findFinishedAuditions(
            @Param("date") LocalDate date,
            @Param("status") Audition.AuditionStatus status
    );
}
