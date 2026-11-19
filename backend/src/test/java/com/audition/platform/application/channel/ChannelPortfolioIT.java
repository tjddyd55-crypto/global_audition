package com.audition.platform.application.channel;

import com.audition.platform.api.dto.channel.PublicChannelListItemResponse;
import com.audition.platform.api.dto.me.CreateMyChannelVideoRequest;
import com.audition.platform.api.dto.me.PatchMyChannelRequest;
import com.audition.platform.application.channel.ChannelCareerService.CareerInput;
import com.audition.platform.application.me.MyChannelService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/** 공개 채널 목록·상세, 포트폴리오 항목 공개 범위, YouTube 링크 등록 규칙, 경력 CRUD. */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@TestPropertySource(properties = {
        "spring.datasource.url=${TEST_DB_URL:jdbc:postgresql://localhost:5432/audition_engine_test}",
        "spring.datasource.username=${TEST_DB_USER:postgres}",
        "spring.datasource.password=${TEST_DB_PASSWORD:postgres}",
        "audition.voting-db-verify=false",
        "app.translation.queue.enabled=false",
        "app.super-admin.bootstrap-enabled=false",
        "app.youtube.oembed-check.enabled=false",
})
class ChannelPortfolioIT {

    private static final String DOMAIN = "@channel.portfolio.test";

    @Autowired private JdbcTemplate jdbc;
    @Autowired private MyChannelService channels;
    @Autowired private ChannelCareerService careers;

    @AfterEach
    void cleanup() {
        SecurityContextHolder.clearContext();
        String u = "(SELECT id FROM users WHERE email LIKE '%" + DOMAIN + "')";
        jdbc.update("DELETE FROM channel_careers WHERE user_id IN " + u);
        jdbc.update("UPDATE users SET featured_video_id = NULL WHERE id IN " + u);
        jdbc.update("DELETE FROM channel_videos WHERE owner_id IN " + u);
        jdbc.update("DELETE FROM channels WHERE owner_id IN " + u);
        jdbc.update("DELETE FROM users WHERE email LIKE '%" + DOMAIN + "'");
    }

    @Test
    void youtubeOnlyRegistrationLimitsDuplicatesAndCareerCrud() {
        UUID me = applicant("ytowner");
        as(me, "ROLE_APPLICANT");
        ResponseStatusException bad = assertThrows(ResponseStatusException.class,
                () -> channels.createVideo(video("https://vimeo.com/12345")));
        assertEquals(HttpStatus.UNPROCESSABLE_ENTITY, bad.getStatusCode());
        var v = channels.createVideo(video("https://youtube.com/shorts/aqz-KE-bpKQ"));
        assertEquals("aqz-KE-bpKQ", v.getYoutubeVideoId());
        assertTrue(v.isShorts());
        assertEquals("https://i.ytimg.com/vi/aqz-KE-bpKQ/hqdefault.jpg", v.getThumbnailUrl());
        assertEquals("UNKNOWN", v.getEmbedStatus(), "확인 비활성 테스트 환경");
        ResponseStatusException dup = assertThrows(ResponseStatusException.class,
                () -> channels.createVideo(video("https://www.youtube.com/watch?v=aqz-KE-bpKQ")));
        assertEquals(HttpStatus.CONFLICT, dup.getStatusCode());

        var c = careers.create(new CareerInput("CONTEST_AWARD", "[IT] 가상 경연 장려상", "가상 협회", "2025-05", null,
                "설명", "ko", true, 1));
        assertEquals(1, careers.mine().size());
        careers.update(UUID.fromString(c.id()), new CareerInput(null, null, null, null, null, null, null, false, null));
        assertFalse(careers.mine().get(0).visible());
        assertEquals(0, careers.publicFor(me).size(), "숨긴 경력은 공개 상세에 없다");
        careers.delete(UUID.fromString(c.id()));
        assertEquals(0, careers.mine().size());
        assertNotNull(jdbc.queryForObject("SELECT last_active_at FROM users WHERE id = ?", java.sql.Timestamp.class, me));
    }

    @Test
    void castingOptInRequiresConfirmedAdult() {
        UUID me = applicant("optin");
        as(me, "ROLE_APPLICANT");
        PatchMyChannelRequest on = new PatchMyChannelRequest();
        on.setCastingOffersEnabled(true);
        assertEquals("CASTING_BIRTH_DATE_REQUIRED",
                assertThrows(ResponseStatusException.class, () -> channels.patchChannel(on)).getReason());
        jdbc.update("UPDATE users SET birth_date = CURRENT_DATE - INTERVAL '15 years' WHERE id = ?", me);
        assertEquals("CASTING_MINOR_RESTRICTED",
                assertThrows(ResponseStatusException.class, () -> channels.patchChannel(on)).getReason());
        jdbc.update("UPDATE users SET birth_date = CURRENT_DATE - INTERVAL '25 years' WHERE id = ?", me);
        on.setLanguages(List.of("ko", "en"));
        on.setResidenceCountry("MN");
        on.setTalentSearchVisible(true);
        var r = channels.patchChannel(on);
        assertTrue(r.isCastingOffersEnabled());
        assertTrue(r.isTalentSearchVisible());
        assertEquals("MN", r.getResidenceCountry());
        assertEquals("25_29", r.getAgeBand());
    }

    @Test
    void discoveryFiltersSortsAndHidesPrivateOrModeratedChannels() {
        UUID a = applicant("itdiscA");
        UUID b = applicant("itdiscB");
        UUID priv = applicant("itdiscPriv");
        UUID hidden = applicant("itdiscHidden");
        jdbc.update("UPDATE users SET is_channel_public = TRUE, nationality = 'KH', channel_categories = '{댄스}' WHERE id = ?", a);
        jdbc.update("UPDATE users SET is_channel_public = TRUE, nationality = 'UZ', residence_country = 'KR', "
                + "channel_shown_fields = '{RESIDENCE,SPECIALTIES}', channel_categories = '{VOCAL}', birth_date = '1990-01-01' WHERE id = ?", b);
        jdbc.update("UPDATE users SET is_channel_public = FALSE WHERE id = ?", priv);
        jdbc.update("UPDATE users SET is_channel_public = TRUE, channel_moderation_hidden = TRUE WHERE id = ?", hidden);

        List<String> all = names(channels.listPublicChannels("itdisc", null, null, null, "NEWEST", 100, 0));
        assertTrue(all.containsAll(List.of("itdiscA", "itdiscB")));
        assertFalse(all.contains("itdiscPriv"));
        assertFalse(all.contains("itdiscHidden"));
        assertEquals(List.of("itdiscA"), names(channels.listPublicChannels("itdisc", "KH", null, null, null, null, null)));
        assertEquals(List.of("itdiscB"), names(channels.listPublicChannels("itdisc", "KR", null, null, null, null, null)));
        assertEquals(List.of(), names(channels.listPublicChannels("itdisc", "UZ", null, null, null, null, null)), "국적 비공개");
        assertEquals(List.of("itdiscA"), names(channels.listPublicChannels("itdisc", null, "DANCE", null, null, null, null)));
        assertEquals(1, channels.listPublicChannels("itdisc", null, null, null, null, 1, 1).size());

        SecurityContextHolder.clearContext();
        var detail = channels.getPublicChannelByUserId(b);
        assertEquals("KR", detail.getResidenceCountry());
        assertNull(detail.getNationality(), "국적 비공개");
        assertNull(detail.getAgeBand(), "연령대 비공개");
        assertNull(detail.getName(), "실명 비공개");
        assertFalse(detail.isAcceptsCastingOffers());
        assertThrows(ResponseStatusException.class, () -> channels.getPublicChannelByUserId(hidden));
        assertThrows(ResponseStatusException.class, () -> channels.getPublicChannelByUserId(priv));
    }

    private static List<String> names(List<PublicChannelListItemResponse> rows) {
        return rows.stream().map(PublicChannelListItemResponse::getNickname).toList();
    }

    private static CreateMyChannelVideoRequest video(String url) {
        CreateMyChannelVideoRequest r = new CreateMyChannelVideoRequest();
        r.setTitle("[IT] video");
        r.setVideoUrl(url);
        r.setVisibility("PUBLIC");
        return r;
    }

    private UUID applicant(String nick) {
        UUID id = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO users (id, email, password_hash, role, username, display_name, nickname, name, country_code)
                VALUES (?, ?, 'x', 'APPLICANT', ?, ?, ?, '실명테스트', 'KR')
                """, id, nick.toLowerCase() + DOMAIN, nick.toLowerCase() + id.toString().substring(0, 6), nick, nick);
        return id;
    }

    private static void as(UUID id, String role) {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                id, null, List.of(new SimpleGrantedAuthority(role))));
    }
}
