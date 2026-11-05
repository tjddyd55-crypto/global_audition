package com.audition.platform.application.user;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.DateTimeException;
import java.time.ZoneId;

/** IANA 시간대. UI 언어를 바꾸지 않는다. */
public final class Timezones {

    private static final int MAX_LENGTH = 64;

    private Timezones() {
    }

    public static String optional(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        return canonical(raw);
    }

    public static String canonical(String raw) {
        String zone = raw == null ? "" : raw.trim();
        if (zone.isEmpty() || zone.length() > MAX_LENGTH) {
            throw invalid();
        }
        try {
            String id = ZoneId.of(zone).getId();
            if (id.length() > MAX_LENGTH) {
                throw invalid();
            }
            return id;
        } catch (DateTimeException ex) {
            throw invalid();
        }
    }

    private static ResponseStatusException invalid() {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, "TIMEZONE_INVALID");
    }
}
