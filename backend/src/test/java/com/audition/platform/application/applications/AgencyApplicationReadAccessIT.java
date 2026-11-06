package com.audition.platform.application.applications;

import com.audition.platform.infra.JwtService;
import com.audition.platform.infra.TestDatabase;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * GET /api/applications/{id}/agency-detail 과 같은 조회 규칙.
 *
 * <p>국가 관리자: 이 API에는 국가·기획사 할당 테이블이 없다.
 * role ADMIN 은 소유 기획사와 users.country_code 와 무관하게 조회가 허용된다.
 * 그래서 KR 로 표시된 ADMIN 도 JP 지원서를 읽는다(기존 동작, 범위 밖 국가 차단 없음).
 * 범위 밖 차단은 소유하지 않은 AGENCY, USER, 지원자 역할에만 있다.</p>
 */
@SpringBootTest
@AutoConfigureMockMvc
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class AgencyApplicationReadAccessIT {

    private static final String VIDEO_PREFIX = "https://files.example/";

    @DynamicPropertySource
    static void props(DynamicPropertyRegistry registry) {
        TestDatabase.register(registry);
        byte[] key = new byte[64];
        new SecureRandom().nextBytes(key);
        String secret = Base64.getUrlEncoder().withoutPadding().encodeToString(key);
        registry.add("app.jwt.secret", () -> secret);
        registry.add("app.credits.allow-legacy-self-charge", () -> "false");
        registry.add("app.super-admin.bootstrap-enabled", () -> "false");
    }

    @BeforeAll
    void guardAndSeed() throws Exception {
        TestDatabase.assertLocal();
        applicantId = signup("APPLICANT");
        superAdminId = signup("APPLICANT");
        userId = signup("APPLICANT");
        adminId = signup("APPLICANT");
        krAgencyId = signup("APPLICANT");
        otherAgencyId = signup("APPLICANT");
        jdbc.update("UPDATE users SET role = 'SUPER_ADMIN' WHERE id = ?", superAdminId);
        jdbc.update("UPDATE users SET role = 'USER' WHERE id = ?", userId);
        jdbc.update("UPDATE users SET role = 'ADMIN', country_code = 'KR' WHERE id = ?", adminId);
        jdbc.update("UPDATE users SET role = 'AGENCY', country_code = 'KR' WHERE id = ?", krAgencyId);
        jdbc.update("UPDATE users SET role = 'AGENCY', country_code = 'JP' WHERE id = ?", otherAgencyId);

        // 클레임은 USER. 권한은 DB role SUPER_ADMIN 이어야 한다.
        superAdminToken = token(superAdminId, "USER");
        userToken = token(userId, "SUPER_ADMIN");
        adminToken = token(adminId, "ADMIN");
        krAgencyToken = token(krAgencyId, "AGENCY");
        otherAgencyToken = token(otherAgencyId, "AGENCY");
        applicantToken = token(applicantId, "APPLICANT");

        kr = seedCountry("KR", krAgencyId);
        mn = seedCountry("MN", krAgencyId);
        jp = seedCountry("JP", otherAgencyId);
        mutable = seedCountry("KR", krAgencyId);
    }

    @Autowired
    private MockMvc mvc;
    @Autowired
    private JdbcTemplate jdbc;
    @Autowired
    private JwtService jwt;
    @Autowired
    private ObjectMapper json;

    private UUID applicantId;
    private UUID superAdminId;
    private UUID userId;
    private UUID adminId;
    private UUID krAgencyId;
    private UUID otherAgencyId;
    private String superAdminToken;
    private String userToken;
    private String adminToken;
    private String krAgencyToken;
    private String otherAgencyToken;
    private String applicantToken;
    private Fixture kr;
    private Fixture mn;
    private Fixture jp;
    private Fixture mutable;

    @Test
    void superAdminReadsKrMnJpByDatabaseRole() throws Exception {
        assertDetailOk(superAdminToken, kr);
        assertDetailOk(superAdminToken, mn);
        assertDetailOk(superAdminToken, jp);
    }

    @Test
    void owningAgencyReadsOwnPostingAndOtherAgencyIsForbidden() throws Exception {
        assertDetailOk(krAgencyToken, kr);
        assertDetailOk(krAgencyToken, mn);
        mvc.perform(detail(jp.applicationId, krAgencyToken)).andExpect(status().isForbidden());
        mvc.perform(detail(kr.applicationId, otherAgencyToken)).andExpect(status().isForbidden());
        assertDetailOk(otherAgencyToken, jp);
    }

    @Test
    void userAndApplicantAreForbidden() throws Exception {
        mvc.perform(detail(kr.applicationId, userToken)).andExpect(status().isForbidden());
        mvc.perform(detail(kr.applicationId, applicantToken)).andExpect(status().isForbidden());
    }

    @Test
    void anonymousIsUnauthorizedAndMissingIdIsNotFound() throws Exception {
        mvc.perform(get(detailPath(kr.applicationId))).andExpect(status().isUnauthorized());
        mvc.perform(detail(UUID.randomUUID(), superAdminToken)).andExpect(status().isNotFound());
    }

    @Test
    void adminIsNotLimitedByCountryAndAgencyOutsideOwnershipIsBlocked() throws Exception {
        // 국가 관리자에 해당하는 별도 역할·할당이 없다. ADMIN 은 KR/MN/JP 모두 조회한다.
        assertDetailOk(adminToken, kr);
        assertDetailOk(adminToken, mn);
        assertDetailOk(adminToken, jp);
        // 범위 밖: 공고 소유자가 아닌 기획사. country_code 가 맞아도 통과하지 않는다.
        mvc.perform(detail(jp.applicationId, krAgencyToken)).andExpect(status().isForbidden());
    }

    @Test
    void fileAndProfileReadsFollowTheSameRule() throws Exception {
        mvc.perform(get("/api/applications/" + kr.applicationId + "/videos").header("Authorization", superAdminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].videoUrl").value(videoOf(kr)));
        mvc.perform(get("/api/applications/" + kr.applicationId).header("Authorization", superAdminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.videoUrl").value(videoOf(kr)))
                .andExpect(jsonPath("$.applicantEmail").exists());
        mvc.perform(get("/api/applications/" + kr.applicationId + "/videos").header("Authorization", otherAgencyToken))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/applications/" + kr.applicationId).header("Authorization", userToken))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/applications/" + kr.applicationId + "/videos"))
                .andExpect(status().isUnauthorized());

        assertRoundFiles(superAdminToken, status().isOk());
        mvc.perform(get(roundApplications(kr, kr.round1)).header("Authorization", otherAgencyToken))
                .andExpect(status().isForbidden());
        mvc.perform(get(roundApplications(kr, kr.round2)).header("Authorization", userToken))
                .andExpect(status().isForbidden());
        mvc.perform(get(rounds(kr))).andExpect(status().isUnauthorized());
    }

    @Test
    void superAdminCannotChangeReviewOutcome() throws Exception {
        assertReviewWritesForbidden();
        assertEquals("SUBMITTED", applicationStatus(mutable.applicationId));
        assertEquals("PASSED", submissionStatus(mutable.round1));
        assertEquals("FAILED", submissionStatus(mutable.round2));
        assertOwnerCanStillDecide();
    }

    private void assertReviewWritesForbidden() throws Exception {
        expectForbidden(post(review(mutable, "pass")).header("Authorization", superAdminToken)
                .contentType(APPLICATION_JSON).content("{}"));
        expectForbidden(post(review(mutable, "fail")).header("Authorization", superAdminToken)
                .contentType(APPLICATION_JSON).content("{\"reason\":\"no\"}"));
        expectForbidden(post(review(mutable, "hold")).header("Authorization", superAdminToken)
                .contentType(APPLICATION_JSON).content("{\"reason\":\"wait\"}"));
        expectForbidden(post("/api/applications/" + mutable.applicationId + "/decision")
                .header("Authorization", superAdminToken)
                .contentType(APPLICATION_JSON).content("{\"status\":\"ACCEPTED\"}"));
        expectForbidden(post("/api/applications/" + mutable.applicationId + "/accept")
                .header("Authorization", superAdminToken));
        expectForbidden(post("/api/applications/" + mutable.applicationId + "/reject")
                .header("Authorization", superAdminToken));
        expectForbidden(post("/api/applications/" + mutable.applicationId + "/mark-reviewed")
                .header("Authorization", superAdminToken));
        expectForbidden(patch("/api/applications/" + mutable.applicationId + "/status")
                .header("Authorization", superAdminToken)
                .contentType(APPLICATION_JSON).content("{\"status\":\"REJECTED\"}"));
    }

    private void assertOwnerCanStillDecide() throws Exception {
        mvc.perform(post("/api/applications/" + mutable.applicationId + "/decision")
                        .header("Authorization", krAgencyToken)
                        .contentType(APPLICATION_JSON).content("{\"status\":\"ACCEPTED\"}"))
                .andExpect(status().isOk());
        assertEquals("ACCEPTED", applicationStatus(mutable.applicationId));
    }

    private void expectForbidden(org.springframework.test.web.servlet.RequestBuilder request) throws Exception {
        mvc.perform(request).andExpect(status().isForbidden());
    }

    private void assertRoundFiles(String token, org.springframework.test.web.servlet.ResultMatcher ok) throws Exception {
        mvc.perform(get(rounds(kr)).header("Authorization", token)).andExpect(ok);
        mvc.perform(get(roundApplications(kr, kr.round1)).header("Authorization", token))
                .andExpect(ok)
                .andExpect(jsonPath("$[0].submissionStatus").value("PASSED"))
                .andExpect(jsonPath("$[0].videoUrl").value(VIDEO_PREFIX + "KR/round1.mp4"))
                .andExpect(jsonPath("$[0].fileUrl").value(VIDEO_PREFIX + "KR/round1.pdf"));
        mvc.perform(get(roundApplications(kr, kr.round2)).header("Authorization", token))
                .andExpect(ok)
                .andExpect(jsonPath("$[0].submissionStatus").value("FAILED"))
                .andExpect(jsonPath("$[0].fileUrl").value(VIDEO_PREFIX + "KR/round2.pdf"));
    }

    private void assertDetailOk(String token, Fixture fixture) throws Exception {
        mvc.perform(detail(fixture.applicationId, token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.nationality").value(fixture.country))
                .andExpect(jsonPath("$.data.name").value("지원자-" + fixture.country))
                .andExpect(jsonPath("$.data.videoUrl").value(videoOf(fixture)))
                .andExpect(jsonPath("$.data.introText").value("소개-" + fixture.country))
                .andExpect(jsonPath("$.data.snsLinks[0].url").value("https://instagram.com/" + fixture.country));
    }

    private org.springframework.test.web.servlet.RequestBuilder detail(UUID applicationId, String token) {
        return get(detailPath(applicationId)).header("Authorization", token);
    }

    private static String detailPath(UUID applicationId) {
        return "/api/applications/" + applicationId + "/agency-detail";
    }

    private static String rounds(Fixture fixture) {
        return "/api/admin/auditions/" + fixture.auditionId + "/rounds";
    }

    private static String roundApplications(Fixture fixture, UUID roundId) {
        return rounds(fixture) + "/" + roundId + "/applications";
    }

    private static String review(Fixture fixture, String action) {
        return "/api/admin/applications/" + fixture.applicationId + "/rounds/" + fixture.round1 + "/" + action;
    }

    private static String videoOf(Fixture fixture) {
        return VIDEO_PREFIX + fixture.country + "/video.mp4";
    }

    private String applicationStatus(UUID applicationId) {
        return jdbc.queryForObject("SELECT status FROM applications WHERE id = ?", String.class, applicationId);
    }

    private String submissionStatus(UUID roundId) {
        return jdbc.queryForObject(
                "SELECT submission_status FROM application_round_submissions WHERE round_id = ?",
                String.class, roundId);
    }

    private String token(UUID userId, String claimRole) {
        return "Bearer " + jwt.createToken(userId, "x@local.test", claimRole);
    }

    private UUID signup(String role) throws Exception {
        String nick = "az" + UUID.randomUUID().toString().replace("-", "").substring(0, 8);
        String email = nick + "@local.test";
        String body = mvc.perform(post("/api/auth/signup").contentType(APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"Localtest1!\",\"role\":\"" + role
                                + "\",\"nickname\":\"" + nick + "\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return UUID.fromString(json.readTree(body).get("userId").asText());
    }

    private Fixture seedCountry(String country, UUID ownerId) {
        UUID auditionId = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO auditions (id, owner_id, title, description, status, country_code, group_id)
                VALUES (?, ?, ?, '', 'OPEN', ?, ?)
                """, auditionId, ownerId, "audition-" + country, country, auditionId);
        UUID applicationId = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO applications (
                    id, audition_id, applicant_id, status, applicant_name, birth_date, age, nationality, intro_text
                ) VALUES (?, ?, ?, 'SUBMITTED', ?, DATE '2000-01-02', 26, ?, ?)
                """, applicationId, auditionId, applicantId, "지원자-" + country, country, "소개-" + country);
        jdbc.update("""
                INSERT INTO application_videos (id, application_id, video_url, title)
                VALUES (?, ?, ?, '제출영상')
                """, UUID.randomUUID(), applicationId, videoOf(new Fixture(country, auditionId, applicationId, null, null)));
        jdbc.update("""
                INSERT INTO application_sns_links (id, application_id, platform, url)
                VALUES (?, ?, 'instagram', ?)
                """, UUID.randomUUID(), applicationId, "https://instagram.com/" + country);
        UUID round1 = insertRound(auditionId, 1);
        UUID round2 = insertRound(auditionId, 2);
        insertSubmission(applicationId, auditionId, round1, 1, "PASSED",
                VIDEO_PREFIX + country + "/round1.mp4", VIDEO_PREFIX + country + "/round1.pdf");
        insertSubmission(applicationId, auditionId, round2, 2, "FAILED",
                VIDEO_PREFIX + country + "/round2.mp4", VIDEO_PREFIX + country + "/round2.pdf");
        return new Fixture(country, auditionId, applicationId, round1, round2);
    }

    private UUID insertRound(UUID auditionId, int number) {
        UUID roundId = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO audition_rounds (id, audition_id, round_number, review_method, round_name)
                VALUES (?, ?, ?, 'INTERNAL_REVIEW', ?)
                """, roundId, auditionId, number, number + "차");
        return roundId;
    }

    private void insertSubmission(
            UUID applicationId, UUID auditionId, UUID roundId, int number,
            String submissionStatus, String videoUrl, String fileUrl) {
        jdbc.update("""
                INSERT INTO application_round_submissions (
                    id, application_id, audition_id, round_id, round_number, submission_status, video_url, file_url
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, UUID.randomUUID(), applicationId, auditionId, roundId, number, submissionStatus, videoUrl, fileUrl);
    }

    private record Fixture(String country, UUID auditionId, UUID applicationId, UUID round1, UUID round2) {
    }
}
