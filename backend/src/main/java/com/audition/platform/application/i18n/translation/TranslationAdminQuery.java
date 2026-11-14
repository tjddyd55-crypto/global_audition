package com.audition.platform.application.i18n.translation;

import com.audition.platform.api.dto.TranslationErrorView;
import com.audition.platform.api.dto.TranslationPolicyView;
import com.audition.platform.application.credit.SuperAdminAuthHelper;
import com.audition.platform.application.i18n.LocaleRegistry;
import com.audition.platform.application.i18n.content.TranslationQueueProperties;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class TranslationAdminQuery {

    private final LocaleRegistry locales;
    private final TranslationQueueProperties queue;
    private final JdbcTemplate jdbc;

    public TranslationAdminQuery(LocaleRegistry locales, TranslationQueueProperties queue, JdbcTemplate jdbc) {
        this.locales = locales;
        this.queue = queue;
        this.jdbc = jdbc;
    }

    @Transactional(readOnly = true)
    public TranslationPolicyView policy() {
        SuperAdminAuthHelper.requireSuperAdmin();
        TranslationPolicyView view = new TranslationPolicyView();
        view.setViewingDefault(locales.viewingDefault());
        view.setAgencyUiLocale(locales.agencyUiLocale());
        view.setSuperAdminUiLocale(locales.superAdminUiLocale());
        view.setPublicSelector(locales.publicSelector());
        view.setUiLocales(locales.uiLocales());
        view.setActiveTranslationTargets(locales.activeTargets());
        view.setGlobalDailyCostMicroUsd(queue.getGlobalDailyCostMicroUsd());
        view.setGlobalMonthlyCostMicroUsd(queue.getGlobalMonthlyCostMicroUsd());
        view.setGlobalMonthlyBilledCharacters(queue.getGlobalMonthlyBilledCharacters());
        return view;
    }

    @Transactional(readOnly = true)
    public List<TranslationErrorView> recentErrors() {
        SuperAdminAuthHelper.requireSuperAdmin();
        return jdbc.query("""
                SELECT content_type, locale, status, error_code, started_at
                FROM content_translation_attempts
                WHERE status IN ('FAILED', 'BLOCKED')
                ORDER BY started_at DESC
                LIMIT 40
                """, (rs, row) -> {
            TranslationErrorView view = new TranslationErrorView();
            view.setContentType(rs.getString("content_type"));
            view.setLocale(rs.getString("locale"));
            view.setStatus(rs.getString("status"));
            view.setErrorCode(rs.getString("error_code"));
            Timestamp started = rs.getTimestamp("started_at");
            view.setStartedAt(started == null ? null : started.toInstant());
            return view;
        });
    }

    /** 번역 큐 상태. 상태별 건수, 미뤄진 PENDING(run_after 미래), 최근 실패 작업. */
    @Transactional(readOnly = true)
    public Map<String, Object> queueStatus() {
        SuperAdminAuthHelper.requireSuperAdmin();
        Map<String, Object> view = new LinkedHashMap<>();
        Map<String, Integer> byStatus = new LinkedHashMap<>();
        jdbc.query("SELECT status, COUNT(*) AS n FROM content_translation_jobs GROUP BY status ORDER BY status",
                rs -> {
                    byStatus.put(rs.getString("status"), rs.getInt("n"));
                });
        view.put("byStatus", byStatus);
        Integer deferred = jdbc.queryForObject("""
                SELECT COUNT(*) FROM content_translation_jobs
                WHERE status = 'PENDING' AND run_after IS NOT NULL AND run_after > NOW()
                """, Integer.class);
        view.put("deferredPending", deferred == null ? 0 : deferred);
        Map<String, Integer> deferredBy = new LinkedHashMap<>();
        jdbc.query("""
                SELECT COALESCE(error_code, 'NONE') AS code, COUNT(*) AS n FROM content_translation_jobs
                WHERE status = 'PENDING' AND run_after IS NOT NULL AND run_after > NOW()
                GROUP BY 1 ORDER BY 1
                """, rs -> {
            deferredBy.put(rs.getString("code"), rs.getInt("n"));
        });
        view.put("deferredBy", deferredBy);
        Timestamp oldest = jdbc.queryForObject(
                "SELECT MIN(created_at) FROM content_translation_jobs WHERE status IN ('PENDING', 'RUNNING')",
                Timestamp.class);
        view.put("oldestActiveCreatedAt", oldest == null ? null : oldest.toInstant().toString());
        List<Map<String, Object>> failed = jdbc.query("""
                SELECT id, content_type, content_id, locale, error_code, attempt_count, max_attempts, finished_at
                FROM content_translation_jobs
                WHERE status = 'FAILED'
                ORDER BY finished_at DESC NULLS LAST
                LIMIT 20
                """, (rs, n) -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", rs.getString("id"));
            row.put("contentType", rs.getString("content_type"));
            row.put("contentId", rs.getString("content_id"));
            row.put("locale", rs.getString("locale"));
            row.put("errorCode", rs.getString("error_code"));
            row.put("attemptCount", rs.getInt("attempt_count"));
            row.put("maxAttempts", rs.getInt("max_attempts"));
            Timestamp finished = rs.getTimestamp("finished_at");
            row.put("finishedAt", finished == null ? null : finished.toInstant().toString());
            return row;
        });
        view.put("recentFailed", failed);
        return view;
    }

    /**
     * 실패한 작업을 다시 PENDING 으로 돌린다. 키(콘텐츠·로케일)마다 가장 최근 실패만, 활성 작업이 없을 때만.
     * 수동 번역 보호와 예산은 워커가 실행 직전에 다시 본다.
     */
    @Transactional
    public Map<String, Object> retryFailed(int limit) {
        SuperAdminAuthHelper.requireSuperAdmin();
        int capped = Math.max(1, Math.min(limit, 200));
        int updated = jdbc.update("""
                UPDATE content_translation_jobs j
                SET status = 'PENDING', attempt_count = 0, run_after = NOW(), error_code = 'RETRY_REQUESTED',
                    error_message = NULL, lease_owner = NULL, lease_until = NULL, finished_at = NULL, updated_at = NOW()
                WHERE j.id IN (
                    SELECT f.id FROM (
                        SELECT DISTINCT ON (content_type, content_id, locale) id, content_type, content_id, locale, status
                        FROM content_translation_jobs
                        ORDER BY content_type, content_id, locale, created_at DESC
                    ) f
                    WHERE f.status = 'FAILED'
                      AND NOT EXISTS (
                          SELECT 1 FROM content_translation_jobs a
                          WHERE a.content_type = f.content_type AND a.content_id = f.content_id
                            AND a.locale = f.locale AND a.status IN ('PENDING', 'RUNNING'))
                    LIMIT ?
                )
                """, capped);
        Map<String, Object> view = new LinkedHashMap<>();
        view.put("requeued", updated);
        return view;
    }
}
