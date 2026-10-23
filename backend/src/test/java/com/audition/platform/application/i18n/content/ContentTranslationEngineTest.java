package com.audition.platform.application.i18n.content;

import com.audition.platform.application.i18n.LocaleRegistry;
import com.audition.platform.application.i18n.TranslationAttemptRecorder;
import com.audition.platform.application.i18n.content.ContentTranslationRows.AttemptFinish;
import com.audition.platform.application.i18n.content.ContentTranslationRows.ContentSnapshot;
import com.audition.platform.application.i18n.content.ContentTranslationRows.NewAttempt;
import com.audition.platform.application.i18n.translation.ProviderUsage;
import com.audition.platform.application.i18n.translation.TranslationDocumentDraft;
import com.audition.platform.application.i18n.translation.TranslationDraft;
import com.audition.platform.application.i18n.translation.TranslationProvider;
import com.audition.platform.application.i18n.translation.TranslationProviderException;
import com.audition.platform.application.i18n.translation.TranslationSource;
import com.audition.platform.domain.audition.AuditionTranslation;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * 목 공급자 구조 검증. 토큰 숫자는 목이며 실제 모델 비용 PASS 가 아니다.
 */
class ContentTranslationEngineTest {

    private final UUID viewer = UUID.randomUUID();
    private final UUID contentId = UUID.randomUUID();
    private MemoryContentTranslationStore store;
    private StructProvider provider;
    private MutableSource source;
    private ContentTranslationService service;
    private ContentTranslationWorker worker;
    private TranslationQueueProperties properties;

    @BeforeEach
    void setUp() {
        store = new MemoryContentTranslationStore();
        provider = new StructProvider();
        source = new MutableSource();
        source.snapshot = snapshot("ko", "연습생 오디션");
        properties = new TranslationQueueProperties();
        properties.setUserDailyCostMicroUsd(0);
        properties.setAgencyDailyCostMicroUsd(0);
        properties.setGlobalDailyCostMicroUsd(0);
        properties.setUserMonthlyCostMicroUsd(0);
        properties.setAgencyMonthlyCostMicroUsd(0);
        properties.setGlobalMonthlyCostMicroUsd(0);
        properties.setGlobalMonthlyBilledCharacters(0);
        properties.setInputMicroUsdPerMillion(1_000_000L);
        properties.setOutputMicroUsdPerMillion(1_000_000L);
        TranslationAttemptRecorder recorder = mock(TranslationAttemptRecorder.class);
        when(recorder.startContent(any())).thenAnswer(invocation -> store.insertAttempt(invocation.getArgument(0)));
        doAnswer(invocation -> {
            store.finishAttempt(invocation.getArgument(0));
            return null;
        }).when(recorder).finishContent(any());
        service = new ContentTranslationService(
                java.util.List.of(source), store, new ContentTranslationQuota(store, properties),
                new LocaleRegistry(), properties, new ObjectMapper());
        worker = new ContentTranslationWorker(
                store, java.util.List.of(source), provider, recorder,
                new TranslationCostEstimator(properties), properties, new ObjectMapper());
    }

    @Test
    void mockProviderKeepsFieldShapeForPrimaryPairs() {
        assertPair("ko", "en", "보컬 연습생 모집");
        assertPair("en", "ko", "Global audition for trainees");
        assertPair("mn", "ko", "Дуучин сургагч");
        assertPair("mn", "en", "Улаанбаатар сонгон шалгаруулалт");
        source.snapshot = snapshot("ko", "대한민국 서울 오디션");
        UUID inactive = UUID.randomUUID();
        ContentTranslationView mongolian = service.read(ContentTypes.APPLICATION_INTRO, inactive, "mn", false, viewer);
        assertTrue(mongolian.showingOriginal());
        assertEquals(ContentTypes.TARGET_INACTIVE, mongolian.errorCode());
        assertTrue(store.findLatestJob(ContentTypes.APPLICATION_INTRO, inactive, "mn").isEmpty());
    }

    @Test
    void sameSourceAndViewLocaleReturnsOriginalWithoutAJob() {
        source.snapshot = snapshot("en", "Trainee audition in Seoul");
        ContentTranslationView view = service.read(ContentTypes.APPLICATION_INTRO, contentId, "en", false, viewer);
        assertTrue(view.showingOriginal());
        assertFalse(view.fallback());
        assertEquals("Trainee audition in Seoul", view.fields().get("introText"));
        assertTrue(store.findActiveJob(ContentTypes.APPLICATION_INTRO, contentId, "en").isEmpty());
        assertEquals(0, worker.drain());
    }

    @Test
    void providerFailureKeepsOriginalAndDoesNotDeleteAnExistingTranslation() {
        properties.setMaxAttempts(1);
        provider.fail = true;
        service.read(ContentTypes.APPLICATION_INTRO, contentId, "en", false, viewer);
        worker.drain();
        ContentTranslationView failed = service.read(ContentTypes.APPLICATION_INTRO, contentId, "en", false, viewer);
        assertTrue(failed.showingOriginal());
        assertTrue(failed.fallback());
        assertEquals("연습생 오디션", failed.fields().get("introText"));
        assertTrue(store.translations().isEmpty());

        properties.setMaxAttempts(3);
        provider.fail = false;
        UUID id = UUID.randomUUID();
        source.snapshot = snapshot("ko", "원문");
        service.read(ContentTypes.APPLICATION_INTRO, id, "en", false, viewer);
        worker.drain();
        String kept = store.findTranslation(ContentTypes.APPLICATION_INTRO, id, "en").orElseThrow().bodyJson();
        properties.setMaxAttempts(1);
        provider.fail = true;
        source.snapshot = snapshot("ko", "수정된 원문");
        service.read(ContentTypes.APPLICATION_INTRO, id, "en", false, viewer);
        worker.drain();
        assertEquals(kept, store.findTranslation(ContentTypes.APPLICATION_INTRO, id, "en").orElseThrow().bodyJson());
    }

    @Test
    void duplicateReadsCreateOneActiveJob() throws Exception {
        CountDownLatch start = new CountDownLatch(1);
        AtomicInteger created = new AtomicInteger();
        Thread first = new Thread(() -> {
            await(start);
            service.read(ContentTypes.APPLICATION_INTRO, contentId, "en", false, viewer);
            created.incrementAndGet();
        });
        Thread second = new Thread(() -> {
            await(start);
            service.read(ContentTypes.APPLICATION_INTRO, contentId, "en", false, viewer);
            created.incrementAndGet();
        });
        first.start();
        second.start();
        start.countDown();
        first.join();
        second.join();
        assertEquals(2, created.get());
        assertTrue(store.findActiveJob(ContentTypes.APPLICATION_INTRO, contentId, "en").isPresent());
        assertEquals(1, store.countGlobalJobsSince(java.time.Instant.EPOCH));
    }

    @Test
    void editMarksTranslationStaleAndManualTextIsNotReplaced() {
        service.read(ContentTypes.APPLICATION_INTRO, contentId, "en", false, viewer);
        worker.drain();
        source.snapshot = snapshot("ko", "수정된 모집 요강");
        ContentTranslationView stale = service.read(ContentTypes.APPLICATION_INTRO, contentId, "en", false, viewer);
        assertTrue(stale.stale());
        service.saveManual(ContentTypes.APPLICATION_INTRO, contentId, "en", Map.of("introText", "사람이 고친 문장"), viewer);
        source.writable = true;
        source.snapshot = snapshot("ko", "또 수정");
        ContentTranslationView manual = service.read(ContentTypes.APPLICATION_INTRO, contentId, "en", false, viewer);
        assertEquals("사람이 고친 문장", manual.fields().get("introText"));
        assertEquals(AuditionTranslation.ORIGIN_MANUAL, manual.origin());
        worker.drain();
        assertEquals("사람이 고친 문장", service.read(ContentTypes.APPLICATION_INTRO, contentId, "en", false, viewer).fields().get("introText"));
    }

    @Test
    void privateContentIsHiddenFromUnauthorizedViewers() {
        source.readable = false;
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.read(ContentTypes.APPLICATION_INTRO, contentId, "en", false, UUID.randomUUID()));
        assertEquals(404, ex.getStatusCode().value());
        assertTrue(store.findActiveJob(ContentTypes.APPLICATION_INTRO, contentId, "en").isEmpty());
    }

    @Test
    void quotaAndMissingProviderDoNotInventTokens() {
        properties.setUserJobsPerHour(1);
        service.read(ContentTypes.APPLICATION_INTRO, contentId, "en", false, viewer);
        service.read(ContentTypes.APPLICATION_INTRO, UUID.randomUUID(), "mn", false, viewer);
        assertEquals(1, store.countUserJobsSince(viewer, java.time.Instant.EPOCH));

        provider.configured = false;
        worker.drain();
        var attempt = store.latestAttempt(ContentTypes.APPLICATION_INTRO, contentId, "en").orElseThrow();
        assertEquals(ContentTypes.NOT_CONFIGURED, attempt.errorCode());
        assertNull(attempt.promptTokens());
        assertNull(attempt.estimatedCostMicroUsd());
        assertTrue(store.translations().isEmpty());
    }

    @Test
    void expiredLeaseIsClaimedAgainAfterARestart() {
        service.read(ContentTypes.APPLICATION_INTRO, contentId, "en", false, viewer);
        assertTrue(store.claim("crashed-worker", 120).isPresent());
        store.expireLeases();
        assertEquals(1, worker.drain());
        ContentTranslationView view = service.read(ContentTypes.APPLICATION_INTRO, contentId, "en", false, viewer);
        assertEquals("en:연습생 오디션", view.fields().get("introText"));
        var attempt = store.latestAttempt(ContentTypes.APPLICATION_INTRO, contentId, "en").orElseThrow();
        assertEquals(10, attempt.promptTokens());
        assertEquals(14L, attempt.estimatedCostMicroUsd());
    }

    @Test
    void repeatedReadsDoNotCallTheProvider() {
        service.read(ContentTypes.APPLICATION_INTRO, contentId, "en", false, viewer);
        assertEquals(1, worker.drain());
        int calls = provider.calls;
        service.read(ContentTypes.APPLICATION_INTRO, contentId, "en", false, viewer);
        service.read(ContentTypes.APPLICATION_INTRO, contentId, "en", false, viewer);
        assertEquals(0, worker.drain());
        assertEquals(calls, provider.calls);
    }

    @Test
    void monthlyBudgetKeepsOriginalAndDoesNotEnqueue() {
        properties.setGlobalMonthlyCostMicroUsd(50);
        UUID attemptId = store.insertAttempt(new NewAttempt(
                UUID.randomUUID(), ContentTypes.APPLICATION_INTRO, contentId, "en", null, viewer, null, "MOCK"));
        store.finishAttempt(new AttemptFinish(
                attemptId, AuditionTranslation.STATUS_COMPLETED, null, null, new ProviderUsage(1, 1, 1, 100), 50L));
        ContentTranslationView view = service.read(ContentTypes.APPLICATION_INTRO, contentId, "en", false, viewer);
        assertTrue(view.showingOriginal());
        assertEquals("연습생 오디션", view.fields().get("introText"));
        assertTrue(store.findLatestJob(ContentTypes.APPLICATION_INTRO, contentId, "en").isEmpty());
    }

    @Test
    void publishRequestsEnglishFirstAndSkipsTheSourceLocale() {
        source.type = ContentTypes.AUDITION_POSTING;
        source.snapshot = snapshot("ko", "보컬 모집");
        service.requestActiveTargets(ContentTypes.AUDITION_POSTING, contentId, viewer);
        assertTrue(store.findActiveJob(ContentTypes.AUDITION_POSTING, contentId, "en").isPresent());
        assertTrue(store.findLatestJob(ContentTypes.AUDITION_POSTING, contentId, "ko").isEmpty());
        assertTrue(store.findLatestJob(ContentTypes.AUDITION_POSTING, contentId, "mn").isEmpty());

        UUID englishPosting = UUID.randomUUID();
        source.snapshot = snapshot("en", "Open call");
        service.requestActiveTargets(ContentTypes.AUDITION_POSTING, englishPosting, viewer);
        assertTrue(store.findLatestJob(ContentTypes.AUDITION_POSTING, englishPosting, "en").isEmpty());
        assertTrue(store.findActiveJob(ContentTypes.AUDITION_POSTING, englishPosting, "ko").isPresent());
    }

    @Test
    void explicitRetryOfAnInactiveLocaleIsRejected() {
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.retry(ContentTypes.APPLICATION_INTRO, contentId, "mn", false, viewer));
        assertEquals(400, ex.getStatusCode().value());
        assertEquals(ContentTypes.TARGET_INACTIVE, ex.getReason());
    }

    @Test
    void prosePayloadDropsContactLinesAndKeepsFreeText() {
        var fields = ContentTexts.proseFields(
                "introText", "나는 보컬이다",
                "message", "user@example.com",
                "bio", "활동 https://example.com 소개\n010-1234-5678\nKR\n100 USD");
        assertEquals("나는 보컬이다", fields.get("introText"));
        assertFalse(fields.containsKey("message"));
        assertEquals("활동 소개", fields.get("bio"));
        assertFalse(fields.get("bio").contains("@"));
        assertFalse(fields.get("bio").contains("http"));
    }

    private void assertPair(String sourceLocale, String target, String text) {
        source.snapshot = snapshot(sourceLocale, text);
        UUID id = UUID.randomUUID();
        ContentTranslationView waiting = service.read(ContentTypes.APPLICATION_INTRO, id, target, false, viewer);
        assertTrue(waiting.showingOriginal());
        assertEquals(text, waiting.fields().get("introText"));
        worker.drain();
        ContentTranslationView done = service.read(ContentTypes.APPLICATION_INTRO, id, target, false, viewer);
        assertFalse(done.showingOriginal());
        assertEquals(target + ":" + text, done.fields().get("introText"));
        assertTrue(done.fields().containsKey("introText"));
    }

    private ContentSnapshot snapshot(String sourceLocale, String text) {
        return new ContentSnapshot(
                ContentTypes.APPLICATION_INTRO, contentId, sourceLocale,
                new LinkedHashMap<>(Map.of("introText", text)), viewer, UUID.randomUUID());
    }

    private static void await(CountDownLatch latch) {
        try {
            latch.await();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    private static final class StructProvider implements TranslationProvider {
        private boolean configured = true;
        private boolean fail;
        private int calls;

        @Override
        public String providerId() {
            return "MOCK";
        }

        @Override
        public boolean isConfigured() {
            return configured;
        }

        @Override
        public TranslationDraft translate(TranslationSource source, String targetLocale) {
            throw new UnsupportedOperationException();
        }

        @Override
        public TranslationDocumentDraft translateDocument(String sourceLocale, Map<String, String> fields, String targetLocale) {
            calls++;
            if (!configured) {
                throw new TranslationProviderException(AuditionTranslation.ERROR_NOT_CONFIGURED, "not configured");
            }
            if (fail) {
                throw new TranslationProviderException(AuditionTranslation.ERROR_HTTP, "mock down");
            }
            Map<String, String> out = new LinkedHashMap<>();
            fields.forEach((key, value) -> out.put(key, value == null || value.isBlank() ? "" : targetLocale + ":" + value));
            return new TranslationDocumentDraft(out, new ProviderUsage(10, 4, 14));
        }
    }

    private static final class MutableSource implements ContentTranslationSource {
        private String type = ContentTypes.APPLICATION_INTRO;
        private ContentSnapshot snapshot;
        private boolean readable = true;
        private boolean writable = true;

        @Override
        public String type() {
            return type;
        }

        @Override
        public Optional<ContentSnapshot> load(UUID contentId) {
            if (snapshot == null) {
                return Optional.empty();
            }
            return Optional.of(new ContentSnapshot(
                    type(), contentId, snapshot.sourceLocale(), snapshot.fields(), snapshot.ownerUserId(), snapshot.agencyUserId()));
        }

        @Override
        public boolean canRead(ContentSnapshot snapshot, UUID viewer) {
            return readable;
        }

        @Override
        public boolean canWrite(ContentSnapshot snapshot, UUID viewer) {
            return writable;
        }
    }
}
