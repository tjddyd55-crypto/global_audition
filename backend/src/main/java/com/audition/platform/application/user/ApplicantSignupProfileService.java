package com.audition.platform.application.user;

import com.audition.platform.application.org.CountryCodes;
import com.audition.platform.domain.user.User;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/**
 * 일반 지원자 가입의 국가·시간대.
 * 국가 코드는 countries 테이블의 ISO 3166-1 alpha-2 만 받고, 시간대는 IANA 만 받는다.
 * 둘 다 UI 언어(ko/en/mn)와 연결하지 않는다.
 */
@Service
public class ApplicantSignupProfileService {

    private final JdbcTemplate jdbc;

    public ApplicantSignupProfileService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void apply(User user, String requestedRole, String countryCode, String timezone) {
        user.setTimezone(Timezones.optional(timezone));
        if (!"APPLICANT".equals(requestedRole)) {
            return;
        }
        if (countryCode == null || countryCode.isBlank()) {
            return;
        }
        String country = CountryCodes.iso2(countryCode);
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM countries WHERE code = ?", Integer.class, country);
        if (count == null || count == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "COUNTRY_NOT_FOUND");
        }
        user.setCountryCode(country);
    }
}
