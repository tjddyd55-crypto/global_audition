package com.audition.platform.application.publicview;

import com.audition.platform.application.AuditionService;

import com.audition.platform.domain.audition.RecruitFieldCodes;

import java.time.Instant;

import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.function.Function;
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
            Instant to,
            String field,
            String sort) {

        public Query(String recruitment, String country, String category, String agency, String text,
                Instant from, Instant to) {
            this(recruitment, country, category, agency, text, from, to, null, null);
        }
    }

    public static final Set<String> SORTS = Set.of("LATEST", "DEADLINE");
    public static final int MAX_PAGE_SIZE = 100;

    /** 모집 분야 코드(VOCAL 등) 일치. 레거시 한글/영문 값도 RecruitFieldCodes 로 정규화해 비교한다. */
    public static boolean matchesField(String[] recruitFields, String field) {
        if (field == null || field.isBlank()) {
            return true;
        }
        String wanted = RecruitFieldCodes.normalize(field).toUpperCase(Locale.ROOT);
        if (recruitFields == null) {
            return false;
        }
        for (String value : recruitFields) {
            if (value != null && RecruitFieldCodes.normalize(value).toUpperCase(Locale.ROOT).equals(wanted)) {
                return true;
            }
        }
        return false;
    }

    /** LATEST: 생성일 최신순. DEADLINE: 마감(endDate, 없으면 deadlineAt) 빠른 순, 마감 없는 공고는 뒤로. 동률은 최신순. */
    public static <T> Comparator<T> comparator(
            String sort, Function<T, Instant> createdAt, Function<T, Instant> endDate, Function<T, Instant> deadlineAt) {
        Comparator<T> latest = Comparator.comparing(createdAt, Comparator.nullsLast(Comparator.reverseOrder()));
        if (!"DEADLINE".equals(normalizeSort(sort))) {
            return latest;
        }
        Function<T, Instant> due = row -> endDate.apply(row) != null ? endDate.apply(row) : deadlineAt.apply(row);
        return Comparator.comparing(due, Comparator.nullsLast(Comparator.<Instant>naturalOrder())).thenComparing(latest);
    }

    public static String normalizeSort(String sort) {
        if (sort == null || sort.isBlank()) {
            return "LATEST";
        }
        String up = sort.trim().toUpperCase(Locale.ROOT);
        if (!SORTS.contains(up)) {
            throw new IllegalArgumentException("sort");
        }
        return up;
    }

    /** 0-based page 슬라이스. page 가 범위를 넘으면 빈 목록. */
    public static <T> List<T> slice(List<T> rows, int page, int size) {
        int from = (int) Math.min((long) page * size, rows.size());
        int to = (int) Math.min((long) from + size, rows.size());
        return rows.subList(from, to);
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
        if (!matchesFieldOrCatalog(recruitFields, tags, query.field())) {
            return false;
        }
        if (!containsAny(query.category(), recruitFields, tags)) {
            return false;
        }
        if (!matchesText(title, agencyName, recruitFields, tags, query.text())) {
            return false;
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

    /** 분야 코드·번역 표시명은 모집 분야와 정형 태그를 같이 본다. 임의 값은 분야 원문만 본다. */
    private static boolean matchesFieldOrCatalog(String[] fields, List<String> tags, String field) {
        if (field == null || field.isBlank()) {
            return true;
        }
        String key = StructuredCatalog.key(field);
        if (key != null) {
            return StructuredCatalog.matches(key, fields, tags);
        }
        return matchesField(fields, field);
    }

    /**
     * 제목·기획사명, 정형 태그 키(ko/en/mn 표시명), 자유 입력 태그를 본다.
     * 비교 문자열은 앞뒤 공백을 버리고 연속 공백을 한 칸으로 맞춘 뒤 소문자로 맞춘다.
     */
    private static boolean matchesText(String title, String agencyName, String[] fields, List<String> tags, String text) {
        if (contains(title, text) || contains(agencyName, text)) {
            return true;
        }
        String key = StructuredCatalog.key(text);
        if (key != null && StructuredCatalog.matches(key, fields, tags)) {
            return true;
        }
        return containsAnyValue(tags, text);
    }

    private static boolean containsAny(String needle, String[] fields, List<String> tags) {
        String wanted = normalize(needle);
        if (wanted == null) {
            return true;
        }
        String key = StructuredCatalog.key(needle);
        if (key != null) {
            return StructuredCatalog.matches(key, fields, tags);
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

    private static boolean containsAnyValue(List<String> values, String needle) {
        if (normalize(needle) == null || values == null) {
            return false;
        }
        for (String value : values) {
            if (containsNormalized(value, needle)) {
                return true;
            }
        }
        return false;
    }

    /** needle 이 비어 있으면 필터를 걸지 않는다. */
    private static boolean contains(String value, String needle) {
        String wanted = normalize(needle);
        if (wanted == null) {
            return true;
        }
        return containsNormalized(value, wanted);
    }

    private static boolean containsNormalized(String value, String needle) {
        String wanted = normalize(needle);
        if (wanted == null) {
            return false;
        }
        String haystack = normalize(value);
        return haystack != null && haystack.contains(wanted);
    }

    private static String normalize(String value) {
        if (value == null) {
            return null;
        }
        String collapsed = value.trim().replaceAll("\\s+", " ").toLowerCase(Locale.ROOT);
        return collapsed.isEmpty() ? null : collapsed;
    }
}
