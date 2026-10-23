package com.audition.platform.application.publicview;

import com.audition.platform.application.AuditionService;

import java.time.Instant;
import java.util.List;
import java.util.Locale;

/**
 * 공개 오디션 목록 조건. DRAFT 는 넣지 않는다. 추천 점수는 없다.
 */
public final class PublicAuditionBrowse {

    public record Query(
            String recruitment,
            String country,
            String category,
            String agency,
            String text,
            Instant from,
            Instant to) {
    }

    private PublicAuditionBrowse() {
    }

    public static boolean matches(
            String status,
            String countryCode,
            String hostCountry,
            String title,
            String agencyName,
            String[] recruitFields,
            List<String> tags,
            Instant start,
            Instant end,
            Instant deadline,
            Query query) {
        if (!"OPEN".equals(status) && !"CLOSED".equals(status)) {
            return false;
        }
        String recruitment = query.recruitment() == null || query.recruitment().isBlank()
                ? null
                : query.recruitment().trim().toUpperCase(Locale.ROOT);
        if (recruitment == null || "OPEN".equals(recruitment)) {
            if (!"OPEN".equals(status)) {
                return false;
            }
        } else if ("CLOSED".equals(recruitment) || "ENDED".equals(recruitment)) {
            if (!"CLOSED".equals(status)) {
                return false;
            }
        } else if (!"ALL".equals(recruitment)) {
            return false;
        }
        if (!AuditionService.matchesPublicCountry(countryCode, hostCountry, query.country())) {
            return false;
        }
        if (!contains(agencyName, query.agency())) {
            return false;
        }
        if (!containsAny(query.category(), recruitFields, tags)) {
            return false;
        }
        if (!contains(title, query.text()) && !contains(agencyName, query.text())) {
            if (normalize(query.text()) != null) {
                return false;
            }
        }
        return overlaps(start, end != null ? end : deadline, query.from(), query.to());
    }

    private static boolean overlaps(Instant start, Instant end, Instant from, Instant to) {
        if (from == null && to == null) {
            return true;
        }
        if (start == null && end == null) {
            return false;
        }
        if (to != null && start != null && start.isAfter(to)) {
            return false;
        }
        if (from != null && end != null && end.isBefore(from)) {
            return false;
        }
        return true;
    }

    private static boolean containsAny(String needle, String[] fields, List<String> tags) {
        String wanted = normalize(needle);
        if (wanted == null) {
            return true;
        }
        if (fields != null) {
            for (String field : fields) {
                if (contains(field, wanted)) {
                    return true;
                }
            }
        }
        if (tags != null) {
            for (String tag : tags) {
                if (contains(tag, wanted)) {
                    return true;
                }
            }
        }
        return false;
    }

    private static boolean contains(String value, String needle) {
        String wanted = normalize(needle);
        if (wanted == null) {
            return true;
        }
        return value != null && value.toLowerCase(Locale.ROOT).contains(wanted);
    }

    private static String normalize(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim().toLowerCase(Locale.ROOT);
    }
}
