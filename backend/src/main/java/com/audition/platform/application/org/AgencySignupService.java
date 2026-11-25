package com.audition.platform.application.org;

import com.audition.platform.domain.user.User;
import com.audition.platform.application.user.SignupCountries;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

/**
 * 기획사 가입 요청은 CRM 신청으로 남기고, 접근 역할은 본사 승인 전까지 APPLICANT 다.
 */
@Service
public class AgencySignupService {

    public static final String NOTE = "SIGNUP";

    private final JdbcTemplate jdbc;
    private final JdbcCrmStore crm;

    public AgencySignupService(JdbcTemplate jdbc, JdbcCrmStore crm) {
        this.jdbc = jdbc;
        this.crm = crm;
    }

    public void requireAgencyCountry(String requestedRole, String countryCode) {
        if (!"AGENCY".equals(requestedRole)) {
            return;
        }
        String country = CountryCodes.iso2(countryCode);
        SignupCountries.ensureRegistered(jdbc, country);
    }

    public void openApplication(User user, String requestedRole, AgencySignupProfile profile) {
        if (!"AGENCY".equals(requestedRole)) {
            return;
        }
        AgencySignupProfile safe = profile == null
                ? AgencySignupProfile.fromSignup(null, null, null, null, null, null, null, null, null, null, null, null, null, null)
                : profile;
        String country = CountryCodes.iso2(safe.countryCode());
        UUID id = UUID.randomUUID();
        String legal = safe.legalName();
        String display = safe.companyName() != null ? safe.companyName()
                : (legal != null ? legal : user.getNickname());
        String contactName = safe.representativeName() != null ? safe.representativeName() : user.getNickname();
        String contactEmail = safe.contactEmail() != null ? safe.contactEmail() : user.getEmail();
        crm.insertAgency(new JdbcCrmStore.AgencyRow(
                id, country, display, legal, safe.businessRegistrationNumber(),
                contactName, contactEmail, safe.contactPhone(), safe.website(),
                null, "LEAD", AgencyApproval.PENDING, user.getId(), NOTE,
                safe.businessCity(), safe.taxId(), safe.businessAddress(),
                safe.establishedYear(), safe.businessLicenseDocumentUrl()));
        crm.stageEvent(UUID.randomUUID(), id, null, "LEAD", user.getId(), "SIGNUP");
        crm.approvalEvent(UUID.randomUUID(), id, null, AgencyApproval.PENDING, "REGISTER", user.getId(), null);
    }
}
