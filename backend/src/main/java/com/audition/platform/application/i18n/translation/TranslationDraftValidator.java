package com.audition.platform.application.i18n.translation;

import com.audition.platform.domain.audition.AuditionTranslation;

import java.util.List;
import java.util.Map;

/**
 * 구조적 완전성만 본다. 번역이 의미적으로 맞는지, 원문과 같은 언어인지는 판정하지 않는다.
 * 원문 스칼라가 비어 있지 않으면 결과의 같은 필드도 비어 있으면 안 된다.
 * 배열 길이는 원문과 같아야 하고, 비어 있지 않은 원문 항목은 같은 인덱스의 결과도 비어 있으면 안 된다.
 * 빈 원문 필드는 결과를 강제하지 않는다.
 */
public final class TranslationDraftValidator {

    private TranslationDraftValidator() {
    }

    public static void validate(TranslationSource source, TranslationDraft draft) {
        if (draft == null) {
            throw new TranslationProviderException(
                    AuditionTranslation.ERROR_MALFORMED_JSON,
                    "번역 본문이 비어 있습니다.");
        }
        requireScalar("title", source.title(), draft.title());
        requireScalar("description", source.description(), draft.description());
        requireScalar("location", source.location(), draft.location());
        requireScalar("agencyName", source.agencyName(), draft.agencyName());
        requireList("recruitFields", source.recruitFields(), draft.recruitFields());
        requireList("qualifications", source.qualifications(), draft.qualifications());
        requireList("schedules", source.schedules(), draft.schedules());
        requireList("benefits", source.benefits(), draft.benefits());
    }

    /** 공통 문서. 비어 있지 않은 원문 문자열은 결과에도 비어 있으면 안 된다. */
    public static void validateFields(Map<String, String> source, Map<String, String> result) {
        if (result == null) {
            throw new TranslationProviderException(
                    AuditionTranslation.ERROR_MALFORMED_JSON,
                    "번역 본문이 비어 있습니다.");
        }
        if (source == null) {
            return;
        }
        for (Map.Entry<String, String> entry : source.entrySet()) {
            requireScalar(entry.getKey(), entry.getValue(), result.get(entry.getKey()));
        }
    }

    private static void requireScalar(String field, String source, String result) {
        if (!hasText(source) || hasText(result)) {
            return;
        }
        throw new TranslationProviderException(
                AuditionTranslation.ERROR_MISSING_FIELD,
                AuditionTranslation.ERROR_MISSING_FIELD + ":" + field);
    }

    private static void requireList(String field, List<String> source, List<String> result) {
        List<String> expected = source == null ? List.of() : source;
        List<String> actual = result == null ? List.of() : result;
        if (expected.size() != actual.size()) {
            throw new TranslationProviderException(
                    AuditionTranslation.ERROR_ARRAY_LENGTH_MISMATCH,
                    AuditionTranslation.ERROR_ARRAY_LENGTH_MISMATCH + ":" + field);
        }
        for (int i = 0; i < expected.size(); i++) {
            if (hasText(expected.get(i)) && !hasText(actual.get(i))) {
                throw new TranslationProviderException(
                        AuditionTranslation.ERROR_MISSING_FIELD,
                        AuditionTranslation.ERROR_MISSING_FIELD + ":" + field + "[" + i + "]");
            }
        }
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
