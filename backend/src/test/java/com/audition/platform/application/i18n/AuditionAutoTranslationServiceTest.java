package com.audition.platform.application.i18n;

import com.audition.platform.api.dto.AuditionTranslationView;
import com.audition.platform.application.i18n.translation.TranslationDraft;
import com.audition.platform.application.i18n.translation.TranslationProvider;
import com.audition.platform.application.i18n.translation.TranslationProviderException;
import com.audition.platform.domain.audition.Audition;
import com.audition.platform.domain.audition.AuditionRepository;
import com.audition.platform.domain.audition.AuditionTranslation;
import com.audition.platform.domain.audition.AuditionTranslationId;
import com.audition.platform.domain.audition.AuditionTranslationRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AuditionAutoTranslationServiceTest {

    private AuditionRepository auditionRepository;
    private AuditionTranslationRepository translationRepository;
    private TranslationProvider provider;
    private AuditionAutoTranslationService service;
    private Audition audition;

    @BeforeEach
    void setUp() {
        auditionRepository = mock(AuditionRepository.class);
        translationRepository = mock(AuditionTranslationRepository.class);
        provider = mock(TranslationProvider.class);
        when(provider.providerId()).thenReturn("OPENAI_COMPATIBLE");
        when(provider.isConfigured()).thenReturn(true);
        service = new AuditionAutoTranslationService(auditionRepository, translationRepository, provider);
        audition = audition("원문");
        when(auditionRepository.findById(audition.getId())).thenReturn(Optional.of(audition));
        when(translationRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(translationRepository.saveAndFlush(any())).thenAnswer(invocation -> invocation.getArgument(0));
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                audition.getOwnerId(),
                null,
                List.of(new SimpleGrantedAuthority("ROLE_AGENCY"))));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void manualRowIsNotOverwrittenWithoutForce() {
        AuditionTranslation manual = completed("en", "수동 제목");
        manual.setOrigin(AuditionTranslation.ORIGIN_MANUAL);
        manual.setManuallyEdited(true);
        when(translationRepository.findById(new AuditionTranslationId(audition.getId(), "en")))
                .thenReturn(Optional.of(manual));

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> service.translateLocale(audition.getId(), "en", false));

        assertEquals(409, ex.getStatusCode().value());
        assertEquals("수동 제목", manual.getTitle());
        verify(provider, never()).translate(any(), any());
    }

    @Test
    void forceOverwritesManualAndClearsEditedFlag() {
        AuditionTranslation manual = completed("en", "수동 제목");
        manual.setOrigin(AuditionTranslation.ORIGIN_MANUAL);
        manual.setManuallyEdited(true);
        when(translationRepository.findById(new AuditionTranslationId(audition.getId(), "en")))
                .thenReturn(Optional.of(manual));
        when(provider.translate(any(), any())).thenReturn(draft("Auto title"));

        AuditionTranslationView view = service.translateLocale(audition.getId(), "en", true);

        assertEquals("COMPLETED", view.getStatus());
        assertEquals("Auto title", view.getTitle());
        assertEquals("AUTO", view.getOrigin());
        assertFalse(view.isManuallyEdited());
        assertEquals(AuditionSourceFingerprint.hash(audition), view.getSourceHash());
        assertFalse(view.isStale());
    }

    @Test
    void notConfiguredMarksFailedWithoutInventingText() {
        AuditionTranslation failed = completed("en", "이전 자동");
        failed.setOrigin(AuditionTranslation.ORIGIN_AUTO);
        failed.setProvider("OPENAI_COMPATIBLE");
        failed.setStatus(AuditionTranslation.STATUS_FAILED);
        when(translationRepository.findById(new AuditionTranslationId(audition.getId(), "en")))
                .thenReturn(Optional.of(failed));
        AtomicReference<String> statusAtFlush = new AtomicReference<>();
        when(translationRepository.saveAndFlush(any())).thenAnswer(invocation -> {
            AuditionTranslation flushing = invocation.getArgument(0);
            statusAtFlush.set(flushing.getStatus());
            return flushing;
        });
        when(provider.translate(any(), any())).thenThrow(new TranslationProviderException(
                AuditionTranslation.ERROR_NOT_CONFIGURED,
                "번역 공급자가 설정되지 않았습니다."));

        AuditionTranslationView view = service.translateLocale(audition.getId(), "en", false);

        assertEquals("PENDING", statusAtFlush.get());
        assertEquals("FAILED", view.getStatus());
        assertEquals("NOT_CONFIGURED", view.getErrorCode());
        assertEquals("이전 자동", view.getTitle());
    }

    @Test
    void retryFailedBecomesCompleted() {
        AuditionTranslation failed = completed("mn", "");
        failed.setOrigin(AuditionTranslation.ORIGIN_AUTO);
        failed.setProvider("OPENAI_COMPATIBLE");
        failed.setStatus(AuditionTranslation.STATUS_FAILED);
        failed.setErrorCode(AuditionTranslation.ERROR_PROVIDER);
        when(translationRepository.findById(new AuditionTranslationId(audition.getId(), "mn")))
                .thenReturn(Optional.of(failed));
        when(provider.translate(any(), any())).thenReturn(draft("Монгол"));

        AuditionTranslationView view = service.translateLocale(audition.getId(), "mn", false);

        assertEquals("COMPLETED", view.getStatus());
        assertEquals("Монгол", view.getTitle());
        assertEquals(null, view.getErrorCode());
    }

    @Test
    void sourceChangeMarksStaleWithoutDeleting() {
        AuditionTranslation row = completed("en", "Old");
        row.setOrigin(AuditionTranslation.ORIGIN_AUTO);
        row.setSourceHash("previous");
        when(translationRepository.findByAuditionIdOrderByLocaleAsc(audition.getId())).thenReturn(List.of(row));
        when(translationRepository.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));
        AuditionLocalizationService localization = new AuditionLocalizationService(
                translationRepository,
                auditionRepository,
                new ContentLocaleResolver());
        audition.setContentSourceHash("previous");

        audition.setTitle("바뀐 원문");
        localization.onSourceWritten(audition, true);

        assertTrue(row.isStale());
        assertEquals("Old", row.getTitle());
        assertEquals(2, audition.getContentRevision());
    }

    private Audition audition(String title) {
        Audition row = new Audition();
        row.setId(UUID.randomUUID());
        row.setOwnerId(UUID.randomUUID());
        row.setTitle(title);
        row.setDescription("설명");
        row.setDefaultLocale("ko");
        row.setContentRevision(1);
        return row;
    }

    private AuditionTranslation completed(String locale, String title) {
        AuditionTranslation row = new AuditionTranslation();
        row.setAuditionId(audition.getId());
        row.setLocale(locale);
        row.setTitle(title);
        row.setStatus(AuditionTranslation.STATUS_COMPLETED);
        row.setProvider(AuditionTranslation.PROVIDER_MANUAL);
        return row;
    }

    private static TranslationDraft draft(String title) {
        return new TranslationDraft(title, "body", "place", "agency", List.of("role"), List.of(), List.of(), List.of());
    }
}
