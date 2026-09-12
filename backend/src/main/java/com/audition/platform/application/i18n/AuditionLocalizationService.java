package com.audition.platform.application.i18n;

import com.audition.platform.api.dto.AuditionResponse;
import com.audition.platform.api.dto.AuditionTranslationUpsertRequest;
import com.audition.platform.api.dto.AuditionTranslationView;
import com.audition.platform.application.audition.AuditionSeriesPresentation;
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
import java.util.List;
import java.util.UUID;

@Service
public class AuditionLocalizationService {

    private final AuditionTranslationRepository translationRepository;
    private final AuditionRepository auditionRepository;
    private final ContentLocaleResolver contentLocaleResolver;

    public AuditionLocalizationService(
            AuditionTranslationRepository translationRepository,
            AuditionRepository auditionRepository,
            ContentLocaleResolver contentLocaleResolver) {
        this.translationRepository = translationRepository;
        this.auditionRepository = auditionRepository;
        this.contentLocaleResolver = contentLocaleResolver;
    }

    public void apply(Audition audition, AuditionResponse response) {
        apply(audition, response, contentLocaleResolver.resolve());
    }

    public void apply(Audition audition, AuditionResponse response, String requestedRaw) {
        String original = ContentLocales.normalize(audition.getDefaultLocale());
        String requested = ContentLocales.normalize(requestedRaw);
        response.setDefaultLocale(original);
        response.setContentLocale(original);
        response.setContentLocaleFallback(false);
        response.setApplyBlockedCode(response.getApplyBlockedMessage() == null
                ? null
                : AuditionSeriesPresentation.APPLY_BLOCKED_PREV_ROUND_NOT_ACCEPTED_CODE);

        if (!requested.equals(original)) {
            AuditionTranslation row = translationRepository
                    .findByAuditionIdAndLocale(audition.getId(), requested)
                    .orElse(null);
            if (row != null
                    && AuditionTranslation.STATUS_COMPLETED.equals(row.getStatus())
                    && row.getTitle() != null
                    && !row.getTitle().isBlank()) {
                overlay(response, row);
                response.setContentLocale(requested);
            } else {
                response.setContentLocaleFallback(true);
            }
        }

        response.setDisplayTitle(AuditionSeriesPresentation.displayTitle(
                response.getTitle(), audition.getSeriesRound(), response.getContentLocale()));
        response.setRecruitmentRoundLabel(AuditionSeriesPresentation.recruitmentRoundLabel(
                audition.getStatus(), audition.getSeriesRound(), response.getContentLocale()));
        if (response.getApplyBlockedMessage() != null) {
            response.setApplyBlockedMessage(
                    AuditionSeriesPresentation.applyBlockedMessage(response.getContentLocale()));
        }
    }

    @Transactional(readOnly = true)
    public List<AuditionTranslationView> list(UUID auditionId) {
        requireOwnerOrAdmin(auditionId);
        return translationRepository.findByAuditionIdOrderByLocaleAsc(auditionId).stream()
                .map(AuditionLocalizationService::toView)
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
        row.setUpdatedAt(now);
        return toView(translationRepository.save(row));
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

    private static AuditionTranslationView toView(AuditionTranslation row) {
        AuditionTranslationView view = new AuditionTranslationView();
        view.setAuditionId(row.getAuditionId());
        view.setLocale(row.getLocale());
        view.setTitle(row.getTitle());
        view.setDescription(row.getDescription());
        view.setLocation(row.getLocation());
        view.setAgencyName(row.getAgencyName());
        view.setRecruitFields(row.getRecruitFields());
        view.setQualifications(row.getQualifications());
        view.setSchedules(row.getSchedules());
        view.setBenefits(row.getBenefits());
        view.setStatus(row.getStatus());
        view.setProvider(row.getProvider());
        view.setUpdatedAt(row.getUpdatedAt());
        return view;
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
