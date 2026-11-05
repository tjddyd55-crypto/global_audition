package com.audition.platform.application.i18n;

import com.audition.platform.api.dto.AuditionTextSnapshot;
import com.audition.platform.api.dto.UpdateAuditionRequest;
import com.audition.platform.domain.audition.Audition;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AuditionOriginalWriteGuardTest {

    @Test
    void unchangedOriginalAndOverlayEchoDoNotWrite() {
        Audition audition = audition();
        UpdateAuditionRequest same = request("원문 제목", "원문 본문");
        assertFalse(AuditionOriginalWriteGuard.apply(audition, same, overlays()));
        assertEquals("원문 제목", audition.getTitle());
        assertEquals("원문 본문", audition.getDescription());

        UpdateAuditionRequest echo = request("English title", "English body");
        assertFalse(AuditionOriginalWriteGuard.apply(audition, echo, overlays()));
        assertEquals("원문 제목", audition.getTitle());
        assertEquals("원문 본문", audition.getDescription());
    }

    @Test
    void realEditWritesOnlyThatField() {
        Audition audition = audition();
        UpdateAuditionRequest edit = request("새 제목", "English body");
        assertTrue(AuditionOriginalWriteGuard.apply(audition, edit, overlays()));
        assertEquals("새 제목", audition.getTitle());
        assertEquals("원문 본문", audition.getDescription());
    }

    private static Audition audition() {
        Audition audition = new Audition();
        audition.setTitle("원문 제목");
        audition.setDescription("원문 본문");
        audition.setLocation("서울");
        audition.setAgencyName("기획사");
        return audition;
    }

    private static UpdateAuditionRequest request(String title, String description) {
        UpdateAuditionRequest request = new UpdateAuditionRequest();
        request.setTitle(title);
        request.setDescription(description);
        return request;
    }

    private static List<AuditionTextSnapshot> overlays() {
        AuditionTextSnapshot english = new AuditionTextSnapshot();
        english.setTitle("English title");
        english.setDescription("English body");
        AuditionTextSnapshot mongolian = new AuditionTextSnapshot();
        mongolian.setTitle("Монгол гарчиг");
        mongolian.setDescription("Монгол тайлбар");
        return List.of(english, mongolian);
    }
}
