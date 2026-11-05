package com.audition.platform.application.tag;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.TestPropertySource;

import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@TestPropertySource(properties = {
        "spring.datasource.url=${TEST_DB_URL:jdbc:postgresql://localhost:5432/audition_engine_test}",
        "spring.datasource.username=${TEST_DB_USER:postgres}",
        "spring.datasource.password=${TEST_DB_PASSWORD:postgres}",
        "audition.voting-db-verify=false",
        "app.translation.queue.enabled=false",
        "app.super-admin.bootstrap-enabled=false",
})
class AuditionTagReplaceIT {

    @Autowired
    private JdbcTemplate jdbc;
    @Autowired
    private AuditionTagService tags;

    private UUID auditionId;
    private UUID vocal;
    private UUID dancer;

    @BeforeEach
    void setUp() {
        UUID owner = user();
        auditionId = audition(owner);
        vocal = tag("vocal");
        dancer = tag("dancer");
    }

    @AfterEach
    void cleanup() {
        jdbc.update("DELETE FROM audition_tags WHERE audition_id IN (SELECT id FROM auditions WHERE title = 'tag-replace-it')");
        jdbc.update("DELETE FROM auditions WHERE title = 'tag-replace-it'");
        jdbc.update("DELETE FROM tags WHERE name LIKE 'tag-replace-%'");
        jdbc.update("DELETE FROM users WHERE email LIKE '%@tag.replace.test'");
    }

    @Test
    void savingTheSameTagsKeepsTheRows() {
        tags.replaceAuditionTags(auditionId, List.of(vocal.toString(), dancer.toString()), List.of());
        UUID vocalRow = rowId(vocal);

        tags.replaceAuditionTags(auditionId, List.of(dancer.toString(), vocal.toString()), List.of());

        assertEquals(vocalRow, rowId(vocal));
        assertEquals(Set.of(dancer, vocal), Set.copyOf(catalogIds()));
    }

    @Test
    void addingAndRemovingTagsUpdatesOnlyTheDifference() {
        tags.replaceAuditionTags(auditionId, List.of(vocal.toString()), List.of());
        UUID vocalRow = rowId(vocal);

        tags.replaceAuditionTags(auditionId, List.of(vocal.toString(), dancer.toString()), List.of("Street"));
        assertEquals(vocalRow, rowId(vocal));
        assertEquals(List.of("Street"), customNames());

        tags.replaceAuditionTags(auditionId, List.of(dancer.toString()), List.of());
        assertEquals(List.of(dancer), catalogIds());
        assertTrue(customNames().isEmpty());
    }

    @Test
    void emptyTagsClearTheAudition() {
        tags.replaceAuditionTags(auditionId, List.of(vocal.toString()), List.of("Street"));

        tags.replaceAuditionTags(auditionId, List.of(), List.of());

        assertEquals(0L, count());
    }

    @Test
    void duplicateTagIdsAndNamesCollapseToOneRowEach() {
        tags.replaceAuditionTags(
                auditionId,
                List.of(vocal.toString(), vocal.toString()),
                List.of(" Dance ", "dance", "DANCE"));

        assertEquals(List.of(vocal), catalogIds());
        assertEquals(List.of("Dance"), customNames());
    }

    private UUID user() {
        UUID id = UUID.randomUUID();
        String handle = "owner" + id.toString().replace("-", "").substring(0, 8);
        jdbc.update("""
                INSERT INTO users (id, email, password_hash, role, username, display_name, nickname, country_code)
                VALUES (?, ?, 'x', 'AGENCY', ?, ?, ?, 'MN')
                """, id, handle + "@tag.replace.test", handle, handle, handle);
        return id;
    }

    private UUID audition(UUID ownerId) {
        UUID id = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO auditions (id, owner_id, title, description, status, country_code, group_id)
                VALUES (?, ?, 'tag-replace-it', 'desc', 'DRAFT', 'MN', ?)
                """, id, ownerId, id);
        return id;
    }

    private UUID tag(String label) {
        UUID id = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO tags (id, name, type, is_active)
                VALUES (?, ?, 'USER', true)
                """, id, "tag-replace-" + label + "-" + id.toString().substring(0, 8));
        return id;
    }

    private List<UUID> catalogIds() {
        return jdbc.query("""
                SELECT tag_id FROM audition_tags
                WHERE audition_id = ? AND tag_id IS NOT NULL
                ORDER BY tag_id
                """, (rs, row) -> (UUID) rs.getObject("tag_id"), auditionId);
    }

    private List<String> customNames() {
        return jdbc.query("""
                SELECT tag_name FROM audition_tags
                WHERE audition_id = ? AND tag_id IS NULL
                ORDER BY tag_name
                """, (rs, row) -> rs.getString("tag_name"), auditionId);
    }

    private UUID rowId(UUID tagId) {
        return jdbc.queryForObject(
                "SELECT id FROM audition_tags WHERE audition_id = ? AND tag_id = ?",
                UUID.class,
                auditionId,
                tagId);
    }

    private long count() {
        Long count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM audition_tags WHERE audition_id = ?",
                Long.class,
                auditionId);
        return count == null ? 0 : count;
    }
}
