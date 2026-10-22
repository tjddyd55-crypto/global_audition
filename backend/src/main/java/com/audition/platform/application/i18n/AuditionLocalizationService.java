package com.audition.platform.application.i18n;

import com.audition.platform.api.dto.AuditionResponse;
import com.audition.platform.api.dto.AuditionTranslationUpsertRequest;
import com.audition.platform.api.dto.AuditionTranslationView;
import com.audition.platform.application.audition.AuditionSeriesPresentation;
import com.audition.platform.domain.audition.Audition;
import com.audition.platform.domain.audition.AuditionRepository;
import com.audition.platform.domain.audition.AuditionTranslation;
import com.audition.platform.domain.audition.AuditionTranslationAttemptRepository;
import com.audition.platform.domain.audition.AuditionTranslationId;
import com.audition.platform.domain.audition.AuditionTranslationRepository;
import com.audition.platform.infra.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class AuditionLocalizationService {

    private final AuditionTranslationRepository translationRepository;
    private final AuditionRepository auditionRepository;
    private final ContentLocaleResolver contentLocaleResolver;
    private final AuditionTranslationAttemptRepository attemptRepository;

    public AuditionLocalizationService(
            AuditionTranslationRepository translationRepository,
            AuditionRepository auditionRepository,
            ContentLocaleResolver contentLocaleResolver,
            AuditionTranslationAttemptRepository attemptRepository) {
        this.translationRepository = translationRepository;
        this.auditionRepository = auditionRepository;
        this.contentLocaleResolver = contentLocaleResolver;
        this.attemptRepository = attemptRepository;
    }

    public void apply(Audition audition, AuditionResponse response) {
        apply(audition, response, contentLocaleResolver.resolve());
    }

    public void apply(Audition audition, AuditionResponse response, String requestedRaw) {
        applyOverlay(audition, response, requestedRaw, false);
    }

    public void applyPreview(Audition audition, AuditionResponse response, String requestedRaw) {
        applyOverlay(audition, response, requestedRaw, true);
        response.setPreview(true);
    }

    /**
     * 원문 해시가 바뀌면 번역 행을 지우지 않고 stale 로만 표시한다.
     * 해시가 아직 없으면 이번 저장을 기준선으로 삼고, 번역 가능 필드가 포함된 저장이면 stale 로 표시한다.
     */
    @Transactional
    public void onSourceWritten(Audition audition, boolean translatableFieldsPresent) {
        String hash = AuditionSourceFingerprint.hash(audition);
        String previous = audition.getContentSourceHash();
        if (previous == null) {
            audition.setContentSourceHash(hash);
            if (audition.getContentRevision() < 1) {
                audition.setContentRevision(1);
            }
            if (translatableFieldsPresent) {
                markRowsStale(audition.getId());
            }
            return;
        }
        if (hash.equals(previous)) {
            return;
        }
        audition.setContentSourceHash(hash);
        audition.setContentRevision(audition.getContentRevision() + 1);
        markRowsStale(audition.getId());
    }

    private void applyOverlay(Audition audition, AuditionResponse response, String requestedRaw, boolean preview) {
        String original = authoringLocale(audition);
        String requested = viewingLocale(requestedRaw, original);
        response.setDefaultLocale(original);
        response.setContentLocale(original);
        response.setContentLocaleFallback(false);
        response.setShowingOriginal(false);
        response.setPreview(preview);
        response.setApplyBlockedCode(response.getApplyBlockedMessage() == null
                ? null
                : AuditionSeriesPresentation.APPLY_BLOCKED_PREV_ROUND_NOT_ACCEPTED_CODE);

        if (requested.equals(original)) {
            response.setShowingOriginal(true);
            finishLabels(audition, response);
            return;
        }

        AuditionTranslation row = translationRepository
                .findByAuditionIdAndLocale(audition.getId(), requested)
                .orElse(null);
        if (canOverlay(row, preview)) {
            overlay(response, row);
            response.setContentLocale(requested);
            describeRow(audition, response, row);
        } else {
            response.setContentLocaleFallback(true);
            response.setShowingOriginal(true);
            if (row != null) {
                describeRow(audition, response, row);
            }
        }
        finishLabels(audition, response);
    }

    @Transactional(readOnly = true)
    public List<AuditionTranslationView> list(UUID auditionId) {
        requireOwnerOrAdmin(auditionId);
        return translationRepository.findByAuditionIdOrderByLocaleAsc(auditionId).stream()
                .map(row -> {
                    AuditionTranslationView view = AuditionTranslationMapper.toView(row);
                    if (attemptRepository != null) {
                        var latest = attemptRepository
                                .findFirstByAuditionIdAndLocaleOrderByStartedAtDesc(row.getAuditionId(), row.getLocale());
                        if (latest != null) {
                            latest.ifPresent(attempt -> AuditionTranslationMapper.attachAttempt(view, attempt));
                        }
                    }
                    return view;
                })
                .toList();
    }

    @Transactional
    public AuditionTranslationView upsert(UUID auditionId, String localeRaw, AuditionTranslationUpsertRequest body) {
        requireOwnerOrAdmin(auditionId);
        if (!ContentLocales.isSupported(localeRaw)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "지원하지 않는 locale입니다.");
        }
        String locale = ContentLocales.normalize(localeRaw);
        if (body.getTitle() == null || body.getTitle().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "번역 제목은 필수입니다.");
        }
        Audition audition = auditionRepository.findById(auditionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Audition not found"));
        Instant now = Instant.now();
        AuditionTranslation row = translationRepository
                .findById(new AuditionTranslationId(auditionId, locale))
                .orElseGet(() -> {
                    AuditionTranslation created = new AuditionTranslation();
                    created.setAuditionId(auditionId);
                    created.setLocale(locale);
                    created.setCreatedAt(now);
                    created.setProvider(AuditionTranslation.PROVIDER_MANUAL);
                    return created;
                });
        row.setTitle(body.getTitle().trim());
        row.setDescription(nullToEmpty(body.getDescription()));
        row.setLocation(nullToEmpty(body.getLocation()));
        row.setAgencyName(nullToEmpty(body.getAgencyName()));
        row.setRecruitFields(toArray(body.getRecruitFields()));
        row.setQualifications(toArray(body.getQualifications()));
        row.setSchedules(toArray(body.getSchedules()));
        row.setBenefits(toArray(body.getBenefits()));
        row.setStatus(AuditionTranslation.STATUS_COMPLETED);
        row.setProvider(AuditionTranslation.PROVIDER_MANUAL);
        row.setOrigin(AuditionTranslation.ORIGIN_MANUAL);
        row.setManuallyEdited(true);
        row.setStale(false);
        row.setErrorCode(null);
        row.setErrorMessage(null);
        row.setSourceHash(AuditionSourceFingerprint.hash(audition));
        row.setSourceRevision(audition.getContentRevision());
        row.setUpdatedAt(now);
        return AuditionTranslationMapper.toView(translationRepository.save(row));
    }

    private void requireOwnerOrAdmin(UUID auditionId) {
        UUID userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        Audition audition = auditionRepository.findById(auditionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Audition not found"));
        if (!SecurityUtils.hasRole("ADMIN") && !SecurityUtils.hasRole("SUPER_ADMIN")
                && !audition.getOwnerId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only owner or ADMIN can manage translations");
        }
    }

    private static void overlay(AuditionResponse response, AuditionTranslation row) {
        response.setTitle(row.getTitle());
        response.setDescription(safeText(row.getDescription()));
        response.setLocation(safeText(row.getLocation()));
        response.setAgencyName(safeText(row.getAgencyName()));
        response.setRecruitFields(row.getRecruitFields() != null ? row.getRecruitFields() : new String[0]);
        response.setQualifications(row.getQualifications() != null ? row.getQualifications() : new String[0]);
        response.setSchedules(row.getSchedules() != null ? row.getSchedules() : new String[0]);
        response.setBenefits(row.getBenefits() != null ? row.getBenefits() : new String[0]);
    }

    private static String safeText(String raw) {
        return raw == null ? "" : raw;
    }

    private void markRowsStale(UUID auditionId) {
        Instant now = Instant.now();
        List<AuditionTranslation> rows = translationRepository.findByAuditionIdOrderByLocaleAsc(auditionId);
        for (AuditionTranslation row : rows) {
            row.setStale(true);
            row.setUpdatedAt(now);
        }
        if (!rows.isEmpty()) {
            translationRepository.saveAll(rows);
        }
    }

    private static boolean canOverlay(AuditionTranslation row, boolean preview) {
        if (row == null || row.getTitle() == null || row.getTitle().isBlank()) {
            return false;
        }
        if (preview) {
            return true;
        }
        return AuditionTranslation.STATUS_COMPLETED.equals(row.getStatus());
    }

    private static void describeRow(Audition audition, AuditionResponse response, AuditionTranslation row) {
        response.setTranslationStatus(row.getStatus());
        response.setTranslationErrorCode(row.getErrorCode());
        response.setTranslationOrigin(row.getOrigin());
        boolean hashMismatch = row.getSourceHash() != null && !AuditionSourceFingerprint.matches(audition, row.getSourceHash());
        response.setTranslationStale(row.isStale() || hashMismatch);
    }

    private static void finishLabels(Audition audition, AuditionResponse response) {
        response.setDisplayTitle(AuditionSeriesPresentation.displayTitle(
                response.getTitle(), audition.getSeriesRound(), response.getContentLocale()));
        response.setRecruitmentRoundLabel(AuditionSeriesPresentation.recruitmentRoundLabel(
                audition.getStatus(), audition.getSeriesRound(), response.getContentLocale()));
        if (response.getApplyBlockedMessage() != null) {
            response.setApplyBlockedMessage(
                    AuditionSeriesPresentation.applyBlockedMessage(response.getContentLocale()));
        }
    }

    private static String authoringLocale(Audition audition) {
        String tag = ContentLocales.canonicalTag(audition.getDefaultLocale());
        return tag.isEmpty() ? ContentLocales.DEFAULT : tag;
    }

    private static String viewingLocale(String requestedRaw, String original) {
        String requestedTag = ContentLocales.canonicalTag(requestedRaw);
        if (!requestedTag.isEmpty() && requestedTag.equals(original)) {
            return original;
        }
        if (ContentLocales.isSupported(requestedRaw)) {
            return ContentLocales.normalize(requestedRaw);
        }
        return requestedTag.isEmpty() ? ContentLocales.DEFAULT : requestedTag;
    }

    private static String nullToEmpty(String raw) {
        return raw == null ? "" : raw.trim();
    }

    private static String[] toArray(List<String> values) {
        if (values == null || values.isEmpty()) {
            return new String[0];
        }
        return values.stream().filter(v -> v != null && !v.isBlank()).map(String::trim).toArray(String[]::new);
    }
}
