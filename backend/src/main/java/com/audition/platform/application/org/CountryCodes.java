package com.audition.platform.application.org;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public final class CountryCodes {

    private CountryCodes() {
    }

    public static String iso2(String raw) {
        if (raw == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "COUNTRY_CODE_REQUIRED");
        }
        String code = raw.trim().toUpperCase();
        if (!code.matches("[A-Z]{2}")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "COUNTRY_CODE_INVALID");
        }
        return code;
    }

    public static String currency(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "CURRENCY_REQUIRED");
        }
        String currency = raw.trim().toUpperCase();
        if (!currency.matches("[A-Z]{3}")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "CURRENCY_INVALID");
        }
        return currency;
    }
}
