package com.audition.platform.application.i18n.translation;

import java.util.List;

/** 프로바이더가 반환한 번역 초안. 저장 전에 서비스가 검증한다. */
public record TranslationDraft(
        String title,
        String description,
        String location,
        String agencyName,
        List<String> recruitFields,
        List<String> qualifications,
        List<String> schedules,
        List<String> benefits) {
}
