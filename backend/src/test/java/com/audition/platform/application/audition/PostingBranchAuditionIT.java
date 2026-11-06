package com.audition.platform.application.audition;

import com.audition.platform.application.org.AttributionPlanner;
import com.audition.platform.application.org.AttributionService;
import com.audition.platform.infra.JwtService;
import com.audition.platform.infra.TestDatabase;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.sql.Timestamp;
import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * 새 기획사 공고는 승인된 활성 지점을 게시 지점으로 붙인다.
 * 운영 국가는 그 지점의 국가이고, 기존 공고의 지점은 다시 채우지 않는다.
 */
@SpringBootTest
@AutoConfigureMockMvc
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class PostingBranchAuditionIT {

    private static final String MAIL = "@branch.post.test";

    @DynamicPropertySource
    static void props(DynamicPropertyRegistry registry) {
        TestDatabase.register(registry);
        byte[] key = new byte[64];
        new SecureRandom().nextBytes(key);
        registry.add("app.jwt.secret", () -> Base64.getUrlEncoder().withoutPadding().encodeToString(key));
        registry.add("app.credits.allow-legacy-self-charge", () -> "false");
        registry.add("app.super-admin.bootstrap-enabled", () -> "false");
        registry.add("app.translation.queue.enabled", () -> "false");
    }

    @BeforeAll
    void seed() throws Exception {
        TestDatabase.assertLocal();
        ensureCountry("KR");
        ensureCountry("MN");
        ensureCountry("JP");
        applicantId = user("APPLICANT", "MN");
        krAgencyId = user("AGENCY", "KR");
        mnAgencyId = user("AGENCY", "MN");
        jpAgencyId = user("AGENCY", "KR");
        superAdminId = user("SUPER_ADMIN", "US");
        krAdminId = user("COUNTRY_ADMIN", "US");
        mnAdminId = user("COUNTRY_ADMIN", "US");
        jpAdminId = user("COUNTRY_ADMIN", "US");
        krBranchId = agency("KR", krAgencyId, "ACTIVE", "APPROVED", "서울");
        mnBranchId = agency("MN", mnAgencyId, "ACTIVE", "APPROVED", "울란바토르");
        jpBranchId = agency("JP", jpAgencyId, "ACTIVE", "APPROVED", "도쿄");
        appoint("KR", krAdminId);
        appoint("MN", mnAdminId);
        appoint("JP", jpAdminId);
        krAuditionId = createOpen(krAgencyId, null, "GLOBAL");
        mnAuditionId = createOpen(mnAgencyId, null, "KR");
        jpAuditionId = createOpen(jpAgencyId, null, "MN");
        krApplicationId = application(krAuditionId, "JP");
        mnApplicationId = application(mnAuditionId, "KR");
        jpApplicationId = application(jpAuditionId, "MN");
    }

    @AfterAll
    void cleanup() {
        jdbc.update("""
                DELETE FROM content_translation_attempts
                WHERE content_id IN (SELECT id FROM auditions WHERE owner_id IN (SELECT id FROM users WHERE email LIKE ?))
                """, "%" + MAIL);
        jdbc.update("""
                DELETE FROM content_translation_jobs
                WHERE content_id IN (SELECT id FROM auditions WHERE owner_id IN (SELECT id FROM users WHERE email LIKE ?))
                """, "%" + MAIL);
        jdbc.update("""
                DELETE FROM content_translations
                WHERE content_id IN (SELECT id FROM auditions WHERE owner_id IN (SELECT id FROM users WHERE email LIKE ?))
                """, "%" + MAIL);
        jdbc.update("""
                DELETE FROM revenue_attributions
                WHERE credit_transaction_id IN (
                    SELECT id FROM credit_transactions
                    WHERE user_id IN (SELECT id FROM users WHERE email LIKE ?)
                )
                """, "%" + MAIL);
        jdbc.update("""
                DELETE FROM credit_transactions
                WHERE user_id IN (SELECT id FROM users WHERE email LIKE ?)
                """, "%" + MAIL);
        jdbc.update("""
                DELETE FROM contract_versions
                WHERE contract_id IN (
                    SELECT id FROM contracts
                    WHERE crm_agency_id IN (
                        SELECT id FROM crm_agencies
                        WHERE linked_user_id IN (SELECT id FROM users WHERE email LIKE ?)
                    )
                )
                """, "%" + MAIL);
        jdbc.update("""
                DELETE FROM contracts
                WHERE crm_agency_id IN (
                    SELECT id FROM crm_agencies
                    WHERE linked_user_id IN (SELECT id FROM users WHERE email LIKE ?)
                )
                """, "%" + MAIL);
        jdbc.update("""
                DELETE FROM applications
                WHERE audition_id IN (SELECT id FROM auditions WHERE owner_id IN (SELECT id FROM users WHERE email LIKE ?))
                """, "%" + MAIL);
        jdbc.update("""
                DELETE FROM auditions WHERE owner_id IN (SELECT id FROM users WHERE email LIKE ?)
                """, "%" + MAIL);
        jdbc.update("""
                DELETE FROM crm_agencies WHERE linked_user_id IN (SELECT id FROM users WHERE email LIKE ?)
                """, "%" + MAIL);
        jdbc.update("""
                DELETE FROM country_admin_appointments
                WHERE user_id IN (SELECT id FROM users WHERE email LIKE ?)
                """, "%" + MAIL);
        jdbc.update("DELETE FROM users WHERE email LIKE ?", "%" + MAIL);
    }

    @Autowired
    private MockMvc mvc;
    @Autowired
    private JdbcTemplate jdbc;
    @Autowired
    private JwtService jwt;
    @Autowired
    private ObjectMapper json;
    @Autowired
    private AttributionService attributions;

    private UUID applicantId;
    private UUID krAgencyId;
    private UUID mnAgencyId;
    private UUID jpAgencyId;
    private UUID superAdminId;
    private UUID krAdminId;
    private UUID mnAdminId;
    private UUID jpAdminId;
    private UUID krBranchId;
    private UUID mnBranchId;
    private UUID jpBranchId;
    private UUID krAuditionId;
    private UUID mnAuditionId;
    private UUID jpAuditionId;
    private UUID krApplicationId;
    private UUID mnApplicationId;
    private UUID jpApplicationId;

    @Test
    void singleApprovedBranchIsLinkedAndOperatingCountryFollowsTheBranch() {
        assertLinked(krAuditionId, krBranchId, "KR", "GLOBAL");
        assertLinked(mnAuditionId, mnBranchId, "MN", "KR");
        assertLinked(jpAuditionId, jpBranchId, "JP", "MN");
        assertEquals("KR", userCountry(jpAgencyId));
        assertEquals("MN", jdbc.queryForObject(
                "SELECT nationality FROM applications WHERE id = ?", String.class, jpApplicationId));
    }

    @Test
    void severalBranchesRequireAnExplicitChoice() throws Exception {
        UUID owner = user("AGENCY", "KR");
        UUID seoul = agency("KR", owner, "ACTIVE", "APPROVED", "서울");
        UUID tokyo = agency("JP", owner, "ACTIVE", "APPROVED", "도쿄");
        mvc.perform(post("/api/auditions").header("Authorization", bearer(owner))
                        .contentType(MediaType.APPLICATION_JSON).content(payload("고르기", "DRAFT", null, "GLOBAL")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(PostingBranchPolicy.REQUIRED));

        JsonNode chosen = created(owner, "DRAFT", seoul.toString(), "GLOBAL");
        assertEquals(seoul.toString(), chosen.get("postingBranchId").asText());
        assertEquals("KR", chosen.get("operatingCountry").asText());

        JsonNode other = created(owner, "OPEN", tokyo.toString(), "MN");
        assertEquals(tokyo.toString(), other.get("postingBranchId").asText());
        assertEquals("JP", other.get("operatingCountry").asText());
        assertEquals("MN", other.get("countryCode").asText());
    }

    @Test
    void noBranchAllowsDraftAndBlocksPublish() throws Exception {
        UUID owner = user("AGENCY", "KR");
        JsonNode draft = created(owner, "DRAFT", null, "KR");
        assertEquals(true, draft.get("postingBranchId").isNull());
        assertEquals("DRAFT", draft.get("status").asText());
        mvc.perform(post("/api/auditions").header("Authorization", bearer(owner))
                        .contentType(MediaType.APPLICATION_JSON).content(payload("게시불가", "OPEN", null, "KR")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(PostingBranchPolicy.NONE));
        mvc.perform(patch("/api/auditions/" + draft.get("id").asText()).header("Authorization", bearer(owner))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"OPEN\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(PostingBranchPolicy.NONE));
        assertNull(branchColumn(UUID.fromString(draft.get("id").asText())));
    }

    @Test
    void unapprovedOrInactiveBranchIsRejectedAndRecheckedOnPublish() throws Exception {
        UUID pendingOwner = user("AGENCY", "KR");
        UUID pending = agency("KR", pendingOwner, "ACTIVE", "PENDING", "대기");
        mvc.perform(post("/api/auditions").header("Authorization", bearer(pendingOwner))
                        .contentType(MediaType.APPLICATION_JSON).content(payload("미승인", "DRAFT", pending.toString(), "KR")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(PostingBranchPolicy.NOT_APPROVED));

        UUID stoppedOwner = user("AGENCY", "KR");
        UUID stopped = agency("JP", stoppedOwner, "STOPPED", "APPROVED", "정지");
        mvc.perform(post("/api/auditions").header("Authorization", bearer(stoppedOwner))
                        .contentType(MediaType.APPLICATION_JSON).content(payload("비활성", "OPEN", stopped.toString(), "KR")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(PostingBranchPolicy.NOT_APPROVED));

        UUID owner = user("AGENCY", "KR");
        UUID live = agency("MN", owner, "ACTIVE", "APPROVED", "몽골");
        JsonNode draft = created(owner, "DRAFT", live.toString(), "KR");
        jdbc.update("UPDATE crm_agencies SET stage = 'STOPPED' WHERE id = ?", live);
        mvc.perform(patch("/api/auditions/" + draft.get("id").asText()).header("Authorization", bearer(owner))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"수정\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(PostingBranchPolicy.NOT_APPROVED));
        mvc.perform(patch("/api/auditions/" + draft.get("id").asText()).header("Authorization", bearer(owner))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"OPEN\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(PostingBranchPolicy.NOT_APPROVED));
        assertEquals("DRAFT", jdbc.queryForObject("SELECT status FROM auditions WHERE id = ?", String.class, UUID.fromString(draft.get("id").asText())));
        assertEquals(live, branchColumn(UUID.fromString(draft.get("id").asText())));
    }

    @Test
    void anotherAgencysBranchIsForbidden() throws Exception {
        UUID owner = user("AGENCY", "KR");
        agency("KR", owner, "ACTIVE", "APPROVED", "내 지점");
        mvc.perform(post("/api/auditions").header("Authorization", bearer(owner))
                        .contentType(MediaType.APPLICATION_JSON).content(payload("타인", "DRAFT", krBranchId.toString(), "KR")))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value(PostingBranchPolicy.FORBIDDEN));
    }

    @Test
    void existingAuditionKeepsANullPostingBranch() throws Exception {
        UUID owner = user("AGENCY", "KR");
        agency("JP", owner, "ACTIVE", "APPROVED", "도쿄");
        UUID auditionId = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO auditions (
                    id, owner_id, title, description, status, country_code, group_id, default_locale, agency_name, location
                ) VALUES (?, ?, '기존 제목', '기존 본문', 'DRAFT', 'KR', ?, 'ko', '기획사', '서울')
                """, auditionId, owner, auditionId);
        mvc.perform(patch("/api/auditions/" + auditionId).header("Authorization", bearer(owner))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"제목만 수정\"}"))
                .andExpect(status().isOk());
        assertNull(branchColumn(auditionId));
        assertEquals("제목만 수정", jdbc.queryForObject("SELECT title FROM auditions WHERE id = ?", String.class, auditionId));
    }

    @Test
    void countryAdminReadsOnlyThePostingBranchCountry() throws Exception {
        assertRounds(krAdminId, krAuditionId, 200);
        assertRounds(krAdminId, mnAuditionId, 403);
        assertRounds(krAdminId, jpAuditionId, 403);
        assertRounds(mnAdminId, mnAuditionId, 200);
        assertRounds(mnAdminId, krAuditionId, 403);
        assertRounds(mnAdminId, jpAuditionId, 403);
        assertRounds(jpAdminId, jpAuditionId, 200);
        assertRounds(jpAdminId, krAuditionId, 403);
        assertRounds(jpAdminId, mnAuditionId, 403);
    }

    @Test
    void changingPostingBranchMovesCountryAdminScopeAndKeepsPastAttribution() throws Exception {
        UUID owner = user("AGENCY", "KR");
        UUID seoul = agency("KR", owner, "ACTIVE", "APPROVED", "서울");
        UUID tokyo = agency("JP", owner, "ACTIVE", "APPROVED", "도쿄");
        UUID krContract = contract(seoul, "KR");
        UUID jpContract = contract(tokyo, "JP");
        JsonNode created = created(owner, "OPEN", seoul.toString(), "MN");
        UUID auditionId = UUID.fromString(created.get("id").asText());
        assertRounds(krAdminId, auditionId, 200);
        assertRounds(jpAdminId, auditionId, 403);

        UUID payer = user("APPLICANT", "PH");
        UUID firstUse = creditUse(payer, auditionId, "2026-11-02T00:00:00Z");
        attribute(firstUse);
        Map<String, Object> before = attributionRow(firstUse);
        assertEquals(seoul, before.get("branch_id"));
        assertEquals("KR", before.get("country"));
        assertEquals(krContract, before.get("contract_id"));
        assertNull(before.get("collected_usd"));
        assertEquals(AttributionPlanner.ATTRIBUTED, before.get("confirmation_state"));
        assertEquals(AttributionPlanner.CASH_MAPPING_UNDECIDED, before.get("cash_mapping_policy"));
        assertEquals("SALES_FEE_IS_NOT_CASH", before.get("note"));

        mvc.perform(patch("/api/auditions/" + auditionId).header("Authorization", bearer(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"postingBranchId\":\"" + tokyo + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.postingBranchId").value(tokyo.toString()))
                .andExpect(jsonPath("$.operatingCountry").value("JP"))
                .andExpect(jsonPath("$.countryCode").value("MN"));
        assertRounds(krAdminId, auditionId, 403);
        assertRounds(jpAdminId, auditionId, 200);
        assertEquals(before, attributionRow(firstUse));

        mvc.perform(patch("/api/auditions/" + auditionId).header("Authorization", bearer(owner))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"제목만\"}"))
                .andExpect(status().isOk());
        assertEquals(tokyo, branchColumn(auditionId));
        assertEquals(before, attributionRow(firstUse));

        UUID secondPayer = user("APPLICANT", "MN");
        UUID secondUse = creditUse(secondPayer, auditionId, "2026-11-03T00:00:00Z");
        attribute(secondUse);
        Map<String, Object> after = attributionRow(secondUse);
        assertEquals(tokyo, after.get("branch_id"));
        assertEquals("JP", after.get("country"));
        assertEquals(jpContract, after.get("contract_id"));
        assertNull(after.get("collected_usd"));
        assertEquals(AttributionPlanner.CASH_MAPPING_UNDECIDED, after.get("cash_mapping_policy"));
        assertEquals("PH", userCountry(payer));
        assertEquals("MN", userCountry(secondPayer));
        assertNotEquals(userCountry(payer), before.get("country"));
        assertNotEquals(userCountry(secondPayer), after.get("country"));
        assertEquals(before, attributionRow(firstUse));
        assertEquals("MN", jdbc.queryForObject(
                "SELECT country_code FROM auditions WHERE id = ?", String.class, auditionId));
    }

    @Test
    void superAdminListsApplicantsButCannotPassFailOrHold() throws Exception {
        assertRounds(superAdminId, krAuditionId, 200);
        assertRounds(superAdminId, mnAuditionId, 200);
        assertRounds(superAdminId, jpAuditionId, 200);
        mvc.perform(get("/api/auditions/" + jpAuditionId + "/applications/manage").header("Authorization", bearer(superAdminId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.items[0].applicationId").value(jpApplicationId.toString()));
        UUID roundId = UUID.randomUUID();
        for (String action : List.of("pass", "fail", "hold")) {
            mvc.perform(post("/api/admin/applications/" + jpApplicationId + "/rounds/" + roundId + "/" + action)
                            .header("Authorization", bearer(superAdminId))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{}"))
                    .andExpect(status().isForbidden());
        }
        assertEquals("SUBMITTED", jdbc.queryForObject(
                "SELECT status FROM applications WHERE id = ?", String.class, jpApplicationId));
    }

    @Test
    void publishEnqueuesTranslationAndKeepsManualRows() throws Exception {
        UUID owner = user("AGENCY", "KR");
        agency("KR", owner, "ACTIVE", "APPROVED", "번역");
        JsonNode draft = created(owner, "DRAFT", null, "KR");
        UUID auditionId = UUID.fromString(draft.get("id").asText());
        String manualBody = "{\"title\":\"Manual title\",\"description\":\"Manual body\"}";
        jdbc.update("""
                INSERT INTO content_translations (
                    content_type, content_id, locale, source_locale, source_hash, source_revision,
                    body, status, stale, provider, origin, manually_edited, source_field_hashes
                ) VALUES ('AUDITION_POSTING', ?, 'en', 'ko', 'manual-source', 1, ?::jsonb,
                          'COMPLETED', false, 'MANUAL', 'MANUAL', true, 'manual-field-hash')
                """, auditionId, manualBody);
        mvc.perform(patch("/api/auditions/" + auditionId).header("Authorization", bearer(owner))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"OPEN\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("OPEN"));

        assertEquals(draft.get("title").asText(), jdbc.queryForObject(
                "SELECT title FROM auditions WHERE id = ?", String.class, auditionId));
        assertEquals(draft.get("description").asText(), jdbc.queryForObject(
                "SELECT description FROM auditions WHERE id = ?", String.class, auditionId));
        Map<String, Object> manual = jdbc.queryForMap("""
                SELECT origin, source_field_hashes, source_hash, body::text AS body
                FROM content_translations
                WHERE content_type = 'AUDITION_POSTING' AND content_id = ? AND locale = 'en'
                """, auditionId);
        assertEquals("MANUAL", manual.get("origin"));
        assertEquals("manual-field-hash", manual.get("source_field_hashes"));
        assertEquals("manual-source", manual.get("source_hash"));
        JsonNode storedBody = json.readTree(String.valueOf(manual.get("body")));
        assertEquals("Manual title", storedBody.get("title").asText());
        assertEquals("Manual body", storedBody.get("description").asText());

        List<Map<String, Object>> jobs = jdbc.queryForList("""
                SELECT locale, status, force FROM content_translation_jobs
                WHERE content_type = 'AUDITION_POSTING' AND content_id = ?
                """, auditionId);
        assertEquals(1, jobs.stream().filter(row -> "mn".equals(row.get("locale")) && "PENDING".equals(row.get("status"))).count());
        assertEquals(0, jobs.stream().filter(row -> "en".equals(row.get("locale"))).count());
        assertEquals(0, jobs.stream().filter(row -> Boolean.TRUE.equals(row.get("force"))).count());
    }

    private void assertLinked(UUID auditionId, UUID branchId, String operatingCountry, String audience) {
        assertEquals(branchId, branchColumn(auditionId));
        assertEquals(operatingCountry, jdbc.queryForObject("""
                SELECT btrim(g.country_code) FROM auditions a
                JOIN crm_agencies g ON g.id = a.posting_branch_id
                WHERE a.id = ?
                """, String.class, auditionId));
        assertEquals(audience, jdbc.queryForObject(
                "SELECT country_code FROM auditions WHERE id = ?", String.class, auditionId));
    }

    private void assertRounds(UUID userId, UUID auditionId, int expected) throws Exception {
        mvc.perform(get("/api/admin/auditions/" + auditionId + "/rounds").header("Authorization", bearer(userId)))
                .andExpect(status().is(expected));
    }

    private JsonNode created(UUID owner, String auditionStatus, String branchId, String audience) throws Exception {
        MvcResult result = mvc.perform(post("/api/auditions").header("Authorization", bearer(owner))
                        .contentType(MediaType.APPLICATION_JSON).content(payload("공고", auditionStatus, branchId, audience)))
                .andExpect(status().isOk())
                .andReturn();
        return json.readTree(result.getResponse().getContentAsString(StandardCharsets.UTF_8));
    }

    private UUID createOpen(UUID owner, String branchId, String audience) throws Exception {
        return UUID.fromString(created(owner, "OPEN", branchId, audience).get("id").asText());
    }

    private String payload(String title, String auditionStatus, String branchId, String audience) throws Exception {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("title", title);
        body.put("description", "본문 " + title);
        body.put("status", auditionStatus);
        body.put("agencyName", "기획사");
        body.put("location", "서울");
        body.put("startDate", "2026-12-01T00:00:00Z");
        body.put("endDate", "2027-01-01T00:00:00Z");
        body.put("defaultLocale", "ko");
        body.put("countryCode", audience);
        body.put("images", Map.of(
                "original", "https://cdn.example/cover.jpg",
                "medium", "https://cdn.example/cover.jpg",
                "thumb", "https://cdn.example/cover.jpg"));
        if (branchId != null) {
            body.put("postingBranchId", branchId);
        }
        return json.writeValueAsString(body);
    }

    private UUID application(UUID auditionId, String nationality) {
        UUID id = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO applications (
                    id, audition_id, applicant_id, status, applicant_name, birth_date, age, nationality
                ) VALUES (?, ?, ?, 'SUBMITTED', '지원자', DATE '2000-01-02', 26, ?)
                """, id, auditionId, applicantId, nationality);
        return id;
    }

    private UUID branchColumn(UUID auditionId) {
        return jdbc.queryForObject("SELECT posting_branch_id FROM auditions WHERE id = ?", UUID.class, auditionId);
    }

    private String userCountry(UUID userId) {
        return jdbc.queryForObject("SELECT btrim(country_code) FROM users WHERE id = ?", String.class, userId);
    }

    private String bearer(UUID userId) {
        return "Bearer " + jwt.createToken(userId, "x" + MAIL, "USER");
    }

    private UUID user(String role, String country) {
        UUID id = UUID.randomUUID();
        String handle = "b" + id.toString().replace("-", "").substring(0, 12);
        jdbc.update("""
                INSERT INTO users (id, email, password_hash, role, username, display_name, nickname, country_code)
                VALUES (?, ?, 'x', ?, ?, ?, ?, ?)
                """, id, handle + MAIL, role, handle, handle, handle, country);
        return id;
    }

    private UUID agency(String country, UUID linkedUser, String stage, String approval, String name) {
        UUID id = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO crm_agencies (id, country_code, display_name, stage, approval_state, linked_user_id)
                VALUES (?, ?, ?, ?, ?, ?)
                """, id, country, name, stage, approval, linkedUser);
        return id;
    }

    private void appoint(String country, UUID userId) {
        jdbc.update("""
                UPDATE country_admin_appointments
                SET status = 'ENDED', ended_at = NOW(), end_reason = 'IT_REPLACE'
                WHERE country_code = ? AND status = 'ACTIVE'
                """, country);
        jdbc.update("""
                INSERT INTO country_admin_appointments (id, country_code, user_id, status)
                VALUES (?, ?, ?, 'ACTIVE')
                """, UUID.randomUUID(), country, userId);
    }

    private UUID contract(UUID branchId, String country) {
        UUID contractId = UUID.randomUUID();
        UUID versionId = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO contracts (
                    id, contract_number, country_code, crm_agency_id, counterparty_name, status
                ) VALUES (?, ?, ?, ?, '지점', 'ACTIVE')
                """, contractId, "PB-" + contractId, country, branchId);
        jdbc.update("""
                INSERT INTO contract_versions (id, contract_id, version_no, start_date, payout_currency)
                VALUES (?, ?, 1, DATE '2026-01-01', 'USD')
                """, versionId, contractId);
        return contractId;
    }

    private UUID creditUse(UUID userId, UUID auditionId, String instant) {
        UUID id = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO credit_transactions (
                    id, user_id, amount, type, reason, reference_id, applied_fee_usd, applied_credit_quantity, created_at
                ) VALUES (?, ?, -1, 'USE', 'AUDITION_APPLY', ?, 1, 1, ?)
                """, id, userId, auditionId.toString(), Timestamp.from(OffsetDateTime.parse(instant).toInstant()));
        return id;
    }

    private void attribute(UUID creditTransactionId) {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                superAdminId, null, List.of(new SimpleGrantedAuthority("ROLE_USER"))));
        try {
            assertTrue(attributions.attributeCreditUse(creditTransactionId));
        } finally {
            SecurityContextHolder.clearContext();
        }
    }

    private Map<String, Object> attributionRow(UUID creditTransactionId) {
        return new LinkedHashMap<>(jdbc.queryForMap("""
                SELECT branch_id, btrim(attributed_country) AS country, contract_id, contract_version_id,
                       collected_usd, confirmation_state, cash_mapping_policy, note
                FROM revenue_attributions
                WHERE credit_transaction_id = ? AND line_kind = 'REVENUE'
                """, creditTransactionId));
    }

    private void ensureCountry(String code) {
        jdbc.update("""
                INSERT INTO countries (code, name, status, default_currency)
                VALUES (?, ?, 'ACTIVE', 'USD')
                ON CONFLICT (code) DO NOTHING
                """, code, code);
    }
}
