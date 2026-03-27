package com.audition.platform.domain.util;

import java.time.LocalDate;
import java.time.Period;

/** 생년월일 기준 만 나이. 서버·클라이언트 동일 규칙(Asia/Seoul 달력일은 호출부에서 결정). */
public final class ApplicationBirthdates {

    private ApplicationBirthdates() {
    }

    public static int ageOnDate(LocalDate birthDate, LocalDate today) {
        if (birthDate == null || today == null) {
            throw new IllegalArgumentException("birthDate and today are required");
        }
        if (birthDate.isAfter(today)) {
            throw new IllegalArgumentException("birthDate cannot be in the future");
        }
        return Period.between(birthDate, today).getYears();
    }
}
