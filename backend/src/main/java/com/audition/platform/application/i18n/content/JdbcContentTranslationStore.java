package com.audition.platform.application.i18n.content;

import com.audition.platform.application.i18n.content.ContentTranslationRows.AttemptFinish;
import com.audition.platform.application.i18n.content.ContentTranslationRows.NewAttempt;
import com.audition.platform.application.i18n.content.ContentTranslationRows.NewJob;
import com.audition.platform.application.i18n.content.ContentTranslationRows.StoredAttempt;
import com.audition.platform.application.i18n.content.ContentTranslationRows.StoredJob;
import com.audition.platform.application.i18n.content.ContentTranslationRows.StoredTranslation;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class JdbcContentTranslationStore implements ContentTranslationStore {

    private static final String TRANSLATION_COLUMNS = """
            content_type, content_id, locale, source_locale, source_hash, source_revision, body::text AS body,
            status, stale, provider, origin, manually_edited, row_version, error_code, error_message
            """;

    private static final String JOB_COLUMNS = """
            id, content_type, content_id, locale, source_hash, requested_by, agency_id, status,
            attempt_count, max_attempts, force, error_code
            """;

    private final JdbcTemplate jdbc;

    public JdbcContentTranslationStore(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public Optional<StoredTranslation> findTranslation(String type, UUID id, String locale) {
        List<StoredTranslation> rows = jdbc.query(
                "SELECT " + TRANSLATION_COLUMNS + " FROM content_translations WHERE content_type = ? AND content_id = ? AND locale = ?",
                translationMapper(),
                type, id, locale);
        return rows.stream().findFirst();
    }

    @Override
    public void insertTranslation(StoredTranslation row) {
        jdbc.update("""
                INSERT INTO content_translations (
                    content_type, content_id, locale, source_locale, source_hash, source_revision, body,
                    status, stale, provider, origin, manually_edited, row_version, error_code, error_message
                ) VALUES (?, ?, ?, ?, ?, ?, CAST(? AS jsonb), ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                row.contentType(), row.contentId(), row.locale(), row.sourceLocale(), row.sourceHash(),
                row.sourceRevision(), row.bodyJson(), row.status(), row.stale(), row.provider(), row.origin(),
                row.manuallyEdited(), row.rowVersion(), row.errorCode(), row.errorMessage());
    }

    @Override
    public boolean compareAndSet(StoredTranslation row, long expectedVersion) {
        int updated = jdbc.update("""
                UPDATE content_translations
                SET source_locale = ?, source_hash = ?, source_revision = ?, body = CAST(? AS jsonb),
                    status = ?, stale = ?, provider = ?, origin = ?, manually_edited = ?,
                    error_code = ?, error_message = ?, row_version = row_version + 1, updated_at = NOW()
                WHERE content_type = ? AND content_id = ? AND locale = ? AND row_version = ?
                """,
                row.sourceLocale(), row.sourceHash(), row.sourceRevision(), row.bodyJson(), row.status(),
                row.stale(), row.provider(), row.origin(), row.manuallyEdited(), row.errorCode(),
                row.errorMessage(), row.contentType(), row.contentId(), row.locale(), expectedVersion);
        return updated == 1;
    }

    @Override
    public void markStaleWhereHashDiffers(String type, UUID id, String hash) {
        jdbc.update("""
                UPDATE content_translations
                SET stale = TRUE, updated_at = NOW()
                WHERE content_type = ? AND content_id = ? AND source_hash IS DISTINCT FROM ?
                """, type, id, hash);
    }

    @Override
    public UUID insertAttempt(NewAttempt attempt) {
        jdbc.update("""
                INSERT INTO content_translation_attempts (
                    id, content_type, content_id, locale, job_id, requested_by, agency_id, status, provider, started_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, NOW())
                """,
                attempt.id(), attempt.contentType(), attempt.contentId(), attempt.locale(), attempt.jobId(),
                attempt.requestedBy(), attempt.agencyId(), attempt.provider());
        return attempt.id();
    }

    @Override
    public void finishAttempt(AttemptFinish finish) {
        Integer prompt = finish.usage() == null ? null : finish.usage().promptTokens();
        Integer completion = finish.usage() == null ? null : finish.usage().completionTokens();
        Integer total = finish.usage() == null ? null : finish.usage().totalTokens();
        Integer billed = finish.usage() == null ? null : finish.usage().billedCharacters();
        jdbc.update("""
                UPDATE content_translation_attempts
                SET status = ?, error_code = ?, error_message = ?, prompt_tokens = ?, completion_tokens = ?,
                    total_tokens = ?, billed_characters = ?, estimated_cost_micro_usd = ?, finished_at = NOW()
                WHERE id = ?
                """,
                finish.status(), finish.errorCode(), finish.errorMessage(), prompt, completion, total, billed,
                finish.estimatedCostMicroUsd(), finish.id());
    }

    @Override
    public Optional<StoredAttempt> latestAttempt(String type, UUID id, String locale) {
        List<StoredAttempt> rows = jdbc.query("""
                SELECT id, status, error_code, prompt_tokens, completion_tokens, total_tokens, estimated_cost_micro_usd
                FROM content_translation_attempts
                WHERE content_type = ? AND content_id = ? AND locale = ?
                ORDER BY started_at DESC
                LIMIT 1
                """, (rs, n) -> new StoredAttempt(
                rs.getObject("id", UUID.class),
                rs.getString("status"),
                rs.getString("error_code"),
                (Integer) rs.getObject("prompt_tokens"),
                (Integer) rs.getObject("completion_tokens"),
                (Integer) rs.getObject("total_tokens"),
                (Long) rs.getObject("estimated_cost_micro_usd")), type, id, locale);
        return rows.stream().findFirst();
    }

    @Override
    public Optional<UUID> insertPendingJob(NewJob job) {
        try {
            jdbc.update("""
                    INSERT INTO content_translation_jobs (
                        id, content_type, content_id, locale, source_hash, requested_by, agency_id,
                        status, attempt_count, max_attempts, force, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', 0, ?, ?, NOW(), NOW())
                    """,
                    job.id(), job.contentType(), job.contentId(), job.locale(), job.sourceHash(),
                    job.requestedBy(), job.agencyId(), job.maxAttempts(), job.force());
            return Optional.of(job.id());
        } catch (DuplicateKeyException ex) {
            return Optional.empty();
        }
    }

    @Override
    public Optional<StoredJob> findActiveJob(String type, UUID id, String locale) {
        return oneJob("SELECT " + JOB_COLUMNS + """
                FROM content_translation_jobs
                WHERE content_type = ? AND content_id = ? AND locale = ? AND status IN ('PENDING', 'RUNNING')
                ORDER BY created_at
                LIMIT 1
                """, type, id, locale);
    }

    @Override
    public Optional<StoredJob> findLatestJob(String type, UUID id, String locale) {
        return oneJob("SELECT " + JOB_COLUMNS + """
                FROM content_translation_jobs
                WHERE content_type = ? AND content_id = ? AND locale = ?
                ORDER BY created_at DESC
                LIMIT 1
                """, type, id, locale);
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Optional<StoredJob> claim(String workerId, int leaseSeconds) {
        List<StoredJob> rows = jdbc.query("""
                UPDATE content_translation_jobs
                SET status = 'RUNNING',
                    lease_owner = ?,
                    lease_until = NOW() + (CAST(? AS INTEGER) * INTERVAL '1 second'),
                    started_at = COALESCE(started_at, NOW()),
                    updated_at = NOW()
                WHERE id = (
                    SELECT id
                    FROM content_translation_jobs
                    WHERE (status = 'PENDING' AND (run_after IS NULL OR run_after <= NOW()))
                       OR (status = 'RUNNING' AND lease_until IS NOT NULL AND lease_until < NOW())
                    ORDER BY created_at
                    FOR UPDATE SKIP LOCKED
                    LIMIT 1
                )
                RETURNING id, content_type, content_id, locale, source_hash, requested_by, agency_id,
                          status, attempt_count, max_attempts, force, error_code
                """,
                jobMapper(),
                workerId, leaseSeconds);
        return rows.stream().findFirst();
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void finishJob(UUID id, String status, String errorCode, String message) {
        jdbc.update("""
                UPDATE content_translation_jobs
                SET status = ?, error_code = ?, error_message = ?, lease_owner = NULL, lease_until = NULL,
                    finished_at = NOW(), updated_at = NOW()
                WHERE id = ?
                """, status, errorCode, message, id);
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void requeue(UUID id, int attemptCount, Instant runAfter, String errorCode, String message) {
        jdbc.update("""
                UPDATE content_translation_jobs
                SET status = 'PENDING', attempt_count = ?, run_after = ?, error_code = ?, error_message = ?,
                    lease_owner = NULL, lease_until = NULL, updated_at = NOW()
                WHERE id = ?
                """, attemptCount, Timestamp.from(runAfter), errorCode, message, id);
    }

    @Override
    public void updateAttemptCount(UUID id, int attemptCount) {
        jdbc.update("UPDATE content_translation_jobs SET attempt_count = ?, updated_at = NOW() WHERE id = ?",
                attemptCount, id);
    }

    @Override
    public int countUserJobsSince(UUID userId, Instant since) {
        return count("SELECT COUNT(*) FROM content_translation_jobs WHERE requested_by = ? AND created_at >= ?",
                userId, Timestamp.from(since));
    }

    @Override
    public int countAnonymousJobsSince(Instant since) {
        Integer value = jdbc.queryForObject(
                "SELECT COUNT(*) FROM content_translation_jobs WHERE requested_by IS NULL AND created_at >= ?",
                Integer.class, Timestamp.from(since));
        return value == null ? 0 : value;
    }

    @Override
    public int countAgencyJobsSince(UUID agencyId, Instant since) {
        return count("SELECT COUNT(*) FROM content_translation_jobs WHERE agency_id = ? AND created_at >= ?",
                agencyId, Timestamp.from(since));
    }

    @Override
    public int countGlobalJobsSince(Instant since) {
        Integer value = jdbc.queryForObject(
                "SELECT COUNT(*) FROM content_translation_jobs WHERE created_at >= ?",
                Integer.class, Timestamp.from(since));
        return value == null ? 0 : value;
    }

    @Override
    public long sumUserCostSince(UUID userId, Instant since) {
        return sum("""
                SELECT COALESCE(SUM(estimated_cost_micro_usd), 0) FROM content_translation_attempts
                WHERE requested_by = ? AND started_at >= ?
                """, userId, Timestamp.from(since));
    }

    @Override
    public long sumAgencyCostSince(UUID agencyId, Instant since) {
        return sum("""
                SELECT COALESCE(SUM(estimated_cost_micro_usd), 0) FROM content_translation_attempts
                WHERE agency_id = ? AND started_at >= ?
                """, agencyId, Timestamp.from(since));
    }

    @Override
    public long sumGlobalCostSince(Instant since) {
        Long value = jdbc.queryForObject(
                "SELECT COALESCE(SUM(estimated_cost_micro_usd), 0) FROM content_translation_attempts WHERE started_at >= ?",
                Long.class, Timestamp.from(since));
        return value == null ? 0L : value;
    }

    @Override
    public long sumGlobalBilledCharactersSince(Instant since) {
        Long value = jdbc.queryForObject(
                "SELECT COALESCE(SUM(billed_characters), 0) FROM content_translation_attempts WHERE started_at >= ?",
                Long.class, Timestamp.from(since));
        return value == null ? 0L : value;
    }

    private Optional<StoredJob> oneJob(String sql, Object... args) {
        return jdbc.query(sql, jobMapper(), args).stream().findFirst();
    }

    private int count(String sql, Object id, Timestamp since) {
        Integer value = jdbc.queryForObject(sql, Integer.class, id, since);
        return value == null ? 0 : value;
    }

    private long sum(String sql, Object id, Timestamp since) {
        Long value = jdbc.queryForObject(sql, Long.class, id, since);
        return value == null ? 0L : value;
    }

    private static RowMapper<StoredTranslation> translationMapper() {
        return (rs, n) -> new StoredTranslation(
                rs.getString("content_type"),
                rs.getObject("content_id", UUID.class),
                rs.getString("locale"),
                rs.getString("source_locale"),
                rs.getString("source_hash"),
                (Long) rs.getObject("source_revision"),
                rs.getString("body"),
                rs.getString("status"),
                rs.getBoolean("stale"),
                rs.getString("provider"),
                rs.getString("origin"),
                rs.getBoolean("manually_edited"),
                rs.getLong("row_version"),
                rs.getString("error_code"),
                rs.getString("error_message"));
    }

    private static RowMapper<StoredJob> jobMapper() {
        return (rs, n) -> mapJob(rs);
    }

    private static StoredJob mapJob(ResultSet rs) throws SQLException {
        return new StoredJob(
                rs.getObject("id", UUID.class),
                rs.getString("content_type"),
                rs.getObject("content_id", UUID.class),
                rs.getString("locale"),
                rs.getString("source_hash"),
                rs.getObject("requested_by", UUID.class),
                rs.getObject("agency_id", UUID.class),
                rs.getString("status"),
                rs.getInt("attempt_count"),
                rs.getInt("max_attempts"),
                rs.getBoolean("force"),
                rs.getString("error_code"));
    }

}
