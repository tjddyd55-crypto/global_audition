package com.audition.platform.application.i18n.content;

import com.audition.platform.application.i18n.content.ContentTranslationRows.ContentSnapshot;
import com.audition.platform.application.i18n.content.ContentTranslationRows.NewJob;
import com.audition.platform.application.i18n.content.ContentTranslationRows.StoredJob;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.TestPropertySource;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@TestPropertySource(properties = {
        "spring.datasource.url=${TEST_DB_URL:jdbc:postgresql://localhost:5432/audition_engine_test}",
        "spring.datasource.username=${TEST_DB_USER:postgres}",
        "spring.datasource.password=${TEST_DB_PASSWORD:postgres}",
        "audition.voting-db-verify=false",
        "app.translation.queue.enabled=false",
        "app.super-admin.bootstrap-enabled=false",
})
class ContentTranslationQueueIT {

    @Autowired
    private ContentTranslationStore store;
    @Autowired
    private ContentTranslationWorker worker;
    @Autowired
    private JdbcTemplate jdbc;

    private static final String FIXTURE = "TEST_FIXTURE";

    @BeforeEach
    void clearQueue() {
        jdbc.update("DELETE FROM content_translation_attempts");
        jdbc.update("DELETE FROM content_translation_jobs");
        jdbc.update("DELETE FROM content_translations");
    }

    @Test
    void legacyLocaleColumnStaysEightCharacters() {
        Integer length = jdbc.queryForObject("""
                SELECT character_maximum_length
                FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'audition_translations' AND column_name = 'locale'
                """, Integer.class);
        assertEquals(8, length);
        Integer wide = jdbc.queryForObject("""
                SELECT character_maximum_length
                FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'content_translations' AND column_name = 'locale'
                """, Integer.class);
        assertEquals(35, wide);
        Integer version = jdbc.queryForObject(
                "SELECT COUNT(*) FROM flyway_schema_history WHERE version = '47'", Integer.class);
        assertEquals(1, version);
    }

    @Test
    void concurrentEnqueueCreatesOneJobAndSkipLockedClaimsDistinctRows() throws Exception {
        UUID contentId = UUID.randomUUID();
        ExecutorService pool = Executors.newFixedThreadPool(2);
        try {
            Future<Optional<UUID>> first = pool.submit(() -> pending(contentId, "en"));
            Future<Optional<UUID>> second = pool.submit(() -> pending(contentId, "en"));
            Optional<UUID> a = first.get();
            Optional<UUID> b = second.get();
            assertTrue(a.isPresent() ^ b.isPresent());
            assertTrue(store.findActiveJob(FIXTURE, contentId, "en").isPresent());

            UUID otherA = UUID.randomUUID();
            UUID otherB = UUID.randomUUID();
            assertTrue(pending(otherA, "ko").isPresent());
            assertTrue(pending(otherB, "mn").isPresent());
            Future<Optional<StoredJob>> claimA = pool.submit(() -> store.claim("it-a", 120));
            Future<Optional<StoredJob>> claimB = pool.submit(() -> store.claim("it-b", 120));
            StoredJob left = claimA.get().orElseThrow();
            StoredJob right = claimB.get().orElseThrow();
            assertNotEquals(left.id(), right.id());
        } finally {
            pool.shutdownNow();
        }
    }

    @Test
    void expiredLeaseIsRecoveredAndMissingKeyBlocksWithoutTokens() {
        UUID contentId = UUID.randomUUID();
        UUID jobId = pending(contentId, "en").orElseThrow();
        StoredJob claimed = store.claim("crashed", 120).orElseThrow();
        assertEquals(jobId, claimed.id());
        jdbc.update("UPDATE content_translation_jobs SET lease_until = NOW() - INTERVAL '1 minute' WHERE id = ?", jobId);
        assertEquals(1, worker.drain());
        StoredJob finished = store.findLatestJob(FIXTURE, contentId, "en").orElseThrow();
        assertEquals(ContentTypes.JOB_BLOCKED, finished.status());
        assertEquals(ContentTypes.NOT_CONFIGURED, finished.errorCode());
        var attempt = store.latestAttempt(FIXTURE, contentId, "en").orElseThrow();
        assertNull(attempt.promptTokens());
        assertNull(attempt.estimatedCostMicroUsd());
        assertTrue(store.findTranslation(ContentTypes.APPLICATION_INTRO, contentId, "en").isEmpty());
    }

    private Optional<UUID> pending(UUID contentId, String locale) {
        return store.insertPendingJob(new NewJob(
                UUID.randomUUID(), FIXTURE, contentId, locale, "hash",
                null, null, 3, false));
    }

    @TestConfiguration
    static class SampleContent {
        @Bean
        ContentTranslationSource sampleSource() {
            return new ContentTranslationSource() {
                @Override
                public String type() {
                    return FIXTURE;
                }

                @Override
                public java.util.Optional<ContentSnapshot> load(UUID contentId) {
                    return java.util.Optional.of(new ContentSnapshot(
                            type(), contentId, "ko", Map.of("introText", "연습생"), null, null));
                }

                @Override
                public boolean canRead(ContentSnapshot snapshot, UUID viewer) {
                    return true;
                }

                @Override
                public boolean canWrite(ContentSnapshot snapshot, UUID viewer) {
                    return false;
                }
            };
        }
    }
}
