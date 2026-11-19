package com.audition.platform.infra;

import com.fasterxml.jackson.databind.JsonNode;
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
import java.time.LocalDate;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** 가입 동의 분리 · 국가별 미성년자 정책 · 보호자 확인 링크 · 개인정보 및 공개 설정(실제 SecurityConfig + 로컬 Postgres). */
@SpringBootTest
@AutoConfigureMockMvc
class MinorPolicyConsentIT {

    private static final String DOMAIN = "@minor.policy.test";

    @DynamicPropertySource
    static void props(DynamicPropertyRegistry r) {
        TestDatabase.register(r);
        byte[] key = new byte[64];
        new SecureRandom().nextBytes(key);
        String secret = Base64.getUrlEncoder().withoutPadding().encodeToString(key);
        r.add("app.jwt.secret", () -> secret);
        r.add("app.super-admin.bootstrap-enabled", () -> "false");
    }

    @BeforeAll
    static void guard() {
        TestDatabase.assertLocal();
    }

    @Autowired private MockMvc mvc;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private ObjectMapper json;

    @org.junit.jupiter.api.BeforeEach
    void seedCountry() {
        jdbc.update("""
                INSERT INTO countries (code, name, status, default_currency) VALUES ('KR', 'Korea', 'ACTIVE', 'KRW')
                ON CONFLICT (code) DO NOTHING
                """);
    }

    @Test
    void signupRequiresSeparatedConsentsAndBirthDate() throws Exception {
        mvc.perform(post("/api/auth/signup").contentType(APPLICATION_JSON)
                        .content(body(nick(), "1995-05-05", "KR", false)))
                .andExpect(status().isUnprocessableEntity());
        mvc.perform(post("/api/auth/signup").contentType(APPLICATION_JSON)
                        .content(body(nick(), null, "KR", true)))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test
    void krChildSignsUpAndGuardianConfirmsOnSeparatePage() throws Exception {
        String nick = nick();
        JsonNode res = signup(nick, LocalDate.now().minusYears(12).toString(), "KR");
        assertTrue(res.get("guardianRequired").asBoolean(), "KR 14세 미만 → 보호자 확인 필요(가입은 허용)");
        String token = res.get("token").asText();
        UUID me = UUID.fromString(res.get("userId").asText());

        List<String> types = jdbc.queryForList("SELECT consent_type FROM user_consents WHERE user_id = ? ORDER BY consent_type",
                String.class, me);
        assertEquals(List.of("PRIVACY_COLLECTION", "PRIVACY_DISCLOSURE", "TERMS_OF_SERVICE"), types,
                "본인 체크는 보호자 동의로 기록하지 않는다. 마케팅은 선택하지 않았다");

        JsonNode privacy = getPrivacy(token);
        assertFalse(privacy.get("talentSearchVisible").asBoolean(), "신규 회원 검색 노출 기본 OFF");
        assertFalse(privacy.get("castingOffersEnabled").asBoolean(), "신규 회원 제안 수신 기본 OFF");
        assertTrue(privacy.get("minor").get("guardianLegallyRequired").asBoolean());
        assertFalse(privacy.get("minor").get("applyAllowed").asBoolean());
        assertEquals("KR", privacy.get("minor").get("policyCountry").asText());

        mvc.perform(put("/api/me/privacy").header("Authorization", "Bearer " + token).contentType(APPLICATION_JSON)
                        .content("{\"talentSearchVisible\":true}"))
                .andExpect(status().isUnprocessableEntity());

        String link = json.readTree(mvc.perform(post("/api/me/guardian/request").header("Authorization", "Bearer " + token)
                        .contentType(APPLICATION_JSON).content("{\"guardianName\":\"[IT] 부모\",\"relationship\":\"PARENT\"}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString()).get("token").asText();
        JsonNode pub = json.readTree(mvc.perform(get("/api/auth/guardian/" + link)).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString());
        assertEquals("PENDING", pub.get("status").asText());
        assertFalse(pub.has("birthDate"), "보호자 페이지에 생년월일을 내보내지 않는다");

        String confirm = "{\"guardianName\":\"[IT] 부모\",\"relationship\":\"PARENT\",\"agreeGuardian\":true,"
                + "\"agreeTerms\":true,\"agreePrivacy\":true}";
        mvc.perform(post("/api/auth/guardian/" + link + "/confirm").header("Authorization", "Bearer " + token)
                        .contentType(APPLICATION_JSON).content(confirm))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/auth/guardian/" + link + "/confirm").contentType(APPLICATION_JSON)
                        .content("{\"guardianName\":\"[IT] 부모\",\"agreeGuardian\":true}"))
                .andExpect(status().isUnprocessableEntity());
        mvc.perform(post("/api/auth/guardian/" + link + "/confirm").contentType(APPLICATION_JSON).content(confirm))
                .andExpect(status().isOk());
        assertEquals("GUARDIAN_LINK", jdbc.queryForObject(
                "SELECT source FROM user_consents WHERE user_id = ? AND consent_type = 'GUARDIAN_CONSENT'", String.class, me));
        mvc.perform(post("/api/auth/guardian/" + link + "/confirm").contentType(APPLICATION_JSON).content(confirm))
                .andExpect(status().isConflict());

        JsonNode after = json.readTree(mvc.perform(put("/api/me/privacy").header("Authorization", "Bearer " + token)
                        .contentType(APPLICATION_JSON)
                        .content("{\"channelPublic\":true,\"talentSearchVisible\":true,\"castingOffersEnabled\":true,"
                                + "\"showGender\":true,\"gender\":\"female\",\"showBio\":false,\"showSns\":false}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        assertTrue(after.get("talentSearchVisible").asBoolean());
        assertTrue(after.get("castingOffersEnabled").asBoolean());
        assertTrue(after.get("showGender").asBoolean());
        assertFalse(after.get("showBio").asBoolean());
        assertEquals("FEMALE", after.get("gender").asText());
        assertFalse(after.get("minor").get("contactSharingAllowed").asBoolean(), "미성년자 연락처 공유는 기본 불가");
        String shown = jdbc.queryForObject("SELECT array_to_string(channel_shown_fields, ',') FROM users WHERE id = ?",
                String.class, me);
        assertTrue(shown.contains("GENDER"));
        assertFalse(shown.contains("SHORT_BIO") || shown.contains("SNS"));

        mvc.perform(post("/api/auth/guardian/" + link + "/revoke")).andExpect(status().isOk());
        JsonNode revoked = getPrivacy(token);
        assertFalse(revoked.get("talentSearchVisible").asBoolean(), "보호자 철회 → 검색 노출 다시 OFF");
        assertFalse(revoked.get("castingOffersEnabled").asBoolean(), "보호자 철회 → 제안 수신 다시 OFF");
        assertEquals("REVOKED", revoked.get("guardian").get("status").asText());
    }

    @Test
    void krTeenNeedsGuardianOnlyForOffersAndAdultNeedsNone() throws Exception {
        JsonNode teen = signup(nick(), LocalDate.now().minusYears(16).toString(), "KR");
        String t = teen.get("token").asText();
        assertFalse(teen.get("guardianRequired").asBoolean(), "KR 14~18세는 가입·지원에 보호자 확인 불필요(Dev 기본값)");
        mvc.perform(put("/api/me/privacy").header("Authorization", "Bearer " + t).contentType(APPLICATION_JSON)
                .content("{\"talentSearchVisible\":true}")).andExpect(status().isOk());
        mvc.perform(put("/api/me/privacy").header("Authorization", "Bearer " + t).contentType(APPLICATION_JSON)
                .content("{\"castingOffersEnabled\":true}")).andExpect(status().isUnprocessableEntity());
        JsonNode p = getPrivacy(t);
        assertTrue(p.get("minor").get("minor").asBoolean());
        assertTrue(p.get("minor").get("applyAllowed").asBoolean());
        assertEquals("CASTING_GUARDIAN_REQUIRED", p.get("minor").get("offersBlockReason").asText());

        JsonNode adult = signup(nick(), "1990-02-02", "KR");
        String a = adult.get("token").asText();
        mvc.perform(post("/api/me/guardian/request").header("Authorization", "Bearer " + a)
                .contentType(APPLICATION_JSON).content("{}")).andExpect(status().isUnprocessableEntity());
        mvc.perform(put("/api/me/privacy").header("Authorization", "Bearer " + a).contentType(APPLICATION_JSON)
                .content("{\"castingOffersEnabled\":true}")).andExpect(status().isOk());
        mvc.perform(post("/api/me/consents").header("Authorization", "Bearer " + a).contentType(APPLICATION_JSON)
                .content("{\"type\":\"PRIVACY_DISCLOSURE\",\"agree\":false}")).andExpect(status().isOk());
        JsonNode w = getPrivacy(a);
        assertFalse(w.get("castingOffersEnabled").asBoolean(), "공개 범위 동의 철회 → 제안 수신 OFF");
        assertNull(w.get("guardian").isNull() ? null : w.get("guardian"));
    }

    private JsonNode getPrivacy(String token) throws Exception {
        return json.readTree(mvc.perform(get("/api/me/privacy").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
    }

    private JsonNode signup(String nick, String birth, String country) throws Exception {
        var r = mvc.perform(post("/api/auth/signup").contentType(APPLICATION_JSON)
                .content(body(nick, birth, country, true))).andReturn().getResponse();
        assertEquals(200, r.getStatus(), r.getContentAsString());
        return json.readTree(r.getContentAsString());
    }

    private static String body(String nick, String birth, String country, boolean consents) {
        return "{\"email\":\"" + nick + DOMAIN + "\",\"password\":\"Localtest1!\",\"role\":\"APPLICANT\","
                + "\"nickname\":\"" + nick + "\",\"countryCode\":\"" + country + "\",\"timezone\":\"Asia/Seoul\","
                + (birth == null ? "" : "\"birthDate\":\"" + birth + "\",")
                + "\"agreeTerms\":" + consents + ",\"agreePrivacyCollection\":" + consents
                + ",\"agreePrivacyDisclosure\":" + consents + "}";
    }

    private static String nick() {
        return "mp" + UUID.randomUUID().toString().replace("-", "").substring(0, 8);
    }
}
