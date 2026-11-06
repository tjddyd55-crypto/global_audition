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
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** 거주 국가·시간대는 국적과 따로 저장되고, countries 와 ZoneId 검증을 그대로 쓴다. */
@SpringBootTest
@AutoConfigureMockMvc
class ProfileResidenceIT {

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
        jdbc.update("DELETE FROM users WHERE email LIKE '%@profile.residence.test'");
    }

    @Test
    void residenceIsStoredSeparatelyFromNationality() throws Exception {
        String token = signup();
        UUID userId = userId();
        mvc.perform(patch("/api/me/profile").header("Authorization", token).contentType(APPLICATION_JSON)
                        .content("{\"nationality\":\"KR\"}"))
                .andExpect(status().isOk());
        mvc.perform(patch("/api/me/profile").header("Authorization", token).contentType(APPLICATION_JSON)
                        .content("{\"countryCode\":\"jp\",\"timezone\":\" Asia/Tokyo \"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.countryCode").value("JP"))
                .andExpect(jsonPath("$.data.timezone").value("Asia/Tokyo"))
                .andExpect(jsonPath("$.data.nationality").value("KR"));
        assertEquals("JP", jdbc.queryForObject("SELECT country_code FROM users WHERE id = ?", String.class, userId));
        assertEquals("Asia/Tokyo", jdbc.queryForObject("SELECT timezone FROM users WHERE id = ?", String.class, userId));
        assertEquals("KR", jdbc.queryForObject("SELECT nationality FROM users WHERE id = ?", String.class, userId));

        mvc.perform(patch("/api/me/profile").header("Authorization", token).contentType(APPLICATION_JSON)
                        .content("{\"countryCode\":\"ZZ\"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(patch("/api/me/profile").header("Authorization", token).contentType(APPLICATION_JSON)
                        .content("{\"timezone\":\"Mars/Olympus\"}"))
                .andExpect(status().isBadRequest());
        assertEquals("JP", jdbc.queryForObject("SELECT country_code FROM users WHERE id = ?", String.class, userId));
        assertEquals("Asia/Tokyo", jdbc.queryForObject("SELECT timezone FROM users WHERE id = ?", String.class, userId));

        mvc.perform(patch("/api/me/profile").header("Authorization", token).contentType(APPLICATION_JSON)
                        .content("{\"countryCode\":\"\",\"timezone\":\"\"}"))
                .andExpect(status().isOk());
        assertNull(jdbc.queryForObject("SELECT country_code FROM users WHERE id = ?", String.class, userId));
        assertNull(jdbc.queryForObject("SELECT timezone FROM users WHERE id = ?", String.class, userId));
        assertEquals("KR", jdbc.queryForObject("SELECT nationality FROM users WHERE id = ?", String.class, userId));
    }

    private String signup() throws Exception {
        String nickname = "pr" + UUID.randomUUID().toString().replace("-", "").substring(0, 8);
        String created = mvc.perform(post("/api/auth/signup").contentType(APPLICATION_JSON)
                        .content("{\"email\":\"" + nickname + "@profile.residence.test\",\"password\":\"Localtest1!\","
                                + "\"role\":\"APPLICANT\",\"nickname\":\"" + nickname + "\",\"countryCode\":\"MN\","
                                + "\"timezone\":\"Asia/Ulaanbaatar\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        JsonNode body = json.readTree(created);
        String loggedIn = mvc.perform(post("/api/auth/login").contentType(APPLICATION_JSON)
                        .content("{\"email\":\"" + nickname + "@profile.residence.test\",\"password\":\"Localtest1!\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertEquals(body.get("userId").asText(), jdbc.queryForObject(
                "SELECT id::text FROM users WHERE email = ?", String.class, nickname + "@profile.residence.test"));
        return "Bearer " + json.readTree(loggedIn).get("token").asText();
    }

    private UUID userId() {
        return jdbc.queryForObject(
                "SELECT id FROM users WHERE email LIKE '%@profile.residence.test'", UUID.class);
    }

    private void insert(String code, String name) {
        jdbc.update("""
                INSERT INTO countries (code, name, status, default_currency)
                VALUES (?, ?, 'ACTIVE', 'USD')
                ON CONFLICT (code) DO NOTHING
                """, code, name);
    }
}
