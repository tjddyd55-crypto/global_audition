package com.audition.platform.application.i18n.translation;

import com.audition.platform.domain.audition.AuditionTranslation;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class TranslationDraftValidatorTest {

    @Test
    void requiresEveryNonEmptySourceFieldAndMatchingArrayLengths() {
        TranslationSource source = new TranslationSource(
                "ko",
                "제목",
                "설명",
                "",
                "에이전시",
                List.of("보컬", ""),
                List.of(),
                List.of("1일차"),
                List.of());
        TranslationDraft missing = new TranslationDraft(
                "Title",
                "",
                "",
                "Agency",
                List.of("Vocal", ""),
                List.of(),
                List.of("Day 1"),
                List.of());

        TranslationProviderException ex = assertThrows(
                TranslationProviderException.class,
                () -> TranslationDraftValidator.validate(source, missing));
        assertEquals(AuditionTranslation.ERROR_MISSING_FIELD, ex.getErrorCode());

        TranslationDraft shortList = new TranslationDraft(
                "Title",
                "Body",
                "anywhere",
                "Agency",
                List.of("Vocal"),
                List.of(),
                List.of("Day 1"),
                List.of());
        TranslationProviderException length = assertThrows(
                TranslationProviderException.class,
                () -> TranslationDraftValidator.validate(source, shortList));
        assertEquals(AuditionTranslation.ERROR_ARRAY_LENGTH_MISMATCH, length.getErrorCode());
    }

    @Test
    void emptySourceFieldsMayStayEmpty() {
        TranslationSource source = new TranslationSource(
                "ko", "제목", "", "", "", List.of("", "보컬"), List.of(), List.of(), List.of());
        TranslationDraft draft = new TranslationDraft(
                "Title", "", "", "", List.of("", "Vocal"), List.of(), List.of(), List.of());

        assertDoesNotThrow(() -> TranslationDraftValidator.validate(source, draft));
    }

    @Test
    void documentFieldsFollowTheSameCompletenessRule() {
        TranslationProviderException missing = assertThrows(
                TranslationProviderException.class,
                () -> TranslationDraftValidator.validateFields(Map.of("introText", "안녕"), Map.of("introText", " ")));
        assertEquals(AuditionTranslation.ERROR_MISSING_FIELD, missing.getErrorCode());
        assertDoesNotThrow(() -> TranslationDraftValidator.validateFields(
                Map.of("introText", ""), Map.of("introText", "")));
    }
}
