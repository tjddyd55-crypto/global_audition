package com.audition.platform.application.i18n;

import com.audition.platform.api.dto.AuditionResponse;
import com.audition.platform.domain.audition.Audition;
import com.audition.platform.domain.audition.AuditionRepository;
import com.audition.platform.domain.audition.AuditionTranslation;
import com.audition.platform.domain.audition.AuditionTranslationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AuditionLocalizationServiceTest {

    private AuditionTranslationRepository translationRepository;
    private AuditionLocalizationService service;

    @BeforeEach
    void setUp() {
        translationRepository = mock(AuditionTranslationRepository.class);
        AuditionRepository auditionRepository = mock(AuditionRepository.class);
        service = new AuditionLocalizationService(
                translationRepository,
                auditionRepository,
                new ContentLocaleResolver());
    }

    @Test
    void fallsBackToOriginalWhenMnMissing() {
        Audition audition = baseAudition("ko");
        AuditionResponse response = baseResponse(audition);
        when(translationRepository.findByAuditionIdAndLocale(audition.getId(), "mn"))
                .thenReturn(Optional.empty());

        service.apply(audition, response, "mn");

        assertEquals("원문 제목", response.getTitle());
        assertEquals("ko", response.getContentLocale());
        assertTrue(response.isContentLocaleFallback());
        assertEquals("2차 모집 중", response.getRecruitmentRoundLabel());
    }

    @Test
    void overlaysCompletedMnTranslation() {
        Audition audition = baseAudition("ko");
        AuditionResponse response = baseResponse(audition);
        AuditionTranslation row = new AuditionTranslation();
        row.setAuditionId(audition.getId());
        row.setLocale("mn");
        row.setTitle("Монгол гарчиг");
        row.setDescription("Тайлбар");
        row.setStatus(AuditionTranslation.STATUS_COMPLETED);
        when(translationRepository.findByAuditionIdAndLocale(audition.getId(), "mn"))
                .thenReturn(Optional.of(row));

        service.apply(audition, response, "mn");

        assertEquals("Монгол гарчиг", response.getTitle());
        assertEquals("Тайлбар", response.getDescription());
        assertEquals("mn", response.getContentLocale());
        assertFalse(response.isContentLocaleFallback());
        assertEquals("Монгол гарчиг (2-р шат)", response.getDisplayTitle());
    }

    @Test
    void incompleteTranslationFallsBackToOriginal() {
        Audition audition = baseAudition("ko");
        AuditionResponse response = baseResponse(audition);
        AuditionTranslation row = new AuditionTranslation();
        row.setAuditionId(audition.getId());
        row.setLocale("en");
        row.setTitle("   ");
        row.setStatus(AuditionTranslation.STATUS_COMPLETED);
        when(translationRepository.findByAuditionIdAndLocale(audition.getId(), "en"))
                .thenReturn(Optional.of(row));

        service.apply(audition, response, "en");

        assertEquals("원문 제목", response.getTitle());
        assertTrue(response.isContentLocaleFallback());
        assertEquals("ko", response.getContentLocale());
    }

    private static Audition baseAudition(String locale) {
        Audition audition = new Audition();
        audition.setId(UUID.randomUUID());
        audition.setTitle("원문 제목");
        audition.setDescription("원문");
        audition.setStatus("OPEN");
        audition.setSeriesRound(2);
        audition.setDefaultLocale(locale);
        return audition;
    }

    private static AuditionResponse baseResponse(Audition audition) {
        AuditionResponse response = new AuditionResponse();
        response.setTitle(audition.getTitle());
        response.setDescription(audition.getDescription());
        response.setStatus(audition.getStatus());
        return response;
    }
}
