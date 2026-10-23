package com.audition.platform.application;

import com.audition.platform.api.dto.AuditionResponse;
import com.audition.platform.application.audition.AuditionSeriesEligibilityService;
import com.audition.platform.application.i18n.AuditionLocalizationService;
import com.audition.platform.application.i18n.ContentLocaleResolver;
import com.audition.platform.application.round.AuditionRoundService;
import com.audition.platform.application.tag.AuditionTagService;
import com.audition.platform.domain.audition.Audition;
import com.audition.platform.domain.audition.AuditionRepository;
import com.audition.platform.domain.audition.AuditionTranslation;
import com.audition.platform.domain.audition.AuditionTranslationRepository;
import com.audition.platform.domain.audition.ApplicationRepository;
import com.audition.platform.domain.user.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AuditionPreviewServiceTest {

    private AuditionRepository auditionRepository;
    private ApplicationRepository applicationRepository;
    private AuditionTranslationRepository translationRepository;
    private AuditionService auditionService;

    @BeforeEach
    void setUp() {
        auditionRepository = mock(AuditionRepository.class);
        applicationRepository = mock(ApplicationRepository.class);
        translationRepository = mock(AuditionTranslationRepository.class);
        AuditionLocalizationService localization = new AuditionLocalizationService(
                translationRepository,
                auditionRepository,
                new ContentLocaleResolver(new com.audition.platform.application.i18n.LocaleRegistry()),
                mock(com.audition.platform.domain.audition.AuditionTranslationAttemptRepository.class));
        auditionService = new AuditionService(
                auditionRepository,
                mock(UserRepository.class),
                applicationRepository,
                mock(AuditionRoundService.class),
                mock(AuditionTagService.class),
                mock(AuditionSeriesEligibilityService.class),
                localization,
                mock(com.audition.platform.application.i18n.content.ContentTranslationService.class),
                mock(com.audition.platform.application.org.JdbcCrmStore.class));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void previewReadsTranslationAndDoesNotSave() {
        UUID ownerId = UUID.randomUUID();
        Audition audition = new Audition();
        audition.setId(UUID.randomUUID());
        audition.setOwnerId(ownerId);
        audition.setTitle("원문");
        audition.setDescription("설명");
        audition.setStatus("DRAFT");
        audition.setDefaultLocale("ko");
        audition.setSeriesRound(1);
        AuditionTranslation pending = new AuditionTranslation();
        pending.setLocale("en");
        pending.setTitle("Draft EN");
        pending.setStatus(AuditionTranslation.STATUS_PENDING);
        when(auditionRepository.findById(audition.getId())).thenReturn(Optional.of(audition));
        when(applicationRepository.countByAuditionId(audition.getId())).thenReturn(0L);
        when(translationRepository.findByAuditionIdAndLocale(audition.getId(), "en")).thenReturn(Optional.of(pending));
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                ownerId,
                null,
                List.of(new SimpleGrantedAuthority("ROLE_AGENCY"))));

        AuditionResponse response = auditionService.preview(audition.getId(), "en");

        assertTrue(response.isPreview());
        assertEquals("Draft EN", response.getTitle());
        assertEquals("PENDING", response.getTranslationStatus());
        verify(auditionRepository, never()).save(any());
        verify(applicationRepository, never()).save(any());
        verify(translationRepository, never()).save(any());
        verify(translationRepository, never()).saveAll(any());
    }
}
