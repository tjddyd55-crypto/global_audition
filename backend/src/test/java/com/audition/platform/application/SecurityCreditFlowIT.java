package com.audition.platform.application;

import com.audition.platform.application.credit.CreditPolicyKey;
import com.audition.platform.application.credit.CreditService;
import com.audition.platform.domain.credit.CreditPackage;
import com.audition.platform.domain.credit.CreditPackageRepository;
import com.audition.platform.infra.TestJwtSecrets;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "app.jwt.secret=" + TestJwtSecrets.ACCEPTABLE,
        "app.credits.allow-legacy-self-charge=false",
        "audition.voting-db-verify=true",
        "app.super-admin.bootstrap-enabled=false"
})
class SecurityCreditFlowIT {

    @org.springframework.test.context.DynamicPropertySource
    static void db(org.springframework.test.context.DynamicPropertyRegistry r) {
        com.audition.platform.infra.TestDatabase.register(r);
    }

    @Autowired
    private MockMvc mvc;
    @Autowired
    private JdbcTemplate jdbc;
    @Autowired
    private ObjectMapper json;
    @Autowired
    private CreditPackageRepository packages;
    @Autowired
    private CreditService credits;

    @Test
    void legacyChargeStaysClosedAndMockPaymentStillSettlesOnce() throws Exception {
        Integer versions = jdbc.queryForObject(
                "SELECT COUNT(*) FROM flyway_schema_history WHERE success = true AND version <> '0'",
                Integer.class);
        Integer scripts = jdbc.queryForObject(
                "SELECT COUNT(*) FROM flyway_schema_history WHERE type = 'SQL' AND success = true",
                Integer.class);
        String maxVersion = jdbc.queryForObject("""
                SELECT version FROM flyway_schema_history
                WHERE version IS NOT NULL AND version <> '0'
                ORDER BY installed_rank DESC LIMIT 1
                """, String.class);
        // develop 통합: V1..V60 (main V37 + PR #66 V38..V60)
        assertEquals(60, versions);
        assertEquals(60, scripts);
        assertEquals("60", maxVersion);

        String applicantEmail = "fan-" + UUID.randomUUID() + "@local.test";
        String otherEmail = "other-" + UUID.randomUUID() + "@local.test";
        String applicantToken = signupAndLogin(applicantEmail, "APPLICANT", nick());
        String otherToken = signupAndLogin(otherEmail, "APPLICANT", nick());
        UUID applicantId = userId(applicantToken);
        UUID otherId = userId(otherToken);

        mvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + applicantToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.role").value("USER"))
                .andExpect(jsonPath("$.data.email").value(applicantEmail))
                .andExpect(jsonPath("$.data.id").exists())
                .andExpect(jsonPath("$.data.nickname").exists());

        mvc.perform(get("/api/admin/payment-orders").header("Authorization", "Bearer " + applicantToken))
                .andExpect(status().isForbidden());

        mvc.perform(post("/api/credits/charge")
                        .contentType(APPLICATION_JSON)
                        .content("{\"amount\":5}"))
                .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/credits/charge")
                        .header("Authorization", "Bearer " + applicantToken)
                        .contentType(APPLICATION_JSON)
                        .content("{\"amount\":5}"))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/credits/charge")
                        .header("Authorization", "Bearer " + applicantToken)
                        .contentType(APPLICATION_JSON)
                        .content("{\"amount\":5}"))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/credits/charge")
                        .header("Authorization", "Bearer " + applicantToken)
                        .contentType(APPLICATION_JSON)
                        .content("{\"amount\":0}"))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/credits/charge")
                        .header("Authorization", "Bearer " + applicantToken)
                        .contentType(APPLICATION_JSON)
                        .content("{\"amount\":-3}"))
                .andExpect(status().isBadRequest());

        assertEquals(0L, balance(applicantToken));
        assertEquals(0L, balance(otherToken));
        assertEquals(0, countTx(applicantId));
        assertEquals(0, countOrders(applicantId));

        CreditPackage pkg = new CreditPackage();
        pkg.setName("hotfix-pack");
        pkg.setPrice(new BigDecimal("1.00"));
        pkg.setCredits(3);
        pkg.setBonusCredits(0);
        pkg.setActive(true);
        pkg = packages.save(pkg);

        String failedOrder = prepare(applicantToken, pkg.getId());
        mvc.perform(post("/api/payments/callback/fail")
                        .header("Authorization", "Bearer " + applicantToken)
                        .contentType(APPLICATION_JSON)
                        .content("{\"orderNo\":\"" + failedOrder + "\",\"reason\":\"USER_CANCEL\"}"))
                .andExpect(status().isNoContent());
        assertEquals(0L, balance(applicantToken));
        assertEquals(0, countCharge(applicantId, failedOrder));

        String paidOrder = prepare(applicantToken, pkg.getId());
        mvc.perform(post("/api/payments/callback/success")
                        .header("Authorization", "Bearer " + otherToken)
                        .contentType(APPLICATION_JSON)
                        .content("{\"orderNo\":\"" + paidOrder + "\",\"providerTxId\":\"tx-other\"}"))
                .andExpect(status().isForbidden());
        assertEquals(0L, balance(applicantToken));
        assertEquals(0L, balance(otherToken));

        mvc.perform(post("/api/payments/callback/success")
                        .header("Authorization", "Bearer " + applicantToken)
                        .contentType(APPLICATION_JSON)
                        .content("{\"orderNo\":\"" + paidOrder + "\",\"providerTxId\":\"tx-ok\"}"))
                .andExpect(status().isNoContent());
        mvc.perform(post("/api/payments/callback/success")
                        .header("Authorization", "Bearer " + applicantToken)
                        .contentType(APPLICATION_JSON)
                        .content("{\"orderNo\":\"" + paidOrder + "\",\"providerTxId\":\"tx-ok\"}"))
                .andExpect(status().isNoContent());
        assertEquals(3L, balance(applicantToken));
        assertEquals(1, countCharge(applicantId, paidOrder));
        assertEquals(0L, balance(otherToken));
        assertEquals(0, countTx(otherId));

        credits.useCredits(applicantId, CreditPolicyKey.AUDITION_APPLY, UUID.randomUUID().toString());
        assertEquals(2L, balance(applicantToken));
        Integer uses = jdbc.queryForObject("""
                SELECT COUNT(*) FROM credit_transactions
                WHERE user_id = ? AND type = 'USE' AND reason = 'AUDITION_APPLY'
                """, Integer.class, applicantId);
        assertEquals(1, uses);
        Long closing = jdbc.queryForObject("""
                SELECT after_balance FROM credit_transactions
                WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 1
                """, Long.class, applicantId);
        assertEquals(2L, closing);
        assertFalse(jdbc.queryForObject(
                "SELECT COUNT(*) FROM credit_transactions WHERE note = 'SELF_API_CHARGE' AND user_id = ?",
                Integer.class, applicantId) > 0);
    }

    private static String nick() {
        return "hf" + UUID.randomUUID().toString().replace("-", "").substring(0, 8);
    }

    private String signupAndLogin(String email, String role, String nickname) throws Exception {
        mvc.perform(post("/api/auth/signup")
                        .contentType(APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"Localtest1!\",\"role\":\"" + role
                                + "\",\"nickname\":\"" + nickname + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.role").value(role))
                .andExpect(jsonPath("$.userId").exists());
        MvcResult login = mvc.perform(post("/api/auth/login")
                        .contentType(APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"Localtest1!\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value(role))
                .andExpect(jsonPath("$.email").value(email))
                .andReturn();
        return json.readTree(login.getResponse().getContentAsString()).get("token").asText();
    }

    private UUID userId(String token) throws Exception {
        MvcResult me = mvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode data = json.readTree(me.getResponse().getContentAsString()).get("data");
        assertTrue(data.hasNonNull("id"));
        return UUID.fromString(data.get("id").asText());
    }

    private long balance(String token) throws Exception {
        MvcResult result = mvc.perform(get("/api/credits/balance").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();
        return json.readTree(result.getResponse().getContentAsString()).get("balance").asLong();
    }

    private String prepare(String token, UUID packageId) throws Exception {
        MvcResult result = mvc.perform(post("/api/credits/prepare-payment")
                        .header("Authorization", "Bearer " + token)
                        .contentType(APPLICATION_JSON)
                        .content("{\"packageId\":\"" + packageId + "\",\"provider\":\"MOCK\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.provider").value("MOCK"))
                .andExpect(jsonPath("$.status").value("READY"))
                .andReturn();
        return json.readTree(result.getResponse().getContentAsString()).get("orderNo").asText();
    }

    private int countTx(UUID userId) {
        Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM credit_transactions WHERE user_id = ?", Integer.class, userId);
        return count == null ? 0 : count;
    }

    private int countOrders(UUID userId) {
        Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM payment_orders WHERE user_id = ?", Integer.class, userId);
        return count == null ? 0 : count;
    }

    private int countCharge(UUID userId, String orderNo) {
        Integer count = jdbc.queryForObject("""
                SELECT COUNT(*) FROM credit_transactions
                WHERE user_id = ? AND type = 'CHARGE' AND reference_id = ?
                """, Integer.class, userId, orderNo);
        return count == null ? 0 : count;
    }
}
