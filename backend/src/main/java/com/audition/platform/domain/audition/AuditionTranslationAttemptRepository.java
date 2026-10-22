package com.audition.platform.domain.audition;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface AuditionTranslationAttemptRepository extends JpaRepository<AuditionTranslationAttempt, UUID> {

    Optional<AuditionTranslationAttempt> findFirstByAuditionIdAndLocaleOrderByStartedAtDesc(UUID auditionId, String locale);
}
