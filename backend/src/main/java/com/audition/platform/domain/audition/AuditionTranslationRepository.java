package com.audition.platform.domain.audition;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AuditionTranslationRepository extends JpaRepository<AuditionTranslation, AuditionTranslationId> {

    List<AuditionTranslation> findByAuditionIdOrderByLocaleAsc(UUID auditionId);

    Optional<AuditionTranslation> findByAuditionIdAndLocale(UUID auditionId, String locale);
}
