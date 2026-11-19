package com.audition.platform.application.casting;

import com.audition.platform.application.me.MeNotificationService;
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

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/** 승인 기획사 인재 검색·캐스팅 제안 상태 전이·차단·신고·한도·알림. */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@TestPropertySource(properties = {
        "spring.datasource.url=${TEST_DB_URL:jdbc:postgresql://localhost:5432/audition_engine_test}",
        "spring.datasource.username=${TEST_DB_USER:postgres}",
        "spring.datasource.password=${TEST_DB_PASSWORD:postgres}",
        "audition.voting-db-verify=false",
        "app.translation.queue.enabled=false",
        "app.super-admin.bootstrap-enabled=false",
        "app.youtube.oembed-check.enabled=false",
        "app.casting.sweep.enabled=false",
})
class CastingOfferIT {

    private static final String DOMAIN = "@casting.offer.test";

    @Autowired private JdbcTemplate jdbc;
    @Autowired private CastingService casting;
    @Autowired private TalentSearchService talents;
    @Autowired private MeNotificationService inbox;

    @AfterEach
    void cleanup() {
        SecurityContextHolder.clearContext();
        String u = "(SELECT id FROM users WHERE email LIKE '%" + DOMAIN + "')";
        jdbc.update("DELETE FROM user_notifications WHERE user_id IN " + u);
        jdbc.update("DELETE FROM casting_reports WHERE reporter_user_id IN " + u);
        jdbc.update("DELETE FROM casting_agency_blocks WHERE talent_user_id IN " + u);
        jdbc.update("DELETE FROM casting_offers WHERE agency_user_id IN " + u);
        jdbc.update("DELETE FROM agency_saved_talents WHERE agency_user_id IN " + u);
        jdbc.update("DELETE FROM agency_casting_controls WHERE agency_user_id IN " + u);
        jdbc.update("DELETE FROM crm_agencies WHERE linked_user_id IN " + u);
        jdbc.update("DELETE FROM users WHERE email LIKE '%" + DOMAIN + "'");
    }

    @Test
    void approvedAgencyOfferLifecycleWithNotificationsAndContactConsent() {
        UUID agency = agency("castagA", "APPROVED");
        UUID unapproved = agency("castagB", "PENDING");
        UUID adult = talent("casttalA", "1995-03-01", true);

        as(unapproved, "ROLE_AGENCY");
        assertEquals(HttpStatus.FORBIDDEN, assertThrows(ResponseStatusException.class,
                () -> talents.search(filter("casttal"))).getStatusCode());
        assertEquals("AGENCY_NOT_APPROVED",
                assertThrows(ResponseStatusException.class, () -> casting.send(offer(adult))).getReason());

        as(agency, "ROLE_AGENCY");
        var page = talents.search(filter("casttal"));
        assertEquals(List.of("casttalA"), page.items().stream().map(TalentSearchService.TalentCard::nickname).toList());
        assertNull(page.items().get(0).realName(), "실명 비공개");
        talents.save(adult, "보컬 후보", "내부 메모");
        assertTrue(talents.search(filter("casttal")).items().get(0).saved());

        var sent = casting.send(offer(adult));
        assertEquals("SENT", sent.status());
        assertEquals("OFFER_ALREADY_OPEN",
                assertThrows(ResponseStatusException.class, () -> casting.send(offer(adult))).getReason());

        as(adult, "ROLE_APPLICANT");
        assertEquals(1, casting.myOffers().size());
        assertTrue(inbox.listMine().stream().anyMatch(n -> "castingOfferNewTitle".equals(n.getTitleKey())));
        var read = casting.myOffer(UUID.fromString(sent.id()));
        assertEquals("READ", read.status());
        Integer contractsBefore = jdbc.queryForObject("SELECT COUNT(*) FROM contracts", Integer.class);
        Integer appsBefore = jdbc.queryForObject("SELECT COUNT(*) FROM applications WHERE applicant_id = ?", Integer.class, adult);
        var accepted = casting.accept(UUID.fromString(sent.id()), true, "관심 있습니다");
        assertEquals("ACCEPTED", accepted.status());
        assertTrue(accepted.contactShared());
        assertEquals("OFFER_STATE_CONFLICT", assertThrows(ResponseStatusException.class,
                () -> casting.decline(UUID.fromString(sent.id()), "OTHER", null)).getReason());
        assertEquals(contractsBefore, jdbc.queryForObject("SELECT COUNT(*) FROM contracts", Integer.class),
                "수락은 계약을 만들지 않는다");
        assertEquals(appsBefore, jdbc.queryForObject("SELECT COUNT(*) FROM applications WHERE applicant_id = ?", Integer.class, adult),
                "수락은 지원서를 만들지 않는다");

        as(agency, "ROLE_AGENCY");
        var mine = casting.agencyOffer(UUID.fromString(sent.id()));
        assertNotNull(mine.contact());
        assertEquals("casttala" + DOMAIN, mine.contact().email());
        assertTrue(casting.agencyOffer(UUID.fromString(sent.id())).history().size() >= 3);
        assertEquals("ACCEPTED", talents.search(filter("casttal")).items().get(0).lastOfferStatus());
    }

    @Test
    void minorsUnknownAgeBlocksDeclineCooldownAndWithdraw() {
        UUID agency = agency("castagC", "APPROVED");
        UUID minor = talent("casttalMinor", LocalDate.now().minusYears(15).toString(), true);
        UUID unknown = talent("casttalUnknown", null, true);
        UUID adult = talent("casttalB", "1990-01-01", true);

        as(agency, "ROLE_AGENCY");
        List<String> found = talents.search(filter("casttal")).items().stream().map(TalentSearchService.TalentCard::nickname).toList();
        assertTrue(found.contains("casttalMinor"), "미성년자라는 이유만으로 검색에서 빼지 않는다(KR 14세 이상은 본인 설정)");
        assertFalse(talents.search(filter("casttalMinor")).items().get(0).acceptsOffers(), "보호자 확인 전 제안 수신 불가");
        assertEquals("TALENT_NOT_ACCEPTING",
                assertThrows(ResponseStatusException.class, () -> casting.send(offer(minor))).getReason());
        assertEquals("TALENT_NOT_ACCEPTING",
                assertThrows(ResponseStatusException.class, () -> casting.send(offer(unknown))).getReason());

        var first = casting.send(offer(adult));
        var withdrawn = casting.withdraw(UUID.fromString(first.id()), "내부 사정");
        assertEquals("WITHDRAWN", withdrawn.status());
        var second = casting.send(offer(adult));

        as(adult, "ROLE_APPLICANT");
        assertTrue(inbox.listMine().stream().anyMatch(n -> "castingOfferWithdrawnTitle".equals(n.getTitleKey())));
        var declined = casting.decline(UUID.fromString(second.id()), "SCHEDULE", null);
        assertEquals("DECLINED", declined.status());

        as(agency, "ROLE_AGENCY");
        assertEquals("OFFER_COOLDOWN",
                assertThrows(ResponseStatusException.class, () -> casting.send(offer(adult))).getReason());

        // 신고 + 차단 → 검색에서 사라지고, 차단 사실은 드러나지 않는다.
        jdbc.update("UPDATE casting_offers SET responded_at = NOW() - INTERVAL '40 days' WHERE id = ?", UUID.fromString(second.id()));
        var third = casting.send(offer(adult));
        as(adult, "ROLE_APPLICANT");
        casting.report(UUID.fromString(third.id()), "EXTERNAL_PAYMENT", "선입금 요구", true);
        assertEquals(1, casting.myBlocks().size());
        as(agency, "ROLE_AGENCY");
        assertFalse(talents.search(filter("casttal")).items().stream().anyMatch(t -> t.nickname().equals("casttalB")));
    }

    @Test
    void minorWithGuardianGetsOfficialOfferWithoutContactExchange() {
        UUID agency = agency("castagE", "APPROVED");
        UUID minor = talent("casttalGuard", LocalDate.now().minusYears(16).toString(), true);
        jdbc.update("""
                INSERT INTO guardian_confirmations (id, user_id, guardian_name, token_hash, status, terms_version, expires_at, confirmed_at)
                VALUES (?, ?, '[IT] 보호자', ?, 'CONFIRMED', 'it', NOW() + INTERVAL '7 days', NOW())
                """, UUID.randomUUID(), minor, "it-" + UUID.randomUUID());
        as(agency, "ROLE_AGENCY");
        assertTrue(talents.search(filter("casttalGuard")).items().get(0).acceptsOffers());
        CastingRules.OfferInput withPhone = new CastingRules.OfferInput(minor, null, "[IT] 제안", "PROJECT", "VOCAL",
                "연락 주세요 010-1234-5678", "KR", "Seoul", null, "NEGOTIABLE", null, null, null, true, "ko");
        assertEquals("OFFER_MINOR_CONTACT_TEXT",
                assertThrows(ResponseStatusException.class, () -> casting.send(withPhone)).getReason());
        CastingRules.OfferInput withUrl = new CastingRules.OfferInput(minor, null, "[IT] 제안", "PROJECT", "VOCAL",
                "자세한 건 https://example.com 참고", "KR", "Seoul", null, "NEGOTIABLE", null, null, null, true, "ko");
        assertEquals("OFFER_MINOR_CONTACT_TEXT",
                assertThrows(ResponseStatusException.class, () -> casting.send(withUrl)).getReason());
        var sent = casting.send(offer(minor));
        assertFalse(sent.contactRequested(), "미성년자에게는 연락처 공유 요청을 붙이지 않는다");

        as(minor, "ROLE_APPLICANT");
        var accepted = casting.accept(UUID.fromString(sent.id()), true, null);
        assertEquals("ACCEPTED", accepted.status());
        assertFalse(accepted.contactShared(), "가입 동의만으로 연락처를 공유하지 않는다");
        as(agency, "ROLE_AGENCY");
        assertNull(casting.agencyOffer(UUID.fromString(sent.id())).contact());
    }

    @Test
    void offerPastDeadlineIsExpiredImmediatelyInListDetailAndApi() {
        UUID agency = agency("castagF", "APPROVED");
        UUID adult = talent("casttalExp", "1991-01-01", true);
        as(agency, "ROLE_AGENCY");
        var sent = casting.send(offer(adult));
        UUID id = UUID.fromString(sent.id());
        // 정기 정리(sweep) 전: DB 상태는 아직 SENT.
        jdbc.update("UPDATE casting_offers SET expires_at = NOW() - INTERVAL '1 second' WHERE id = ?", id);
        assertEquals("EXPIRED", casting.agencyOffers(null, null).stream().filter(o -> o.id().equals(sent.id()))
                .findFirst().orElseThrow().status());
        assertTrue(casting.agencyOffers("EXPIRED", null).stream().anyMatch(o -> o.id().equals(sent.id())));
        assertFalse(casting.agencyOffers("SENT", null).stream().anyMatch(o -> o.id().equals(sent.id())));

        as(adult, "ROLE_APPLICANT");
        var listed = casting.myOffers().stream().filter(o -> o.id().equals(sent.id())).findFirst().orElseThrow();
        assertEquals("EXPIRED", listed.status());
        assertTrue(listed.expired());
        assertFalse(listed.respondable());
        assertNotNull(listed.serverNow());
        var detail = casting.myOffer(id);
        assertEquals("EXPIRED", detail.status());
        assertFalse(detail.respondable());
        assertEquals("SENT", jdbc.queryForObject("SELECT status FROM casting_offers WHERE id = ?", String.class, id),
                "열람해도 마감 지난 제안은 READ 로 바꾸지 않는다");
        assertEquals("OFFER_EXPIRED",
                assertThrows(ResponseStatusException.class, () -> casting.accept(id, false, null)).getReason());
        assertEquals("OFFER_EXPIRED",
                assertThrows(ResponseStatusException.class, () -> casting.decline(id, "OTHER", null)).getReason());
    }

    @Test
    void restrictedAgencyAndDailyLimit() {
        UUID agency = agency("castagD", "APPROVED");
        UUID a = talent("casttalD1", "1992-01-01", true);
        UUID b = talent("casttalD2", "1992-01-01", true);
        jdbc.update("INSERT INTO agency_casting_controls (agency_user_id, daily_limit) VALUES (?, 1)", agency);
        as(agency, "ROLE_AGENCY");
        casting.send(offer(a));
        assertEquals("CASTING_DAILY_LIMIT",
                assertThrows(ResponseStatusException.class, () -> casting.send(offer(b))).getReason());
        jdbc.update("UPDATE agency_casting_controls SET offers_restricted = TRUE, daily_limit = 10 WHERE agency_user_id = ?", agency);
        assertEquals("CASTING_RESTRICTED",
                assertThrows(ResponseStatusException.class, () -> casting.send(offer(b))).getReason());
        var preview = casting.preview(offer(b));
        assertTrue(preview.warnings().contains("CASTING_RESTRICTED"));
    }

    private static TalentSearchService.Filter filter(String q) {
        return new TalentSearchService.Filter(q, null, null, null, null, null, null, null, null, null, 60, 0);
    }

    private static CastingRules.OfferInput offer(UUID talent) {
        return new CastingRules.OfferInput(talent, null, "[IT] 보컬 프로젝트 제안", "PROJECT", "VOCAL", "함께하고 싶습니다.",
                "KR", "Seoul", "2027 상반기", "NEGOTIABLE", null, null, null, true, "ko");
    }

    private UUID agency(String nick, String approval) {
        UUID id = user(nick, "AGENCY", null);
        jdbc.update("""
                INSERT INTO crm_agencies (id, country_code, display_name, stage, approval_state, linked_user_id)
                VALUES (?, 'KR', ?, 'ACTIVE', ?, ?)
                """, UUID.randomUUID(), "[IT] " + nick, approval, id);
        return id;
    }

    private UUID talent(String nick, String birth, boolean casting) {
        UUID id = user(nick, "APPLICANT", birth);
        jdbc.update("UPDATE users SET is_channel_public = TRUE, talent_search_visible = TRUE, casting_offers_enabled = ?, "
                + "channel_categories = '{VOCAL}' WHERE id = ?", casting, id);
        return id;
    }

    private UUID user(String nick, String role, String birth) {
        UUID id = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO users (id, email, password_hash, role, username, display_name, nickname, name, country_code, birth_date)
                VALUES (?, ?, 'x', ?, ?, ?, ?, '실명테스트', 'KR', ?::date)
                """, id, nick.toLowerCase() + DOMAIN, role, nick.toLowerCase() + id.toString().substring(0, 6), nick, nick, birth);
        return id;
    }

    private static void as(UUID id, String role) {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                id, null, List.of(new SimpleGrantedAuthority(role))));
    }
}
