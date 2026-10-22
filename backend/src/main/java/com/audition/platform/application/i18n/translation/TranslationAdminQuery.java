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
import java.util.List;

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
}
