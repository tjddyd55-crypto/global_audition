package com.audition.platform.application.user;

import com.audition.platform.infra.TestDatabase;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
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

@SpringBootTest
@AutoConfigureMockMvc
class ApplicantCountryTimezoneIT {

    @DynamicPropertySource
    static void props(DynamicPropertyRegistry registry) {
        TestDatabase.register(registry);
        byte[] key = new byte[64];
        new SecureRandom().nextBytes(key);
        registry.add("app.jwt.secret", () -> Base64.getUrlEncoder().withoutPadding().encodeToString(key));
        registry.add("app.super-admin.bootstrap-enabled", () -> "false");
    }

    @Autowired
    private MockMvc mvc;
    @Autowired
    private JdbcTemplate jdbc;
    @Autowired
    private ObjectMapper json;

    @BeforeEach
    void countries() {
        insert("MN", "Mongolia");
        insert("KR", "Korea");
        insert("JP", "Japan");
    }

    @AfterEach
    void cleanup() {
        jdbc.update("DELETE FROM users WHERE email LIKE '%@applicant.tz.test'");
    }

    @Test
    void signupPersistsThreePairsAndProfileReturnsThemAfterLogin() throws Exception {
        assertPair("MN", "Asia/Ulaanbaatar");
        assertPair("KR", "Asia/Seoul");
        assertPair("JP", "Asia/Tokyo");
    }

    @Test
    void invalidCountryAndTimezoneAreRejected() throws Exception {
        mvc.perform(post("/api/auth/signup").contentType(APPLICATION_JSON)
                        .content(body(nick(), "ZZ", "Asia/Seoul")))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/auth/signup").contentType(APPLICATION_JSON)
                        .content(body(nick(), "KR", "Mars/Olympus")))
                .andExpect(status().isBadRequest());
        assertEquals(0, jdbc.queryForObject(
                "SELECT COUNT(*) FROM users WHERE email LIKE '%@applicant.tz.test' AND country_code = 'ZZ'",
                Integer.class));
    }

    private void assertPair(String country, String timezone) throws Exception {
        String nickname = nick();
        String email = nickname + "@applicant.tz.test";
        String created = mvc.perform(post("/api/auth/signup").contentType(APPLICATION_JSON)
                        .content(body(nickname, country, timezone)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        JsonNode signup = json.readTree(created);
        UUID userId = UUID.fromString(signup.get("userId").asText());
        assertEquals(country, jdbc.queryForObject("SELECT country_code FROM users WHERE id = ?", String.class, userId));
        assertEquals(timezone, jdbc.queryForObject("SELECT timezone FROM users WHERE id = ?", String.class, userId));

        String loggedIn = mvc.perform(post("/api/auth/login").contentType(APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"Localtest1!\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String token = "Bearer " + json.readTree(loggedIn).get("token").asText();
        mvc.perform(get("/api/auth/me").header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.data.countryCode").value(country))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.data.timezone").value(timezone));
        mvc.perform(get("/api/me/profile").header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.data.countryCode").value(country))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.data.timezone").value(timezone));
    }

    private void insert(String code, String name) {
        jdbc.update("""
                INSERT INTO countries (code, name, status, default_currency)
                VALUES (?, ?, 'ACTIVE', 'USD')
                ON CONFLICT (code) DO NOTHING
                """, code, name);
    }

    private static String body(String nickname, String country, String timezone) {
        return "{"
                + "\"email\":\"" + nickname + "@applicant.tz.test\","
                + "\"password\":\"Localtest1!\","
                + "\"role\":\"APPLICANT\","
                + "\"nickname\":\"" + nickname + "\","
                + "\"countryCode\":\"" + country + "\","
                + "\"timezone\":\"" + timezone + "\""
                + "}";
    }

    private static String nick() {
        return "ap" + UUID.randomUUID().toString().replace("-", "").substring(0, 8);
    }
}
