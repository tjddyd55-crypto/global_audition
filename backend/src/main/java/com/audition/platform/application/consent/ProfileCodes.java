package com.audition.platform.application.consent;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeParseException;
import java.util.Locale;
import java.util.Set;

/** 가입·설정 입력값(생년월일·성별) 검증. */
public final class ProfileCodes {

    public static final Set<String> GENDERS = Set.of("FEMALE", "MALE", "NON_BINARY", "UNDISCLOSED");

    private ProfileCodes() {
    }

    /** null/빈 값 = 없음. 형식 오류·미래·120세 초과는 422 BIRTH_DATE_INVALID. */
    public static LocalDate birthDate(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        LocalDate d;
        try {
            d = LocalDate.parse(raw.trim());
        } catch (DateTimeParseException e) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "BIRTH_DATE_INVALID");
        }
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        if (d.isAfter(today) || d.isBefore(today.minusYears(120))) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "BIRTH_DATE_INVALID");
        }
        return d;
    }

    /** New applicants must select one of the signup options. */
    public static String signupGender(String raw) {
        String value = gender(raw);
        if (value == null || value.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "GENDER_REQUIRED");
        }
        if (!"MALE".equals(value) && !"FEMALE".equals(value)) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "GENDER_INVALID");
        }
        return value;
    }

    /** null = 변경 없음, "" = 지움. */
    public static String gender(String raw) {
        if (raw == null) {
            return null;
        }
        String g = raw.trim().toUpperCase(Locale.ROOT);
        if (g.isEmpty()) {
            return "";
        }
        if (!GENDERS.contains(g)) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "GENDER_INVALID");
        }
        return g;
    }
}
