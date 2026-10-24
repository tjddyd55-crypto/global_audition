package com.audition.platform.domain.audition;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;

import com.audition.platform.application.audition.AuditionSeriesPresentation;
import org.junit.jupiter.api.Test;

class RecruitFieldCodesTest {

    @Test
    void mapsLegacyValuesToCodesAndKeepsFreeText() {
        assertEquals("VOCAL", RecruitFieldCodes.normalize("보컬"));
        assertEquals("DANCE", RecruitFieldCodes.normalize(" Dance "));
        assertEquals("RAP", RecruitFieldCodes.normalize("rap"));
        assertEquals("요리", RecruitFieldCodes.normalize("요리"));
        assertArrayEquals(new String[] {"VOCAL", "DANCE", "요리"},
                RecruitFieldCodes.normalizeAll(new String[] {"보컬", "Vocal", "댄스", "", "요리"}));
    }

    @Test
    void displayTitleHasNoLocalizedRoundSuffix() {
        assertEquals("Title", AuditionSeriesPresentation.displayTitle("Title (2차)", 2));
        assertEquals("Title", AuditionSeriesPresentation.displayTitle("Title", 3, "en"));
    }
}
