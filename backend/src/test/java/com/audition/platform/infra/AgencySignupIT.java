package com.audition.platform.infra;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
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
 * 공개 가입으로 AGENCY/관리자 역할을 얻을 수 없고, 슈퍼관리자 PATCH 로만 AGENCY 를 부여함을 검증한다.
 */
@SpringBootTest
@AutoConfigureMockMvc
class AgencySignupIT {

    /** AGENCY/ADMIN 만 볼 수 있는 조회. */
    private static final String AGENCY_API = "/api/auditions/mine";

    @DynamicPropertySource
    static void props(DynamicPropertyRegistry r) {
        TestDatabase.register(r);
        byte[] key = new byte[64];
        new SecureRandom().nextBytes(key);
        String secret = Base64.getUrlEncoder().withoutPadding().encodeToString(key);
        r.add("app.jwt.secret", () -> secret);
        r.add("app.credits.allow-legacy-self-charge", () -> "false");
        r.add("app.super-admin.bootstrap-enabled", () -> "false");
    }

    @Autowired
    private MockMvc mvc;
    @Autowired
    private JdbcTemplate jdbc;
    @Autowired
    private JwtService jwt;
    @Autowired
    private ObjectMapper json;

    @Test
    void applicantSignupWorksAndStoresApplicant() throws Exception {
        String nick = nick();
        String body = mvc.perform(signup(nick, "APPLICANT")).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertEquals("APPLICANT", dbRole(UUID.fromString(json.readTree(body).get("userId").asText())));
        mvc.perform(post("/api/auth/login").contentType(APPLICATION_JSON)
                        .content("{\"email\":\"" + nick + "@local.test\",\"password\":\"Localtest1!\"}"))
                .andExpect(status().isOk());
    }

    @Test
    void agencySelectionAndTamperedRolesCreateNoAccount() throws Exception {
        for (String role : new String[]{"AGENCY", "agency", "SUPER_ADMIN", "ADMIN", "COUNTRY_ADMIN", "USER"}) {
            String nick = nick();
            int code = mvc.perform(signup(nick, role)).andReturn().getResponse().getStatus();
            if (code != 403 && code != 422) {
                throw new AssertionError(role + " signup returned " + code);
            }
            assertEquals(0, jdbc.queryForObject(
                    "SELECT COUNT(*) FROM users WHERE email = ?", Integer.class, nick + "@local.test"));
        }
        mvc.perform(signup(nick(), "AGENCY"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.startsWith("AGENCY_SIGNUP_NOT_AVAILABLE")));
    }

    @Test
    void newApplicantCannotUseAgencyApiEvenWithForgedClaim() throws Exception {
        UUID user = applicant();
        mvc.perform(get(AGENCY_API).header("Authorization", "Bearer " + jwt.createToken(user, "x@local.test", "APPLICANT")))
                .andExpect(status().isForbidden());
        mvc.perform(get(AGENCY_API).header("Authorization", "Bearer " + jwt.createToken(user, "x@local.test", "AGENCY")))
                .andExpect(status().isForbidden());
    }

    @Test
    void existingAgencyAndSuperAdminKeepAccess() throws Exception {
        UUID agency = applicant();
        UUID admin = applicant();
        // 기존 운영 데이터 상태를 흉내 낸다 (이 PR 이전 가입·승인된 계정).
        jdbc.update("UPDATE users SET role = 'AGENCY' WHERE id = ?", agency);
        jdbc.update("UPDATE users SET role = 'SUPER_ADMIN' WHERE id = ?", admin);
        mvc.perform(get(AGENCY_API).header("Authorization", "Bearer " + jwt.createToken(agency, "a@local.test", "AGENCY")))
                .andExpect(status().isOk());
        mvc.perform(get("/api/admin/users").header("Authorization", "Bearer " + jwt.createToken(admin, "s@local.test", "SUPER_ADMIN")))
                .andExpect(status().isOk());
    }

    @Test
    void onlySuperAdminCanGrantAgencyAndAccessFollowsDatabase() throws Exception {
        UUID target = applicant();
        UUID other = applicant();
        UUID agency = applicant();
        jdbc.update("UPDATE users SET role = 'AGENCY' WHERE id = ?", agency);
        String grant = "{\"role\":\"AGENCY\"}";

        mvc.perform(patch("/api/admin/users/" + target).contentType(APPLICATION_JSON).content(grant))
                .andExpect(status().isUnauthorized());
        mvc.perform(patch("/api/admin/users/" + target).contentType(APPLICATION_JSON).content(grant)
                        .header("Authorization", "Bearer " + jwt.createToken(other, "o@local.test", "SUPER_ADMIN")))
                .andExpect(status().isForbidden());
        mvc.perform(patch("/api/admin/users/" + target).contentType(APPLICATION_JSON).content(grant)
                        .header("Authorization", "Bearer " + jwt.createToken(agency, "a@local.test", "AGENCY")))
                .andExpect(status().isForbidden());
        assertEquals("APPLICANT", dbRole(target));

        UUID admin = applicant();
        jdbc.update("UPDATE users SET role = 'SUPER_ADMIN' WHERE id = ?", admin);
        String adminToken = "Bearer " + jwt.createToken(admin, "s@local.test", "SUPER_ADMIN");
        mvc.perform(patch("/api/admin/users/" + target).contentType(APPLICATION_JSON)
                        .content("{\"role\":\"SUPER_ADMIN\"}").header("Authorization", adminToken))
                .andExpect(status().isUnprocessableEntity());
        mvc.perform(patch("/api/admin/users/" + admin).contentType(APPLICATION_JSON)
                        .content("{\"role\":\"AGENCY\"}").header("Authorization", adminToken))
                .andExpect(status().isForbidden());
        assertEquals("SUPER_ADMIN", dbRole(admin));

        // 부여 전 토큰(claim APPLICANT)으로도, 부여 후 DB 역할 기준으로 접근이 열린다.
        String targetToken = "Bearer " + jwt.createToken(target, "t@local.test", "APPLICANT");
        mvc.perform(get(AGENCY_API).header("Authorization", targetToken)).andExpect(status().isForbidden());
        mvc.perform(patch("/api/admin/users/" + target).contentType(APPLICATION_JSON).content(grant)
                        .header("Authorization", adminToken))
                .andExpect(status().isOk());
        assertEquals("AGENCY", dbRole(target));
        mvc.perform(get(AGENCY_API).header("Authorization", targetToken)).andExpect(status().isOk());
        assertEquals(1, jdbc.queryForObject(
                "SELECT COUNT(*) FROM admin_logs WHERE target_id = ?", Integer.class, target.toString()));

        mvc.perform(patch("/api/admin/users/" + target).contentType(APPLICATION_JSON)
                        .content("{\"role\":\"APPLICANT\"}").header("Authorization", adminToken))
                .andExpect(status().isOk());
        mvc.perform(get(AGENCY_API).header("Authorization", targetToken)).andExpect(status().isForbidden());
    }

    private org.springframework.test.web.servlet.RequestBuilder signup(String nick, String role) {
        return post("/api/auth/signup").contentType(APPLICATION_JSON)
                .content("{\"email\":\"" + nick + "@local.test\",\"password\":\"Localtest1!\",\"role\":\"" + role
                        + "\",\"nickname\":\"" + nick + "\"}");
    }

    private UUID applicant() throws Exception {
        String body = mvc.perform(signup(nick(), "APPLICANT")).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return UUID.fromString(json.readTree(body).get("userId").asText());
    }

    private String dbRole(UUID id) {
        return jdbc.queryForObject("SELECT role FROM users WHERE id = ?", String.class, id);
    }

    private static String nick() {
        return "ag" + UUID.randomUUID().toString().replace("-", "").substring(0, 8);
    }
}
