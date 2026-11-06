package com.audition.platform.application.publicview;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class StructuredCatalogBrowseTest {

    @Test
    void translatedCatalogLabelsMatchTheSameAuditions() {
        String[] vocal = {"VOCAL"};
        List<String> storedTag = List.of("보컬");
        PublicAuditionBrowse.Query mongolian = query("Дуу");
        PublicAuditionBrowse.Query english = query("Vocal");
        PublicAuditionBrowse.Query korean = query("보컬");
        for (PublicAuditionBrowse.Query q : List.of(mongolian, english, korean)) {
            assertTrue(PublicAuditionBrowse.matches("OPEN", "MN", "MN", "Open call", "Agency", vocal, List.of(), null, null, null, q));
            assertTrue(PublicAuditionBrowse.matches("OPEN", "MN", "MN", "Open call", "Agency", new String[0], storedTag, null, null, null, q));
        }
        assertEquals(
                PublicAuditionBrowse.matches("OPEN", "MN", "MN", "Open call", "Agency", vocal, storedTag, null, null, null, mongolian),
                PublicAuditionBrowse.matches("OPEN", "MN", "MN", "Open call", "Agency", vocal, storedTag, null, null, null, english));
    }

    @Test
    void customTagsStayOnTheOriginalText() {
        List<String> custom = List.of("Street");
        PublicAuditionBrowse.Query street = query("Street");
        PublicAuditionBrowse.Query translated = query("Дуу");
        assertTrue(PublicAuditionBrowse.matches("OPEN", "KR", "KR", "Title", "Agency", new String[0], custom, null, null, null, street));
        assertFalse(PublicAuditionBrowse.matches("OPEN", "KR", "KR", "Title", "Agency", new String[0], custom, null, null, null, translated));
        assertTrue(PublicAuditionBrowse.matches(
                "OPEN", "KR", "KR", "Street night", "Agency", new String[0], List.of(), null, null, null,
                new PublicAuditionBrowse.Query(null, null, null, null, "Street", null, null)));
    }

    @Test
    void dancerLabelMapsToTheStoredDanceTag() {
        assertTrue(PublicAuditionBrowse.matches(
                "OPEN", "MN", "MN", "Title", "Agency", new String[0], List.of("댄서"), null, null, null, query("Dancer")));
        assertTrue(PublicAuditionBrowse.matches(
                "OPEN", "MN", "MN", "Title", "Agency", new String[0], List.of("댄서"), null, null, null, query("Бүжигчин")));
    }

    private static PublicAuditionBrowse.Query query(String category) {
        return new PublicAuditionBrowse.Query(null, null, category, null, null, null, null);
    }
}
