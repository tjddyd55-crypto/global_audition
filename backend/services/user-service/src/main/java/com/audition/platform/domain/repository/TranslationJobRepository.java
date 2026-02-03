package com.audition.platform.domain.repository;

import com.audition.platform.domain.entity.TranslationJob;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TranslationJobRepository extends JpaRepository<TranslationJob, Long> {
    List<TranslationJob> findByStatus(TranslationJob.TranslationStatus status);
}

