package com.audition.platform.application.i18n.translation;

import com.audition.platform.domain.audition.Audition;

import java.util.Arrays;
import java.util.List;

/** 자동 번역이 읽는 원문. 번역 행은 읽지 않는다. */
public record TranslationSource(
        String sourceLocale,
        String title,
        String description,
        String location,
        String agencyName,
        List<String> recruitFields,
        List<String> qualifications,
        List<String> schedules,
        List<String> benefits) {

    public static TranslationSource fromAudition(Audition audition) {
        return new TranslationSource(
                audition.getDefaultLocale(),
                text(audition.getTitle()),
                text(audition.getDescription()),
                text(audition.getLocation()),
                text(audition.getAgencyName()),
                list(audition.getRecruitFields()),
                list(audition.getQualifications()),
                list(audition.getSchedules()),
                list(audition.getBenefits()));
    }

    private static String text(String raw) {
        return raw == null ? "" : raw;
    }

    private static List<String> list(String[] values) {
        if (values == null || values.length == 0) {
            return List.of();
        }
        return Arrays.stream(values).map(TranslationSource::text).toList();
    }
}
