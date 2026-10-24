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
    void sortValidation() {
        assertEquals("LATEST", PublicAuditionBrowse.normalizeSort(null));
        assertEquals("DEADLINE", PublicAuditionBrowse.normalizeSort("deadline"));
        assertThrows(IllegalArgumentException.class, () -> PublicAuditionBrowse.normalizeSort("RANDOM"));
    }
}
