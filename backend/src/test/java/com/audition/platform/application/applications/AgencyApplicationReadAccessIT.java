package com.audition.platform.application.applications;

import com.audition.platform.infra.JwtService;
import com.audition.platform.infra.TestDatabase;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterAll;
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
 * <p>role ADMIN 은 소유 기획사와 국가와 무관하게 조회가 허용된다.
 * COUNTRY_ADMIN 은 users.role 과 활성 country_admin_appointments 가 맞고,
 * 공고의 게시 지점(crm_agencies.country_code)이 그 국가일 때만 조회한다.
 * 지원자 국적, 사용자 country_code, 모집 대상 auditions.country_code 로는 허용하지 않는다.
 * 토큰 클레임은 권한 근거가 아니다.</p>
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
        seedCountryAdminScope();
    }

    @AfterAll
    void releaseAppointments() {
        if (krCountryAdminId != null) {
            endAppointment(krCountryAdminId);
        }
        if (mnCountryAdminId != null) {
            endAppointment(mnCountryAdminId);
        }
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
    private UUID krBranchOwnerId;
    private UUID krCountryAdminId;
    private UUID mnCountryAdminId;
    private String krCountryAdminToken;
    private String mnCountryAdminToken;
    private String krBranchToken;
    private BranchFixture krBranch;
    private BranchFixture mnBranch;
    private BranchFixture jpBranch;
    private BranchFixture caMutable;

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
    void countryAdminReadsOnlyTheAppointedAgencyCountry() throws Exception {
        assertBranchOk(superAdminToken, krBranch);
        assertBranchOk(superAdminToken, mnBranch);
        assertBranchOk(superAdminToken, jpBranch);

        assertBranchOk(krCountryAdminToken, krBranch);
        mvc.perform(detail(mnBranch.applicationId, krCountryAdminToken)).andExpect(status().isForbidden());
        mvc.perform(detail(jpBranch.applicationId, krCountryAdminToken)).andExpect(status().isForbidden());
        mvc.perform(detail(kr.applicationId, krCountryAdminToken)).andExpect(status().isForbidden());

        assertBranchOk(mnCountryAdminToken, mnBranch);
        mvc.perform(detail(krBranch.applicationId, mnCountryAdminToken)).andExpect(status().isForbidden());
        mvc.perform(detail(jpBranch.applicationId, mnCountryAdminToken)).andExpect(status().isForbidden());
    }

    @Test
    void twoActiveAppointmentsReadEachCountryAndNotTheOther() throws Exception {
        try {
            replaceActiveAppointment("MN", krCountryAdminId);
            assertBranchOk(krCountryAdminToken, krBranch);
            assertBranchOk(krCountryAdminToken, mnBranch);
            mvc.perform(detail(jpBranch.applicationId, krCountryAdminToken)).andExpect(status().isForbidden());
        } finally {
            endAppointment(krCountryAdminId);
            restoreAppointment(krCountryAdminId, "KR");
            restoreAppointment(mnCountryAdminId, "MN");
        }
        assertBranchOk(krCountryAdminToken, krBranch);
        mvc.perform(detail(mnBranch.applicationId, krCountryAdminToken)).andExpect(status().isForbidden());
        assertBranchOk(mnCountryAdminToken, mnBranch);
    }

    @Test
    void agencyReadsOnlyItsOwnBranchAndStrangersStayOut() throws Exception {
        assertBranchOk(krBranchToken, krBranch);
        mvc.perform(detail(mnBranch.applicationId, krBranchToken)).andExpect(status().isForbidden());
        mvc.perform(detail(jpBranch.applicationId, krBranchToken)).andExpect(status().isForbidden());
        mvc.perform(detail(krBranch.applicationId, userToken)).andExpect(status().isForbidden());
        mvc.perform(get(detailPath(krBranch.applicationId))).andExpect(status().isUnauthorized());
        mvc.perform(detail(UUID.randomUUID(), krCountryAdminToken)).andExpect(status().isNotFound());
    }

    @Test
    void endedAppointmentAndRoleLossApplyOnTheNextRequest() throws Exception {
        try {
            endAppointment(krCountryAdminId);
            mvc.perform(detail(krBranch.applicationId, krCountryAdminToken)).andExpect(status().isForbidden());
            restoreAppointment(krCountryAdminId, "KR");
            jdbc.update("UPDATE users SET role = 'USER' WHERE id = ?", krCountryAdminId);
            mvc.perform(detail(krBranch.applicationId, krCountryAdminToken)).andExpect(status().isForbidden());
        } finally {
            jdbc.update("UPDATE users SET role = 'COUNTRY_ADMIN' WHERE id = ?", krCountryAdminId);
            restoreAppointment(krCountryAdminId, "KR");
        }
        assertBranchOk(krCountryAdminToken, krBranch);
    }

    @Test
    void countryAdminVideoAndRoundReadsFollowTheSameCountry() throws Exception {
        mvc.perform(get("/api/applications/" + krBranch.applicationId + "/videos")
                        .header("Authorization", krCountryAdminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].videoUrl").value(branchVideo(krBranch)));
        mvc.perform(get("/api/applications/" + mnBranch.applicationId + "/videos")
                        .header("Authorization", krCountryAdminToken))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/applications/" + krBranch.applicationId).header("Authorization", krCountryAdminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.videoUrl").value(branchVideo(krBranch)))
                .andExpect(jsonPath("$.nationality").value(krBranch.nationality));
        mvc.perform(get("/api/applications/" + jpBranch.applicationId).header("Authorization", mnCountryAdminToken))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/applications/" + jpBranch.applicationId + "/videos"))
                .andExpect(status().isUnauthorized());

        mvc.perform(get(rounds(krBranch.auditionId)).header("Authorization", krCountryAdminToken))
                .andExpect(status().isOk());
        mvc.perform(get(roundApplications(krBranch.auditionId, krBranch.round1))
                        .header("Authorization", krCountryAdminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].videoUrl").value(VIDEO_PREFIX + "KR-branch/round1.mp4"))
                .andExpect(jsonPath("$[0].fileUrl").value(VIDEO_PREFIX + "KR-branch/round1.pdf"));
        mvc.perform(get(rounds(jpBranch.auditionId)).header("Authorization", krCountryAdminToken))
                .andExpect(status().isForbidden());
        mvc.perform(get(roundApplications(mnBranch.auditionId, mnBranch.round1))
                        .header("Authorization", krCountryAdminToken))
                .andExpect(status().isForbidden());
        mvc.perform(get(rounds(mnBranch.auditionId)).header("Authorization", mnCountryAdminToken))
                .andExpect(status().isOk());
        mvc.perform(get(roundApplications(krBranch.auditionId, krBranch.round1))
                        .header("Authorization", mnCountryAdminToken))
                .andExpect(status().isForbidden());
        mvc.perform(get(roundApplications(jpBranch.auditionId, jpBranch.round1)).header("Authorization", userToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void countryAdminCannotChangeReviewOutcome() throws Exception {
        expectForbidden(post(review(caMutable, "pass")).header("Authorization", krCountryAdminToken)
                .contentType(APPLICATION_JSON).content("{}"));
        expectForbidden(post(review(caMutable, "fail")).header("Authorization", krCountryAdminToken)
                .contentType(APPLICATION_JSON).content("{\"reason\":\"no\"}"));
        expectForbidden(post(review(caMutable, "hold")).header("Authorization", krCountryAdminToken)
                .contentType(APPLICATION_JSON).content("{\"reason\":\"wait\"}"));
        expectForbidden(post("/api/applications/" + caMutable.applicationId + "/decision")
                .header("Authorization", krCountryAdminToken)
                .contentType(APPLICATION_JSON).content("{\"status\":\"ACCEPTED\"}"));
        expectForbidden(post("/api/applications/" + caMutable.applicationId + "/accept")
                .header("Authorization", krCountryAdminToken));
        expectForbidden(post("/api/applications/" + caMutable.applicationId + "/reject")
                .header("Authorization", krCountryAdminToken));
        expectForbidden(post("/api/applications/" + caMutable.applicationId + "/mark-reviewed")
                .header("Authorization", krCountryAdminToken));
        expectForbidden(patch("/api/applications/" + caMutable.applicationId + "/status")
                .header("Authorization", krCountryAdminToken)
                .contentType(APPLICATION_JSON).content("{\"status\":\"REJECTED\"}"));
        expectForbidden(post(review(caMutable, "pass")).header("Authorization", mnCountryAdminToken)
                .contentType(APPLICATION_JSON).content("{}"));

        assertEquals("SUBMITTED", applicationStatus(caMutable.applicationId));
        assertEquals("PASSED", submissionStatus(caMutable.round1));
        assertEquals("FAILED", submissionStatus(caMutable.round2));

        mvc.perform(post("/api/applications/" + caMutable.applicationId + "/decision")
                        .header("Authorization", krBranchToken)
                        .contentType(APPLICATION_JSON).content("{\"status\":\"ACCEPTED\"}"))
                .andExpect(status().isOk());
        assertEquals("ACCEPTED", applicationStatus(caMutable.applicationId));
    }

    @Test
    void adminIsNotLimitedByCountryAndAgencyOutsideOwnershipIsBlocked() throws Exception {
        // role ADMIN 은 국가 관리자가 아니다. 임명 국가와 무관하게 KR/MN/JP 를 조회한다.
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
        return rounds(fixture.auditionId);
    }

    private static String rounds(UUID auditionId) {
        return "/api/admin/auditions/" + auditionId + "/rounds";
    }

    private static String roundApplications(Fixture fixture, UUID roundId) {
        return roundApplications(fixture.auditionId, roundId);
    }

    private static String roundApplications(UUID auditionId, UUID roundId) {
        return rounds(auditionId) + "/" + roundId + "/applications";
    }

    private static String review(Fixture fixture, String action) {
        return "/api/admin/applications/" + fixture.applicationId + "/rounds/" + fixture.round1 + "/" + action;
    }

    private static String review(BranchFixture fixture, String action) {
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

    private void seedCountryAdminScope() throws Exception {
        ensureCountry("KR", "KRW");
        ensureCountry("MN", "MNT");
        ensureCountry("JP", "JPY");

        krBranchOwnerId = signup("APPLICANT");
        UUID mnOwner = signup("APPLICANT");
        UUID jpOwner = signup("APPLICANT");
        krCountryAdminId = signup("APPLICANT");
        mnCountryAdminId = signup("APPLICANT");
        jdbc.update("UPDATE users SET role = 'AGENCY', country_code = 'JP' WHERE id = ?", krBranchOwnerId);
        jdbc.update("UPDATE users SET role = 'AGENCY', country_code = 'KR' WHERE id = ?", mnOwner);
        jdbc.update("UPDATE users SET role = 'AGENCY', country_code = 'MN' WHERE id = ?", jpOwner);
        jdbc.update("UPDATE users SET role = 'COUNTRY_ADMIN', country_code = 'US' WHERE id = ?", krCountryAdminId);
        jdbc.update("UPDATE users SET role = 'COUNTRY_ADMIN', country_code = 'US' WHERE id = ?", mnCountryAdminId);

        krCountryAdminToken = token(krCountryAdminId, "SUPER_ADMIN");
        mnCountryAdminToken = token(mnCountryAdminId, "ADMIN");
        krBranchToken = token(krBranchOwnerId, "USER");

        UUID krAgency = insertAgency("KR", krBranchOwnerId);
        UUID mnAgency = insertAgency("MN", mnOwner);
        UUID jpAgency = insertAgency("JP", jpOwner);
        replaceActiveAppointment("KR", krCountryAdminId);
        replaceActiveAppointment("MN", mnCountryAdminId);

        krBranch = seedBranch("KR", "JP", "MN", krBranchOwnerId, krAgency);
        mnBranch = seedBranch("MN", "KR", "JP", mnOwner, mnAgency);
        jpBranch = seedBranch("JP", "KR", "KR", jpOwner, jpAgency);
        caMutable = seedBranch("KR", "JP", "MN", krBranchOwnerId, krAgency);
    }

    private void ensureCountry(String code, String currency) {
        jdbc.update("""
                INSERT INTO countries (code, name, status, default_currency)
                VALUES (?, ?, 'ACTIVE', ?)
                ON CONFLICT (code) DO NOTHING
                """, code, code, currency);
    }

    private UUID insertAgency(String country, UUID linkedUserId) {
        UUID id = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO crm_agencies (id, country_code, display_name, stage, approval_state, linked_user_id)
                VALUES (?, ?, ?, 'ACTIVE', 'APPROVED', ?)
                """, id, country, "read-scope-" + country, linkedUserId);
        return id;
    }

    private void replaceActiveAppointment(String country, UUID userId) {
        endActiveCountry(country);
        jdbc.update("""
                INSERT INTO country_admin_appointments (id, country_code, user_id, status)
                VALUES (?, ?, ?, 'ACTIVE')
                """, UUID.randomUUID(), country, userId);
    }

    private void endActiveCountry(String country) {
        jdbc.update("""
                UPDATE country_admin_appointments
                SET status = 'ENDED', ended_at = NOW(), end_reason = 'IT_REPLACE'
                WHERE country_code = ? AND status = 'ACTIVE'
                """, country);
    }

    private void endAppointment(UUID userId) {
        jdbc.update("""
                UPDATE country_admin_appointments
                SET status = 'ENDED', ended_at = NOW(), end_reason = 'REVOKED'
                WHERE user_id = ? AND status = 'ACTIVE'
                """, userId);
    }

    private void restoreAppointment(UUID userId, String country) {
        endActiveCountry(country);
        jdbc.update("""
                UPDATE country_admin_appointments
                SET status = 'ACTIVE', ended_at = NULL, end_reason = NULL
                WHERE id = (
                    SELECT id FROM country_admin_appointments
                    WHERE user_id = ? AND country_code = ?
                    ORDER BY appointed_at DESC
                    LIMIT 1
                )
                """, userId, country);
    }

    private void assertBranchOk(String token, BranchFixture fixture) throws Exception {
        mvc.perform(detail(fixture.applicationId, token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.nationality").value(fixture.nationality))
                .andExpect(jsonPath("$.data.name").value("지원자-" + fixture.legalCountry))
                .andExpect(jsonPath("$.data.videoUrl").value(branchVideo(fixture)));
    }

    private static String branchVideo(BranchFixture fixture) {
        return VIDEO_PREFIX + fixture.legalCountry + "-branch/video.mp4";
    }

    private BranchFixture seedBranch(
            String legalCountry, String audienceCountry, String nationality, UUID ownerId, UUID branchId) {
        UUID auditionId = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO auditions (
                    id, owner_id, title, description, status, country_code, group_id, posting_branch_id
                ) VALUES (?, ?, ?, '', 'OPEN', ?, ?, ?)
                """, auditionId, ownerId, "branch-" + legalCountry, audienceCountry, auditionId, branchId);
        UUID applicationId = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO applications (
                    id, audition_id, applicant_id, status, applicant_name, birth_date, age, nationality, intro_text
                ) VALUES (?, ?, ?, 'SUBMITTED', ?, DATE '2000-01-02', 26, ?, ?)
                """, applicationId, auditionId, applicantId, "지원자-" + legalCountry, nationality, "소개-" + legalCountry);
        jdbc.update("""
                INSERT INTO application_videos (id, application_id, video_url, title)
                VALUES (?, ?, ?, '제출영상')
                """, UUID.randomUUID(), applicationId, branchVideo(new BranchFixture(
                legalCountry, audienceCountry, nationality, auditionId, applicationId, null, null)));
        UUID round1 = insertRound(auditionId, 1);
        UUID round2 = insertRound(auditionId, 2);
        String prefix = VIDEO_PREFIX + legalCountry + "-branch/";
        insertSubmission(applicationId, auditionId, round1, 1, "PASSED", prefix + "round1.mp4", prefix + "round1.pdf");
        insertSubmission(applicationId, auditionId, round2, 2, "FAILED", prefix + "round2.mp4", prefix + "round2.pdf");
        return new BranchFixture(legalCountry, audienceCountry, nationality, auditionId, applicationId, round1, round2);
    }

    private record BranchFixture(
            String legalCountry,
            String audienceCountry,
            String nationality,
            UUID auditionId,
            UUID applicationId,
            UUID round1,
            UUID round2) {
    }
}
