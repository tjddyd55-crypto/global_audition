package com.audition.platform.application.i18n;

import com.audition.platform.domain.audition.Audition;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SourceFieldHashesTest {

    @Test
    void titleDescriptionAndBodyAreHashedSeparately() {
        Audition audition = audition("제목", "설명");
        String baseline = SourceFieldHashes.ofAudition(audition);
        assertTrue(baseline.contains(SourceFieldHashes.titleHash("제목")));
        assertTrue(baseline.contains(SourceFieldHashes.descriptionHash("설명")));

        audition.setTitle("다른 제목");
        String titleChanged = SourceFieldHashes.ofAudition(audition);
        assertNotEquals(baseline, titleChanged);
        assertTrue(titleChanged.contains(SourceFieldHashes.descriptionHash("설명")));

        audition.setTitle("제목");
        audition.setAgencyName("다른 기획사");
        assertEquals(baseline, SourceFieldHashes.ofAudition(audition));
        assertFalse(SourceFieldHashes.differs(baseline, SourceFieldHashes.ofAudition(audition), null, null));
    }

    @Test
    void rowsWithoutFieldHashesFallBackToTheCombinedSourceHash() {
        assertFalse(SourceFieldHashes.differs(null, "current-fields", "same", "same"));
        assertTrue(SourceFieldHashes.differs(null, "current-fields", "old", "new"));
        assertTrue(SourceFieldHashes.differs(null, null, null, "new"));
    }

    private static Audition audition(String title, String description) {
        Audition audition = new Audition();
        audition.setTitle(title);
        audition.setDescription(description);
        audition.setAgencyName("기획사");
        return audition;
    }
}
