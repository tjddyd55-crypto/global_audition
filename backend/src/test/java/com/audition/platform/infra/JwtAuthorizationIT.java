package com.audition.platform.infra;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeAll;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * JWT role claim 이 DB 권한을 덮어쓰지 못함을 실제 SecurityConfig + 로컬 Postgres 로 검증한다.
 * 서명키는 실행마다 새로 만든 테스트 전용 무작위 값이다.
 */
@SpringBootTest
@AutoConfigureMockMvc
class JwtAuthorizationIT {

    private static final String SUPER_ADMIN_API = "/api/admin/users";

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

    @BeforeAll
    static void guard() {
        TestDatabase.assertLocal();
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
    void tamperedSuperAdminClaimOnApplicantIsForbidden() throws Exception {
        UUID applicant = signup("APPLICANT");
        String forged = jwt.createToken(applicant, "x@local.test", "SUPER_ADMIN");
        mvc.perform(get(SUPER_ADMIN_API).header("Authorization", "Bearer " + forged))
                .andExpect(status().isForbidden());
    }

    @Test
    void jwtRoleNeverOverridesDatabaseRole() throws Exception {
        UUID applicant = signup("APPLICANT");
        String forged = jwt.createToken(applicant, "x@local.test", "AGENCY");
        // AGENCY/ADMIN 전용 조회: DB가 APPLICANT 이므로 claim AGENCY 는 무시되어야 한다.
        mvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + forged))
                .andExpect(status().isOk())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers
                        .jsonPath("$.data.role").value(org.hamcrest.Matchers.not("AGENCY")));
        mvc.perform(get("/api/auditions").param("status", "CLOSED").header("Authorization", "Bearer " + forged))
                .andExpect(status().isForbidden());
    }

    @Test
    void applicantWithHonestTokenGets403OnSuperAdminApi() throws Exception {
        UUID applicant = signup("APPLICANT");
        String token = jwt.createToken(applicant, "x@local.test", "APPLICANT");
        mvc.perform(get(SUPER_ADMIN_API).header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void suspendedUserIs401() throws Exception {
        UUID user = signup("APPLICANT");
        String token = jwt.createToken(user, "x@local.test", "SUPER_ADMIN");
        jdbc.update("UPDATE users SET role = 'SUPER_ADMIN', account_status = 'SUSPENDED' WHERE id = ?", user);
        mvc.perform(get(SUPER_ADMIN_API).header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void softDeletedAndHardDeletedUsersAre401() throws Exception {
        UUID soft = signup("APPLICANT");
        String softToken = jwt.createToken(soft, "x@local.test", "SUPER_ADMIN");
        jdbc.update("UPDATE users SET role = 'SUPER_ADMIN', account_status = 'DELETED' WHERE id = ?", soft);
        mvc.perform(get(SUPER_ADMIN_API).header("Authorization", "Bearer " + softToken))
                .andExpect(status().isUnauthorized());

        UUID gone = UUID.randomUUID();
        assertEquals(0, jdbc.queryForObject("SELECT COUNT(*) FROM users WHERE id = ?", Integer.class, gone));
        String goneToken = jwt.createToken(gone, "x@local.test", "SUPER_ADMIN");
        mvc.perform(get(SUPER_ADMIN_API).header("Authorization", "Bearer " + goneToken))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void realSuperAdminIsAllowed() throws Exception {
        UUID admin = signup("APPLICANT");
        jdbc.update("UPDATE users SET role = 'SUPER_ADMIN' WHERE id = ?", admin);
        // claim 은 APPLICANT 여도 DB 권한(SUPER_ADMIN)이 기준이다.
        String token = jwt.createToken(admin, "x@local.test", "APPLICANT");
        mvc.perform(get(SUPER_ADMIN_API).header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    void unknownApiPathIs401WhenAnonymousAnd404WhenAuthenticated() throws Exception {
        // 미인증: 존재 여부와 무관하게 보안 필터가 먼저 401 (경로 탐색·우회 불가)
        mvc.perform(get("/api/no-such-endpoint-zz")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/admin/no-such-endpoint-zz")).andExpect(status().isUnauthorized());
        UUID applicant = signup("APPLICANT");
        String token = jwt.createToken(applicant, "x@local.test", "APPLICANT");
        // 인증됨 + 매핑 없음: 500 이 아니라 404
        mvc.perform(get("/api/no-such-endpoint-zz").header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
        // 기존 보호 API 는 여전히 403
        mvc.perform(get(SUPER_ADMIN_API).header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
        mvc.perform(get(SUPER_ADMIN_API)).andExpect(status().isUnauthorized());
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
}
