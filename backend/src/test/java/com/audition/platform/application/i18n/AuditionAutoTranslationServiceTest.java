package com.audition.platform.application.i18n;

import com.audition.platform.api.dto.AuditionTranslationView;
import com.audition.platform.application.i18n.translation.TranslationDraft;
import com.audition.platform.application.i18n.translation.TranslationProvider;
import com.audition.platform.application.i18n.translation.TranslationProviderException;
import com.audition.platform.domain.audition.Audition;
import com.audition.platform.domain.audition.AuditionRepository;
import com.audition.platform.domain.audition.AuditionTranslation;
import com.audition.platform.domain.audition.AuditionTranslationAttempt;
import com.audition.platform.domain.audition.AuditionTranslationId;
import com.audition.platform.domain.audition.AuditionTranslationRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.dao.OptimisticLockingFailureException;
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
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AuditionAutoTranslationServiceTest {

    private AuditionRepository auditionRepository;
    private AuditionTranslationRepository translationRepository;
    private TranslationProvider provider;
    private TranslationAttemptRecorder attemptRecorder;
    private AuditionAutoTranslationService service;
    private Audition audition;
    private final AtomicReference<AuditionTranslation> stored = new AtomicReference<>();

    @BeforeEach
    void setUp() {
        auditionRepository = mock(AuditionRepository.class);
        translationRepository = mock(AuditionTranslationRepository.class);
        provider = mock(TranslationProvider.class);
        attemptRecorder = mock(TranslationAttemptRecorder.class);
        when(provider.providerId()).thenReturn("OPENAI_COMPATIBLE");
        when(provider.isConfigured()).thenReturn(true);
        when(attemptRecorder.start(any(), any(), any())).thenReturn(UUID.randomUUID());
        when(attemptRecorder.finish(any(), any(), any(), any())).thenAnswer(invocation -> {
            AuditionTranslationAttempt attempt = new AuditionTranslationAttempt();
            attempt.setId(invocation.getArgument(0));
            attempt.setStatus(invocation.getArgument(1));
            attempt.setErrorCode(invocation.getArgument(2));
            attempt.setErrorMessage(invocation.getArgument(3));
            return attempt;
        });
        service = new AuditionAutoTranslationService(
                auditionRepository, translationRepository, provider, attemptRecorder);
        audition = audition("원문");
        when(auditionRepository.findById(audition.getId())).thenReturn(Optional.of(audition));
        when(translationRepository.findById(any())).thenAnswer(invocation -> Optional.ofNullable(stored.get()));
        when(translationRepository.save(any())).thenAnswer(invocation -> {
            stored.set(invocation.getArgument(0));
            return invocation.getArgument(0);
        });
        when(translationRepository.saveAndFlush(any())).thenAnswer(invocation -> {
            stored.set(invocation.getArgument(0));
            return invocation.getArgument(0);
        });
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
        stored.set(manual);

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> service.translateLocale(audition.getId(), "en", false));

        assertEquals(409, ex.getStatusCode().value());
        assertEquals("수동 제목", manual.getTitle());
        assertEquals(AuditionTranslation.ORIGIN_MANUAL, manual.getOrigin());
        assertEquals(AuditionTranslation.STATUS_COMPLETED, manual.getStatus());
        verify(provider, never()).translate(any(), any());
        verify(attemptRecorder, never()).start(any(), any(), any());
    }

    @Test
    void forceOverwritesManualAndClearsEditedFlag() {
        AuditionTranslation manual = completed("en", "수동 제목");
        manual.setOrigin(AuditionTranslation.ORIGIN_MANUAL);
        manual.setManuallyEdited(true);
        manual.setRowVersion(2L);
        stored.set(manual);
        when(provider.translate(any(), any())).thenReturn(draft("Auto title"));

        AuditionTranslationView view = service.translateLocale(audition.getId(), "en", true);

        assertEquals("COMPLETED", view.getStatus());
        assertEquals("COMPLETED", view.getAttemptStatus());
        assertEquals("Auto title", view.getTitle());
        assertEquals("AUTO", view.getOrigin());
        assertFalse(view.isManuallyEdited());
        assertEquals(AuditionSourceFingerprint.hash(audition), view.getSourceHash());
        assertFalse(view.isStale());
    }

    @Test
    void missingFieldDoesNotCompleteOrReplaceManualText() {
        AuditionTranslation manual = completed("en", "수동 제목");
        manual.setOrigin(AuditionTranslation.ORIGIN_MANUAL);
        manual.setManuallyEdited(true);
        manual.setDescription("기존 설명");
        manual.setRowVersion(1L);
        stored.set(manual);
        when(provider.translate(any(), any())).thenReturn(
                new TranslationDraft("Title", "", "", "", List.of(), List.of(), List.of(), List.of()));

        AuditionTranslationView view = service.translateLocale(audition.getId(), "en", true);

        assertEquals(AuditionTranslation.STATUS_COMPLETED, view.getStatus());
        assertEquals(AuditionTranslation.ORIGIN_MANUAL, view.getOrigin());
        assertEquals("수동 제목", view.getTitle());
        assertEquals("기존 설명", manual.getDescription());
        assertTrue(manual.isManuallyEdited());
        assertEquals(AuditionTranslation.STATUS_FAILED, view.getAttemptStatus());
        assertEquals(AuditionTranslation.ERROR_MISSING_FIELD, view.getAttemptErrorCode());
    }

    @Test
    void arrayLengthMismatchStaysRetryable() {
        audition.setRecruitFields(new String[] {"보컬", "댄스"});
        AuditionTranslation row = completed("en", "이전");
        row.setOrigin(AuditionTranslation.ORIGIN_AUTO);
        row.setStatus(AuditionTranslation.STATUS_FAILED);
        row.setRowVersion(4L);
        stored.set(row);
        when(provider.translate(any(), any())).thenReturn(
                new TranslationDraft("Title", "Body", "", "", List.of("Vocal"), List.of(), List.of(), List.of()));

        AuditionTranslationView view = service.translateLocale(audition.getId(), "en", false);

        assertEquals("이전", view.getTitle());
        assertEquals(AuditionTranslation.STATUS_FAILED, row.getStatus());
        assertEquals(AuditionTranslation.ERROR_ARRAY_LENGTH_MISMATCH, view.getAttemptErrorCode());
        assertEquals(AuditionTranslation.STATUS_FAILED, view.getAttemptStatus());
    }

    @Test
    void providerFailurePreservesManualOriginAndBody() {
        AuditionTranslation manual = completed("en", "수동 제목");
        manual.setOrigin(AuditionTranslation.ORIGIN_MANUAL);
        manual.setManuallyEdited(true);
        manual.setRowVersion(1L);
        stored.set(manual);
        when(provider.translate(any(), any())).thenThrow(new TranslationProviderException(
                AuditionTranslation.ERROR_NOT_CONFIGURED,
                "번역 공급자가 설정되지 않았습니다."));

        AuditionTranslationView view = service.translateLocale(audition.getId(), "en", true);

        assertEquals(AuditionTranslation.STATUS_COMPLETED, view.getStatus());
        assertEquals(AuditionTranslation.ORIGIN_MANUAL, view.getOrigin());
        assertTrue(view.isManuallyEdited());
        assertEquals("수동 제목", view.getTitle());
        assertNull(view.getErrorCode());
        assertEquals(AuditionTranslation.STATUS_FAILED, view.getAttemptStatus());
        assertEquals(AuditionTranslation.ERROR_NOT_CONFIGURED, view.getAttemptErrorCode());
    }

    @Test
    void firstFailureDoesNotInsertCompletedRow() {
        when(provider.translate(any(), any())).thenThrow(new TranslationProviderException(
                AuditionTranslation.ERROR_TIMEOUT,
                "번역 공급자 응답 시간이 초과되었습니다."));

        AuditionTranslationView view = service.translateLocale(audition.getId(), "en", false);

        assertEquals(AuditionTranslation.STATUS_FAILED, view.getStatus());
        assertEquals("", view.getTitle());
        assertEquals(AuditionTranslation.ERROR_TIMEOUT, view.getAttemptErrorCode());
        verify(translationRepository, never()).save(any());
        verify(translationRepository, never()).saveAndFlush(any());
    }

    @Test
    void retryAfterFailureBecomesAutoCompleted() {
        AuditionTranslation failed = completed("mn", "이전 실패 본문");
        failed.setOrigin(AuditionTranslation.ORIGIN_AUTO);
        failed.setProvider("OPENAI_COMPATIBLE");
        failed.setStatus(AuditionTranslation.STATUS_FAILED);
        failed.setErrorCode(AuditionTranslation.ERROR_TIMEOUT);
        failed.setRowVersion(3L);
        stored.set(failed);
        when(provider.translate(any(), any()))
                .thenThrow(new TranslationProviderException(AuditionTranslation.ERROR_HTTP, "번역 공급자가 HTTP 500 를 반환했습니다."))
                .thenReturn(draft("Монгол"));

        AuditionTranslationView failedView = service.translateLocale(audition.getId(), "mn", false);
        assertEquals(AuditionTranslation.STATUS_FAILED, failed.getStatus());
        assertEquals("이전 실패 본문", failed.getTitle());
        assertEquals(AuditionTranslation.ORIGIN_AUTO, failed.getOrigin());
        assertEquals(AuditionTranslation.ERROR_HTTP, failedView.getAttemptErrorCode());

        AuditionTranslationView view = service.translateLocale(audition.getId(), "mn", false);

        assertEquals(AuditionTranslation.STATUS_COMPLETED, view.getStatus());
        assertEquals("Монгол", view.getTitle());
        assertEquals(AuditionTranslation.ORIGIN_AUTO, view.getOrigin());
        assertFalse(view.isManuallyEdited());
        assertNull(view.getErrorCode());
        assertEquals(AuditionTranslation.STATUS_COMPLETED, view.getAttemptStatus());
    }

    @Test
    void versionMismatchDoesNotReplaceBodyAndCanRetry() {
        AuditionTranslation seen = completed("en", "수동 제목");
        seen.setOrigin(AuditionTranslation.ORIGIN_MANUAL);
        seen.setManuallyEdited(false);
        seen.setOrigin(AuditionTranslation.ORIGIN_AUTO);
        seen.setRowVersion(1L);
        AuditionTranslation newer = completed("en", "동시 수정");
        newer.setOrigin(AuditionTranslation.ORIGIN_MANUAL);
        newer.setManuallyEdited(true);
        newer.setRowVersion(2L);
        when(translationRepository.findById(new AuditionTranslationId(audition.getId(), "en")))
                .thenReturn(Optional.of(seen), Optional.of(newer), Optional.of(newer), Optional.of(newer));
        when(provider.translate(any(), any())).thenReturn(draft("Auto title"));

        AuditionTranslationView conflict = service.translateLocale(audition.getId(), "en", true);

        assertEquals("동시 수정", conflict.getTitle());
        assertEquals(AuditionTranslation.ORIGIN_MANUAL, conflict.getOrigin());
        assertTrue(conflict.isManuallyEdited());
        assertEquals(AuditionTranslation.STATUS_COMPLETED, conflict.getStatus());
        assertEquals(AuditionTranslation.ERROR_CONCURRENT_EDIT, conflict.getAttemptErrorCode());
        verify(translationRepository, never()).saveAndFlush(any());

        stored.set(newer);
        when(translationRepository.findById(any())).thenAnswer(invocation -> Optional.ofNullable(stored.get()));
        AuditionTranslationView retried = service.translateLocale(audition.getId(), "en", true);
        assertEquals("Auto title", retried.getTitle());
        assertEquals(AuditionTranslation.ORIGIN_AUTO, retried.getOrigin());
        assertFalse(retried.isManuallyEdited());
    }

    @Test
    void optimisticLockRestoresBodyAndConflicts() {
        AuditionTranslation row = completed("en", "수동 제목");
        row.setOrigin(AuditionTranslation.ORIGIN_MANUAL);
        row.setManuallyEdited(true);
        row.setRowVersion(5L);
        stored.set(row);
        when(provider.translate(any(), any())).thenReturn(draft("Auto title"));
        when(translationRepository.saveAndFlush(any())).thenThrow(new OptimisticLockingFailureException("version"));

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> service.translateLocale(audition.getId(), "en", true));

        assertEquals(409, ex.getStatusCode().value());
        assertEquals("TRANSLATION_CONFLICT", ex.getReason());
        assertEquals("수동 제목", row.getTitle());
        assertEquals(AuditionTranslation.ORIGIN_MANUAL, row.getOrigin());
        assertTrue(row.isManuallyEdited());
        verify(attemptRecorder).finish(any(), eq(AuditionTranslation.STATUS_FAILED), eq(AuditionTranslation.ERROR_CONCURRENT_EDIT), any());
    }

    @Test
    void emptySourceFieldIsNotRequired() {
        audition.setDescription("");
        when(provider.translate(any(), any())).thenReturn(
                new TranslationDraft("Hello", "", "", "", List.of(), List.of(), List.of(), List.of()));

        AuditionTranslationView view = service.translateLocale(audition.getId(), "en", false);

        assertEquals(AuditionTranslation.STATUS_COMPLETED, view.getStatus());
        assertEquals("Hello", view.getTitle());
        assertEquals("", view.getDescription());
        assertEquals(AuditionTranslation.ORIGIN_AUTO, view.getOrigin());
        verify(attemptRecorder).finish(any(), eq(AuditionTranslation.STATUS_COMPLETED), isNull(), isNull());
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
                new ContentLocaleResolver(new com.audition.platform.application.i18n.LocaleRegistry()),
                mock(com.audition.platform.domain.audition.AuditionTranslationAttemptRepository.class));
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
        row.setDescription("기존 설명");
        row.setStatus(AuditionTranslation.STATUS_COMPLETED);
        row.setProvider(AuditionTranslation.PROVIDER_MANUAL);
        return row;
    }

    private static TranslationDraft draft(String title) {
        return new TranslationDraft(title, "body", "", "", List.of(), List.of(), List.of(), List.of());
    }
}
