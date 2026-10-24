package com.audition.platform.application.publicview;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PublicChannelDirectoryTest {

    @Test
    void stageNameMatchesAndHiddenFieldsStayOutOfFilters() {
        assertTrue(PublicChannelDirectory.matches("Stage Fan", "PH", true, List.of("Vocal"), true, "fan", null, null));
        assertFalse(PublicChannelDirectory.matches("Stage Fan", "PH", true, List.of("Vocal"), true, "other", null, null));
        assertFalse(PublicChannelDirectory.matches("Stage Fan", "PH", false, List.of("Vocal"), true, null, "PH", null));
        assertTrue(PublicChannelDirectory.matches("Stage Fan", "PH", true, List.of("Vocal"), true, null, "ph", "voc"));
        assertFalse(PublicChannelDirectory.matches("Stage Fan", "PH", true, List.of("Vocal"), false, null, null, "Vocal"));
    }

    @Test
    void categoryCodeMatchesLegacyLocalizedValues() {
        assertTrue(PublicChannelDirectory.matches("A", null, false, List.of("보컬"), true, null, null, "VOCAL"));
        assertTrue(PublicChannelDirectory.matches("A", null, false, List.of("бүжиг"), true, null, null, "DANCE"));
        assertFalse(PublicChannelDirectory.matches("A", null, false, List.of("댄스"), true, null, null, "VOCAL"));
    }
}
