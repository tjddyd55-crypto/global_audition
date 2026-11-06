package com.audition.platform.application.publicview;

import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** 국가 x 분야 x 상태 x 정렬 조합과 페이지 슬라이스/전체 건수 검증 (DB 없이 순수 로직). */
class PublicAuditionBrowseFilterTest {

    record Row(String id, String status, String country, String[] fields, Instant created, Instant end) {
    }

    private static final Instant BASE = Instant.parse("2026-10-01T00:00:00Z");

    /** 40건: 상태 2 x 국가 4 x 분야 5 */
    private static List<Row> dataset() {
        String[] statuses = {"OPEN", "CLOSED"};
        String[] countries = {"KR", "MN", "JP", "PH"};
        String[][] fields = {{"VOCAL"}, {"보컬", "댄스"}, {"Rap"}, {"ACTING"}, {}};
        List<Row> rows = new ArrayList<>();
        int i = 0;
        for (String st : statuses) {
            for (String c : countries) {
                for (String[] f : fields) {
                    rows.add(new Row("a" + i, st, c, f, BASE.plusSeconds(i * 60L),
                            i % 7 == 0 ? null : BASE.plusSeconds(86400L * ((i * 13) % 40))));
                    i++;
                }
            }
        }
        rows.add(new Row("draft", "DRAFT", "KR", new String[] {"VOCAL"}, BASE, BASE));
        return rows;
    }

    private static List<Row> run(String recruitment, String country, String field, String sort) {
        PublicAuditionBrowse.Query q =
                new PublicAuditionBrowse.Query(recruitment, country, null, null, null, null, null, field, sort);
        return dataset().stream()
                .filter(r -> PublicAuditionBrowse.matches(r.status(), r.country(), r.country(), "T", "Ag",
                        r.fields(), List.of(), null, r.end(), null, q))
                .sorted(PublicAuditionBrowse.comparator(sort, Row::created, Row::end, row -> null))
                .collect(Collectors.toList());
    }

    @Test
    void combosCountExactly() {
        for (String status : new String[] {"OPEN", "ENDED", "ALL"}) {
            int statusMul = "ALL".equals(status) ? 2 : 1;
            for (String country : new String[] {null, "KR", "MN", "JP"}) {
                int countryMul = country == null ? 4 : 1;
                for (String field : new String[] {null, "VOCAL", "DANCE", "RAP", "ACTING", "MODEL"}) {
                    int perGroup = field == null ? 5 : switch (field) {
                        case "VOCAL" -> 2; // VOCAL + 보컬
                        case "DANCE", "RAP", "ACTING" -> 1;
                        default -> 0;
                    };
                    for (String sort : new String[] {"LATEST", "DEADLINE"}) {
                        List<Row> got = run(status, country, field, sort);
                        assertEquals(statusMul * countryMul * perGroup, got.size(),
                                status + "/" + country + "/" + field + "/" + sort);
                        got.forEach(r -> {
                            assertFalse("DRAFT".equals(r.status()));
                            if (country != null) assertEquals(country, r.country());
                            if ("OPEN".equals(status)) assertEquals("OPEN", r.status());
                            if ("ENDED".equals(status)) assertEquals("CLOSED", r.status());
                        });
                    }
                }
            }
        }
    }

    @Test
    void latestSortIsCreatedDesc() {
        List<Row> got = run("ALL", null, null, "LATEST");
        for (int i = 1; i < got.size(); i++) {
            assertTrue(!got.get(i - 1).created().isBefore(got.get(i).created()));
        }
    }

    @Test
    void deadlineSortIsAscendingWithNoDeadlineLast() {
        List<Row> got = run("ALL", null, null, "DEADLINE");
        boolean seenNull = false;
        for (int i = 0; i < got.size(); i++) {
            if (got.get(i).end() == null) {
                seenNull = true;
                continue;
            }
            assertFalse(seenNull, "dated row after undated");
            if (i > 0 && got.get(i - 1).end() != null) {
                assertTrue(!got.get(i - 1).end().isAfter(got.get(i).end()));
            }
        }
        assertTrue(seenNull);
    }

    @Test
    void pagesCoverWholeResultWithoutOverlap() {
        List<Row> all = run("ALL", null, null, "LATEST");
        assertEquals(40, all.size());
        List<String> seen = new ArrayList<>();
        int size = 7;
        for (int p = 0; p * size < all.size(); p++) {
            List<Row> page = PublicAuditionBrowse.slice(all, p, size);
            assertTrue(page.size() <= size);
            page.forEach(r -> seen.add(r.id()));
        }
        assertEquals(all.stream().map(Row::id).collect(Collectors.toList()), seen);
        assertEquals(5, PublicAuditionBrowse.slice(all, 5, 7).size());
        assertTrue(PublicAuditionBrowse.slice(all, 99, 7).isEmpty());
    }

    @Test
    void freeTagQueryCombinesCountryFieldStatusAndPages() {
        Instant base = Instant.parse("2026-11-01T00:00:00Z");
        List<Tagged> rows = List.of(
                tagged("kr-vocal-night", "OPEN", "KR", new String[] {"VOCAL"}, List.of("Night Market"), base),
                tagged("kr-dance-night", "OPEN", "KR", new String[] {"DANCE"}, List.of("Night Market"), base.plusSeconds(10)),
                tagged("mn-vocal-night", "OPEN", "MN", new String[] {"VOCAL"}, List.of("Night Market"), base.plusSeconds(20)),
                tagged("kr-vocal-studio", "OPEN", "KR", new String[] {"VOCAL"}, List.of("Studio"), base.plusSeconds(30)),
                tagged("kr-vocal-closed", "CLOSED", "KR", new String[] {"VOCAL"}, List.of("Night Market"), base.plusSeconds(40)),
                tagged("kr-vocal-spaced", "OPEN", "KR", new String[] {"VOCAL"}, List.of("  night   market "), base.plusSeconds(50)),
                tagged("kr-tag-only", "OPEN", "KR", new String[0], List.of("보컬"), base.plusSeconds(60)),
                tagged("draft", "DRAFT", "KR", new String[] {"VOCAL"}, List.of("Night Market"), base.plusSeconds(70)));
        PublicAuditionBrowse.Query query = new PublicAuditionBrowse.Query(
                "OPEN", "KR", null, null, "  NIGHT   market ", null, null, "VOCAL", "LATEST");
        List<Tagged> matched = filter(rows, query);
        assertEquals(List.of("kr-vocal-spaced", "kr-vocal-night"), matched.stream().map(Tagged::id).toList());

        List<Tagged> page0 = PublicAuditionBrowse.slice(matched, 0, 1);
        List<Tagged> page1 = PublicAuditionBrowse.slice(matched, 1, 1);
        assertEquals(2, matched.size());
        assertEquals(List.of("kr-vocal-spaced"), page0.stream().map(Tagged::id).toList());
        assertEquals(List.of("kr-vocal-night"), page1.stream().map(Tagged::id).toList());
        assertTrue(PublicAuditionBrowse.slice(matched, 2, 1).isEmpty());

        PublicAuditionBrowse.Query structured = new PublicAuditionBrowse.Query(
                "OPEN", "KR", null, null, "Дуу", null, null, null, "LATEST");
        assertEquals(List.of("kr-tag-only", "kr-vocal-spaced", "kr-vocal-studio", "kr-vocal-night"),
                filter(rows, structured).stream().map(Tagged::id).toList());
    }

    private static Tagged tagged(
            String id, String status, String country, String[] fields, List<String> tags, Instant created) {
        return new Tagged(id, status, country, fields, tags, created);
    }

    private static List<Tagged> filter(List<Tagged> rows, PublicAuditionBrowse.Query query) {
        return rows.stream()
                .filter(row -> PublicAuditionBrowse.matches(
                        row.status(), row.country(), row.country(), "Title", "Agency",
                        row.fields(), row.tags(), null, null, null, query))
                .sorted(PublicAuditionBrowse.comparator(query.sort(), Tagged::created, row -> null, row -> null))
                .collect(Collectors.toList());
    }

    private record Tagged(
            String id, String status, String country, String[] fields, List<String> tags, Instant created) {
    }

    @Test
    void sortValidation() {
        assertEquals("LATEST", PublicAuditionBrowse.normalizeSort(null));
        assertEquals("DEADLINE", PublicAuditionBrowse.normalizeSort("deadline"));
        assertThrows(IllegalArgumentException.class, () -> PublicAuditionBrowse.normalizeSort("RANDOM"));
    }
}
