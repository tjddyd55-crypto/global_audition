package com.audition.platform.application.i18n;

import com.audition.platform.api.dto.AuditionTranslationView;
import com.audition.platform.api.dto.TranslationProviderStatusView;
import com.audition.platform.application.i18n.translation.TranslationDraft;
import com.audition.platform.application.i18n.translation.TranslationProvider;
import com.audition.platform.application.i18n.translation.TranslationProviderException;
import com.audition.platform.application.i18n.translation.TranslationSource;
import com.audition.platform.domain.audition.Audition;
import com.audition.platform.domain.audition.AuditionRepository;
import com.audition.platform.domain.audition.AuditionTranslation;
import com.audition.platform.domain.audition.AuditionTranslationId;
import com.audition.platform.domain.audition.AuditionTranslationRepository;
import com.audition.platform.infra.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class AuditionAutoTranslationService {

    private final AuditionRepository auditionRepository;
    private final AuditionTranslationRepository translationRepository;
    private final TranslationProvider translationProvider;

    public AuditionAutoTranslationService(
            AuditionRepository auditionRepository,
            AuditionTranslationRepository translationRepository,
            TranslationProvider translationProvider) {
        this.auditionRepository = auditionRepository;
        this.translationRepository = translationRepository;
        this.translationProvider = translationProvider;
    }

    @Transactional(readOnly = true)
    public TranslationProviderStatusView providerStatus(UUID auditionId) {
        requireOwnerOrAdmin(load(auditionId));
        String state = translationProvider.isConfigured() ? "CONFIGURED" : AuditionTranslation.ERROR_NOT_CONFIGURED;
        return new TranslationProviderStatusView(translationProvider.providerId(), state);
    }

    @Transactional
    public List<AuditionTranslationView> translateAll(UUID auditionId, boolean force) {
        Audition audition = load(auditionId);
        requireOwnerOrAdmin(audition);
        List<AuditionTranslationView> views = new ArrayList<>();
        for (String locale : ContentLocales.SUPPORTED) {
            if (locale.equals(authoringLocale(audition))) {
                continue;
            }
            views.add(translateOne(audition, locale, force));
        }
        return views;
    }

    @Transactional
    public AuditionTranslationView translateLocale(UUID auditionId, String localeRaw, boolean force) {
        Audition audition = load(auditionId);
        requireOwnerOrAdmin(audition);
        if (!ContentLocales.isSupported(localeRaw)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "지원하지 않는 locale입니다.");
        }
        String locale = ContentLocales.normalize(localeRaw);
        if (locale.equals(authoringLocale(audition))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "원문 언어는 자동 번역 대상이 아닙니다.");
        }
        return translateOne(audition, locale, force);
    }

    private AuditionTranslationView translateOne(Audition audition, String locale, boolean force) {
        AuditionTranslation row = loadOrCreate(audition.getId(), locale);
        if (isProtected(row) && !force) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "TRANSLATION_PROTECTED");
        }
        markPending(row);
        translationRepository.saveAndFlush(row);
        try {
            TranslationDraft draft = translationProvider.translate(TranslationSource.fromAudition(audition), locale);
            applyDraft(row, audition, draft);
        } catch (TranslationProviderException ex) {
            markFailed(row, ex);
        } catch (RuntimeException ex) {
            markFailed(row, new TranslationProviderException(
                    AuditionTranslation.ERROR_PROVIDER,
                    "번역 작업이 실패했습니다."));
        }
        return AuditionTranslationMapper.toView(translationRepository.save(row));
    }

    private AuditionTranslation loadOrCreate(UUID auditionId, String locale) {
        return translationRepository.findById(new AuditionTranslationId(auditionId, locale))
                .orElseGet(() -> newAutoRow(auditionId, locale));
    }

    private static AuditionTranslation newAutoRow(UUID auditionId, String locale) {
        Instant now = Instant.now();
        AuditionTranslation created = new AuditionTranslation();
        created.setAuditionId(auditionId);
        created.setLocale(locale);
        created.setCreatedAt(now);
        created.setOrigin(AuditionTranslation.ORIGIN_AUTO);
        created.setProvider(AuditionTranslation.PROVIDER_MANUAL);
        created.setManuallyEdited(false);
        return created;
    }

    private void markPending(AuditionTranslation row) {
        row.setStatus(AuditionTranslation.STATUS_PENDING);
        row.setErrorCode(null);
        row.setErrorMessage(null);
        row.setUpdatedAt(Instant.now());
        if (!isProtected(row)) {
            row.setOrigin(AuditionTranslation.ORIGIN_AUTO);
        }
    }

    private void applyDraft(AuditionTranslation row, Audition audition, TranslationDraft draft) {
        row.setTitle(draft.title().trim());
        row.setDescription(draft.description());
        row.setLocation(draft.location());
        row.setAgencyName(draft.agencyName());
        row.setRecruitFields(toArray(draft.recruitFields()));
        row.setQualifications(toArray(draft.qualifications()));
        row.setSchedules(toArray(draft.schedules()));
        row.setBenefits(toArray(draft.benefits()));
        row.setStatus(AuditionTranslation.STATUS_COMPLETED);
        row.setProvider(translationProvider.providerId());
        row.setOrigin(AuditionTranslation.ORIGIN_AUTO);
        row.setManuallyEdited(false);
        row.setStale(false);
        row.setErrorCode(null);
        row.setErrorMessage(null);
        row.setSourceHash(AuditionSourceFingerprint.hash(audition));
        row.setSourceRevision(audition.getContentRevision());
        row.setUpdatedAt(Instant.now());
    }

    private void markFailed(AuditionTranslation row, TranslationProviderException ex) {
        row.setStatus(AuditionTranslation.STATUS_FAILED);
        row.setProvider(translationProvider.providerId());
        row.setOrigin(AuditionTranslation.ORIGIN_AUTO);
        row.setErrorCode(ex.getErrorCode());
        row.setErrorMessage(publicError(ex.getMessage()));
        row.setUpdatedAt(Instant.now());
    }

    static boolean isProtected(AuditionTranslation row) {
        return row.isManuallyEdited() || AuditionTranslation.ORIGIN_MANUAL.equals(row.getOrigin());
    }

    private Audition load(UUID auditionId) {
        return auditionRepository.findById(auditionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Audition not found"));
    }

    private void requireOwnerOrAdmin(Audition audition) {
        UUID userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        if (!SecurityUtils.hasRole("ADMIN") && !SecurityUtils.hasRole("SUPER_ADMIN")
                && !audition.getOwnerId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only owner or ADMIN can manage translations");
        }
    }

    private static String authoringLocale(Audition audition) {
        String tag = ContentLocales.canonicalTag(audition.getDefaultLocale());
        return tag.isEmpty() ? ContentLocales.DEFAULT : tag;
    }

    private static String publicError(String raw) {
        if (raw == null || raw.isBlank()) {
            return "번역에 실패했습니다.";
        }
        String cleaned = raw.replaceAll("(?i)bearer\\s+\\S+", "bearer [redacted]")
                .replaceAll("(?i)sk-[A-Za-z0-9_\\-]+", "[redacted]");
        return cleaned.length() > 300 ? cleaned.substring(0, 300) : cleaned;
    }

    private static String[] toArray(List<String> values) {
        if (values == null || values.isEmpty()) {
            return new String[0];
        }
        return values.toArray(String[]::new);
    }
}
