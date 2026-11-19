package com.audition.platform.application.channel;

import com.audition.platform.application.channel.ChannelCareerService.CareerInput;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class ChannelPortfolioRulesTest {

    private static final LocalDate TODAY = LocalDate.of(2026, 11, 19);

    @Test
    void youtubeIdsFromWatchShortShortsEmbedAndRejectsOthers() {
        assertEquals("aqz-KE-bpKQ", YoutubeVideoRef.idOf("https://www.youtube.com/watch?v=aqz-KE-bpKQ&t=3s"));
        assertEquals("aqz-KE-bpKQ", YoutubeVideoRef.idOf("https://youtu.be/aqz-KE-bpKQ?si=x"));
        assertEquals("aqz-KE-bpKQ", YoutubeVideoRef.idOf("https://youtube.com/shorts/aqz-KE-bpKQ"));
        assertEquals("aqz-KE-bpKQ", YoutubeVideoRef.idOf("https://www.youtube.com/embed/aqz-KE-bpKQ"));
        assertEquals("aqz-KE-bpKQ", YoutubeVideoRef.idOf("https://m.youtube.com/watch?v=aqz-KE-bpKQ"));
        assertNull(YoutubeVideoRef.idOf("https://vimeo.com/123456"));
        assertNull(YoutubeVideoRef.idOf("https://www.youtube.com/watch?v=short"));
        assertNull(YoutubeVideoRef.idOf(""));
        assertTrue(YoutubeVideoRef.isShorts("https://youtube.com/shorts/aqz-KE-bpKQ"));
        assertEquals("https://i.ytimg.com/vi/aqz-KE-bpKQ/hqdefault.jpg", YoutubeVideoRef.thumbnailUrl("aqz-KE-bpKQ"));
    }

    @Test
    void oembedTitleParsing() {
        assertEquals("Big Buck Bunny 60fps 4K", YoutubeEmbedChecker.titleOf("{\"title\":\"Big Buck Bunny 60fps 4K\",\"author_name\":\"x\"}"));
        assertEquals("a\"b", YoutubeEmbedChecker.titleOf("{\"title\": \"a\\\"b\"}"));
        assertNull(YoutubeEmbedChecker.titleOf("{}"));
    }

    @Test
    void ageBandsAndAdultConfirmationNeverExposeBirthDate() {
        assertNull(ChannelPortfolioRules.ageBand(null, TODAY));
        assertEquals("U18", ChannelPortfolioRules.ageBand(LocalDate.of(2010, 1, 1), TODAY));
        assertEquals("18_19", ChannelPortfolioRules.ageBand(LocalDate.of(2008, 11, 19), TODAY));
        assertEquals("20_24", ChannelPortfolioRules.ageBand(LocalDate.of(2003, 5, 1), TODAY));
        assertEquals("40_PLUS", ChannelPortfolioRules.ageBand(LocalDate.of(1980, 5, 1), TODAY));
        assertNull(ChannelPortfolioRules.age(null, TODAY), "생년월일 없으면 나이 미확인");
        assertEquals(17, ChannelPortfolioRules.age(LocalDate.of(2008, 11, 20), TODAY));
        assertEquals(18, ChannelPortfolioRules.age(LocalDate.of(2008, 11, 19), TODAY));
    }

    @Test
    void languagesResidenceAndFields() {
        assertArrayEquals(new String[]{"ko", "en"}, ChannelPortfolioRules.languages(List.of("KO", "en", "ko", " ")));
        assertThrows(ResponseStatusException.class, () -> ChannelPortfolioRules.languages(List.of("xx")));
        assertNull(ChannelPortfolioRules.languages(null));
        assertEquals("KH", ChannelPortfolioRules.residence("kh"));
        assertEquals("", ChannelPortfolioRules.residence(" "));
        assertThrows(ResponseStatusException.class, () -> ChannelPortfolioRules.residence("ZZ"));
        assertTrue(ChannelPortfolioRules.matchesField(new String[]{"보컬"}, "VOCAL"));
        assertTrue(ChannelPortfolioRules.matchesField(new String[]{"인플루언서"}, "INFLUENCER"));
        assertTrue(ChannelPortfolioRules.matchesField(new String[]{"PRODUCING"}, "OTHER"));
        assertFalse(ChannelPortfolioRules.matchesField(new String[]{"DANCE"}, "OTHER"));
        assertTrue(ChannelPortfolioRules.matchesField(new String[]{}, "ALL"));
        assertEquals("DANCE", ChannelPortfolioRules.mainField(new String[]{"댄스", "VOCAL"}));
    }

    @Test
    void careerValidation() {
        UUID u = UUID.randomUUID();
        var ok = ChannelCareerService.validated(UUID.randomUUID(), u,
                new CareerInput("performance", " 버스킹 ", null, "2024-03", "2025", null, "ko", null, null), null);
        assertEquals("PERFORMANCE", ok.category());
        assertEquals("버스킹", ok.title());
        assertTrue(ok.visible());
        assertThrows(ResponseStatusException.class, () -> ChannelCareerService.validated(UUID.randomUUID(), u,
                new CareerInput("CONTRACT", "x", null, null, null, null, null, null, null), null));
        assertThrows(ResponseStatusException.class, () -> ChannelCareerService.validated(UUID.randomUUID(), u,
                new CareerInput("OTHER", " ", null, null, null, null, null, null, null), null));
        assertThrows(ResponseStatusException.class, () -> ChannelCareerService.validated(UUID.randomUUID(), u,
                new CareerInput("OTHER", "x", null, "2025-13", null, null, null, null, null), null));
        assertThrows(ResponseStatusException.class, () -> ChannelCareerService.validated(UUID.randomUUID(), u,
                new CareerInput("OTHER", "x", null, "2025", "2024", null, null, null, null), null));
    }
}
