package com.audition.platform.application.publicview;

import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PublicAuditionBrowseTest {

    private static final Instant START = Instant.parse("2026-10-01T00:00:00Z");
    private static final Instant END = Instant.parse("2026-10-31T00:00:00Z");

    @Test
    void openListingKeepsOpenRowsAndDropsDrafts() {
        assertTrue(hit("OPEN", query(null, null, null, null, null, null, null)));
        assertFalse(hit("DRAFT", query(null, null, null, null, null, null, null)));
        assertFalse(hit("CLOSED", query("OPEN", null, null, null, null, null, null)));
    }

    @Test
    void filtersCategoryAgencyCountryPeriodAndEndedStatus() {
        assertTrue(hit("OPEN", query("OPEN", "JP", "vocal", "Tokyo", null, START, END)));
        assertFalse(hit("OPEN", query("OPEN", "KR", "vocal", "Tokyo", null, null, null)));
        assertFalse(hit("OPEN", query("OPEN", "JP", "dance", "Tokyo", null, null, null)));
        assertFalse(hit("OPEN", query("OPEN", "JP", "vocal", "Seoul", null, null, null)));
        assertFalse(hit("OPEN", query("OPEN", null, null, null, null, Instant.parse("2026-11-01T00:00:00Z"), null)));
        assertTrue(hit("CLOSED", query("ENDED", null, null, null, null, null, null)));
        assertTrue(hit("OPEN", query("ALL", null, null, null, "open call", null, null)));
    }

    private static boolean hit(String status, PublicAuditionBrowse.Query query) {
        return PublicAuditionBrowse.matches(
                status,
                "JP",
                "Tokyo Open Call",
                "Tokyo Stage",
                new String[] {"Vocal"},
                List.of("Singer"),
                START,
                END,
                null,
                query);
    }

    private static PublicAuditionBrowse.Query query(
            String recruitment, String country, String category, String agency, String text, Instant from, Instant to) {
        return new PublicAuditionBrowse.Query(recruitment, country, category, agency, text, from, to);
    }
}
