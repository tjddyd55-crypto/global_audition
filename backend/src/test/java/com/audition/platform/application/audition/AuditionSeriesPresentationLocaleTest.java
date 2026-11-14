package com.audition.platform.application.audition;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AuditionSeriesPresentationLocaleTest {

    @Test
    void roundLabelsAreLocalizedForKhmerAndUzbek() {
        assertEquals("កំពុងជ្រើសរើសជុំទី 2", AuditionSeriesPresentation.recruitmentRoundLabel("OPEN", 2, "km"));
        assertEquals("ជុំទី 2 បានបិទ", AuditionSeriesPresentation.recruitmentRoundLabel("CLOSED", 2, "km-KH"));
        assertEquals("2-bosqich qabul ochiq", AuditionSeriesPresentation.recruitmentRoundLabel("OPEN", 2, "uz"));
        assertEquals("2-bosqich · qoralama", AuditionSeriesPresentation.recruitmentRoundLabel("DRAFT", 2, "uz-Latn"));
        // 기존 로케일은 그대로다.
        assertEquals("2차 모집 중", AuditionSeriesPresentation.recruitmentRoundLabel("OPEN", 2, "ko"));
        assertEquals("Round 2 open", AuditionSeriesPresentation.recruitmentRoundLabel("OPEN", 2, "en"));
    }

    @Test
    void applyBlockedMessageHasKhmerAndUzbekCopy() {
        assertTrue(AuditionSeriesPresentation.applyBlockedMessage("km").startsWith("មានតែ"));
        assertTrue(AuditionSeriesPresentation.applyBlockedMessage("uz").startsWith("Faqat"));
    }
}
