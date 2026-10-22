package com.audition.platform.application.i18n;

import com.audition.platform.api.dto.AuditionTranslationView;
import com.audition.platform.domain.audition.AuditionTranslation;
import com.audition.platform.domain.audition.AuditionTranslationAttempt;

public final class AuditionTranslationMapper {

    private AuditionTranslationMapper() {
    }

    public static AuditionTranslationView toView(AuditionTranslation row) {
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
        view.setErrorCode(row.getErrorCode());
        view.setErrorMessage(row.getErrorMessage());
        view.setSourceHash(row.getSourceHash());
        view.setSourceRevision(row.getSourceRevision());
        view.setOrigin(row.getOrigin());
        view.setManuallyEdited(row.isManuallyEdited());
        view.setStale(row.isStale());
        view.setUpdatedAt(row.getUpdatedAt());
        return view;
    }

    public static void attachAttempt(AuditionTranslationView view, AuditionTranslationAttempt attempt) {
        if (view == null || attempt == null) {
            return;
        }
        view.setAttemptStatus(attempt.getStatus());
        view.setAttemptErrorCode(attempt.getErrorCode());
        view.setAttemptErrorMessage(attempt.getErrorMessage());
    }
}
