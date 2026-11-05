package com.audition.platform.application.org;

import com.audition.platform.domain.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AgencySignupServiceTest {

    private JdbcTemplate jdbc;
    private JdbcCrmStore crm;
    private AgencySignupService service;

    @BeforeEach
    void setUp() {
        jdbc = mock(JdbcTemplate.class);
        crm = mock(JdbcCrmStore.class);
        service = new AgencySignupService(jdbc, crm);
        when(jdbc.queryForObject(anyString(), eq(Integer.class), any())).thenReturn(1);
    }

    @Test
    void openApplicationPersistsCompanyRegistrationAndContactFields() {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail("agency@example.com");
        user.setNickname("agencyNick");

        AgencySignupProfile profile = AgencySignupProfile.fromSignup(
                "KR",
                "GLOBAL TEST AGENCY",
                "Global Test Agency Co.",
                "ignored-legacy",
                "123-45-67890",
                "Hong Gildong",
                "ops@example.com",
                "010-1234-5678",
                "https://example.com",
                "Seoul",
                "TAX-9",
                "123 Road",
                2015,
                "https://cdn.example.com/license.pdf");

        service.openApplication(user, "AGENCY", profile);

        ArgumentCaptor<JdbcCrmStore.AgencyRow> row = ArgumentCaptor.forClass(JdbcCrmStore.AgencyRow.class);
        verify(crm).insertAgency(row.capture());
        assertEquals("KR", row.getValue().countryCode());
        assertEquals("GLOBAL TEST AGENCY", row.getValue().displayName());
        assertEquals("Global Test Agency Co.", row.getValue().legalName());
        assertEquals("123-45-67890", row.getValue().businessRegistration());
        assertEquals("Hong Gildong", row.getValue().contactName());
        assertEquals("ops@example.com", row.getValue().contactEmail());
        assertEquals("010-1234-5678", row.getValue().contactPhone());
        assertEquals("https://example.com", row.getValue().website());
        assertEquals("Seoul", row.getValue().city());
        assertEquals("TAX-9", row.getValue().taxId());
        assertEquals("123 Road", row.getValue().businessAddress());
        assertEquals(2015, row.getValue().establishedYear());
        assertEquals("https://cdn.example.com/license.pdf", row.getValue().businessLicenseDocumentUrl());
        assertEquals(AgencySignupService.NOTE, row.getValue().notes());
        assertEquals(user.getId(), row.getValue().linkedUserId());
        assertEquals(AgencyApproval.PENDING, row.getValue().approvalState());
    }

    @Test
    void applicantSignupDoesNotOpenCrmApplication() {
        User user = new User();
        user.setId(UUID.randomUUID());
        service.openApplication(user, "APPLICANT", null);
        verify(crm, never()).insertAgency(any());
    }

    @Test
    void legacyNameFillsLegalNameWhenDedicatedFieldMissing() {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail("agency@example.com");
        user.setNickname("agencyNick");

        service.openApplication(user, "AGENCY", AgencySignupProfile.fromSignup(
                "JP", null, null, "Legacy Legal", null, null, null, null, null, null, null, null, null, null));

        ArgumentCaptor<JdbcCrmStore.AgencyRow> row = ArgumentCaptor.forClass(JdbcCrmStore.AgencyRow.class);
        verify(crm).insertAgency(row.capture());
        assertEquals("Legacy Legal", row.getValue().legalName());
        assertEquals("Legacy Legal", row.getValue().displayName());
        assertEquals("agencyNick", row.getValue().contactName());
        assertEquals("agency@example.com", row.getValue().contactEmail());
        assertNull(row.getValue().businessRegistration());
        assertNull(row.getValue().contactPhone());
    }
}
