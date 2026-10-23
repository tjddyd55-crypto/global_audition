package com.audition.platform.application.org;

import com.audition.platform.domain.user.User;
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
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM countries WHERE code = ?", Integer.class, country);
        if (count == null || count == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "COUNTRY_NOT_FOUND");
        }
    }

    public void openApplication(User user, String requestedRole, String countryCode, String legalName) {
        if (!"AGENCY".equals(requestedRole)) {
            return;
        }
        String country = CountryCodes.iso2(countryCode);
        UUID id = UUID.randomUUID();
        String legal = legalName == null || legalName.isBlank() ? null : legalName.trim();
        String display = legal != null ? legal : user.getNickname();
        crm.insertAgency(new JdbcCrmStore.AgencyRow(
                id, country, display, legal, null,
                user.getNickname(), user.getEmail(), null, null,
                null, "LEAD", AgencyApproval.PENDING, user.getId(), NOTE));
        crm.stageEvent(UUID.randomUUID(), id, null, "LEAD", user.getId(), "SIGNUP");
        crm.approvalEvent(UUID.randomUUID(), id, null, AgencyApproval.PENDING, "REGISTER", user.getId(), null);
    }
}
