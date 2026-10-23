package com.audition.platform.application.i18n;

import com.audition.platform.api.dto.AuditionTranslationView;
import com.audition.platform.api.dto.TranslationProviderStatusView;
import com.audition.platform.application.i18n.translation.TranslationDraft;
import com.audition.platform.application.i18n.translation.TranslationDraftValidator;
import com.audition.platform.application.i18n.translation.TranslationProvider;
import com.audition.platform.application.i18n.translation.TranslationProviderException;
import com.audition.platform.application.i18n.translation.TranslationSource;
import com.audition.platform.domain.audition.Audition;
import com.audition.platform.domain.audition.AuditionRepository;
import com.audition.platform.domain.audition.AuditionTranslation;
import com.audition.platform.domain.audition.AuditionTranslationAttempt;
import com.audition.platform.domain.audition.AuditionTranslationId;
import com.audition.platform.domain.audition.AuditionTranslationRepository;
import com.audition.platform.infra.SecurityUtils;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuditionAutoTranslationService {

    private final AuditionRepository auditionRepository;
    private final AuditionTranslationRepository translationRepository;
    private final TranslationProvider translationProvider;
    private final TranslationAttemptRecorder attemptRecorder;

    public AuditionAutoTranslationService(
            AuditionRepository auditionRepository,
            AuditionTranslationRepository translationRepository,
            TranslationProvider translationProvider,
            TranslationAttemptRecorder attemptRecorder) {
        this.auditionRepository = auditionRepository;
        this.translationRepository = translationRepository;
        this.translationProvider = translationProvider;
        this.attemptRecorder = attemptRecorder;
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
        AuditionTranslationId id = new AuditionTranslationId(audition.getId(), locale);
        Optional<AuditionTranslation> existing = translationRepository.findById(id);
        if (existing.isPresent() && isProtected(existing.get()) && !force) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "TRANSLATION_PROTECTED");
        }
        Long seenVersion = existing.map(AuditionTranslation::getRowVersion).orElse(null);
        UUID attemptId = attemptRecorder.start(audition.getId(), locale, translationProvider.providerId());
        TranslationSource source = TranslationSource.fromAudition(audition);
        try {
            TranslationDraft draft = translationProvider.translate(source, locale);
            TranslationDraftValidator.validate(source, draft);
            applyIfCurrent(audition, locale, existing.isPresent(), seenVersion, draft);
            return toView(audition.getId(), locale, attemptRecorder.finish(attemptId, AuditionTranslation.STATUS_COMPLETED, null, null));
        } catch (TranslationConflictException ex) {
            AuditionTranslationAttempt attempt = attemptRecorder.finish(
                    attemptId,
                    AuditionTranslation.STATUS_FAILED,
                    AuditionTranslation.ERROR_CONCURRENT_EDIT,
                    "번역 저장이 다른 수정과 겹쳤습니다. 다시 시도할 수 있습니다.");
            if (ex.propagate()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "TRANSLATION_CONFLICT");
            }
            return toView(audition.getId(), locale, attempt);
        } catch (TranslationProviderException ex) {
            return toView(audition.getId(), locale, attemptRecorder.finish(
                    attemptId,
                    AuditionTranslation.STATUS_FAILED,
                    ex.getErrorCode(),
                    publicError(ex.getMessage())));
        } catch (RuntimeException ex) {
            return toView(audition.getId(), locale, attemptRecorder.finish(
                    attemptId,
                    AuditionTranslation.STATUS_FAILED,
                    AuditionTranslation.ERROR_PROVIDER,
                    publicError("번역 작업이 실패했습니다.")));
        }
    }

    private void applyIfCurrent(
            Audition audition,
            String locale,
            boolean existed,
            Long seenVersion,
            TranslationDraft draft) {
        AuditionTranslationId id = new AuditionTranslationId(audition.getId(), locale);
        if (!existed) {
            AuditionTranslation created = newAutoRow(audition.getId(), locale);
            copyDraft(created, audition, draft);
            try {
                translationRepository.saveAndFlush(created);
            } catch (DataIntegrityViolationException | OptimisticLockingFailureException ex) {
                throw new TranslationConflictException(true);
            }
            return;
        }
        AuditionTranslation current = translationRepository.findById(id).orElse(null);
        if (current == null || !Objects.equals(current.getRowVersion(), seenVersion)) {
            throw new TranslationConflictException(false);
        }
        FieldSnapshot snapshot = FieldSnapshot.capture(current);
        copyDraft(current, audition, draft);
        try {
            translationRepository.saveAndFlush(current);
        } catch (DataIntegrityViolationException | OptimisticLockingFailureException ex) {
            snapshot.restore(current);
            throw new TranslationConflictException(true);
        }
    }

    private AuditionTranslationView toView(UUID auditionId, String locale, AuditionTranslationAttempt attempt) {
        AuditionTranslation row = translationRepository.findById(new AuditionTranslationId(auditionId, locale)).orElse(null);
        AuditionTranslationView view = row == null ? emptyView(auditionId, locale, attempt) : AuditionTranslationMapper.toView(row);
        AuditionTranslationMapper.attachAttempt(view, attempt);
        return view;
    }

    private static AuditionTranslationView emptyView(UUID auditionId, String locale, AuditionTranslationAttempt attempt) {
        AuditionTranslationView view = new AuditionTranslationView();
        view.setAuditionId(auditionId);
        view.setLocale(locale);
        view.setTitle("");
        view.setDescription("");
        view.setLocation("");
        view.setAgencyName("");
        view.setRecruitFields(new String[0]);
        view.setQualifications(new String[0]);
        view.setSchedules(new String[0]);
        view.setBenefits(new String[0]);
        view.setStatus(attempt == null ? AuditionTranslation.STATUS_FAILED : attempt.getStatus());
        view.setProvider("");
        view.setOrigin("");
        return view;
    }

    private static AuditionTranslation newAutoRow(UUID auditionId, String locale) {
        Instant now = Instant.now();
        AuditionTranslation created = new AuditionTranslation();
        created.setAuditionId(auditionId);
        created.setLocale(locale);
        created.setCreatedAt(now);
        created.setProvider(AuditionTranslation.PROVIDER_MANUAL);
        created.setOrigin(AuditionTranslation.ORIGIN_MANUAL);
        created.setManuallyEdited(false);
        created.setStatus(AuditionTranslation.STATUS_PENDING);
        return created;
    }

    private void copyDraft(AuditionTranslation row, Audition audition, TranslationDraft draft) {
        row.setTitle(draft.title() == null ? "" : draft.title().trim());
        row.setDescription(nullToEmpty(draft.description()));
        row.setLocation(nullToEmpty(draft.location()));
        row.setAgencyName(nullToEmpty(draft.agencyName()));
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

    private static String nullToEmpty(String value) {
        return value == null ? "" : value;
    }

    private static String[] toArray(List<String> values) {
        if (values == null || values.isEmpty()) {
            return new String[0];
        }
        return values.toArray(String[]::new);
    }

    private static final class TranslationConflictException extends RuntimeException {
        private final boolean propagate;

        private TranslationConflictException(boolean propagate) {
            this.propagate = propagate;
        }

        private boolean propagate() {
            return propagate;
        }
    }

    private record FieldSnapshot(
            String title,
            String description,
            String location,
            String agencyName,
            String[] recruitFields,
            String[] qualifications,
            String[] schedules,
            String[] benefits,
            String status,
            String provider,
            String origin,
            boolean manuallyEdited,
            boolean stale,
            String errorCode,
            String errorMessage,
            String sourceHash,
            Long sourceRevision) {

        private static FieldSnapshot capture(AuditionTranslation row) {
            return new FieldSnapshot(
                    row.getTitle(),
                    row.getDescription(),
                    row.getLocation(),
                    row.getAgencyName(),
                    row.getRecruitFields(),
                    row.getQualifications(),
                    row.getSchedules(),
                    row.getBenefits(),
                    row.getStatus(),
                    row.getProvider(),
                    row.getOrigin(),
                    row.isManuallyEdited(),
                    row.isStale(),
                    row.getErrorCode(),
                    row.getErrorMessage(),
                    row.getSourceHash(),
                    row.getSourceRevision());
        }

        private void restore(AuditionTranslation row) {
            row.setTitle(title);
            row.setDescription(description);
            row.setLocation(location);
            row.setAgencyName(agencyName);
            row.setRecruitFields(recruitFields);
            row.setQualifications(qualifications);
            row.setSchedules(schedules);
            row.setBenefits(benefits);
            row.setStatus(status);
            row.setProvider(provider);
            row.setOrigin(origin);
            row.setManuallyEdited(manuallyEdited);
            row.setStale(stale);
            row.setErrorCode(errorCode);
            row.setErrorMessage(errorMessage);
            row.setSourceHash(sourceHash);
            row.setSourceRevision(sourceRevision);
        }
    }
}
