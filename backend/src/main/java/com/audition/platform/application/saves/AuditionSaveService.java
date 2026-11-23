package com.audition.platform.application.saves;

import com.audition.platform.api.dto.saves.AuditionSaveIdsResponse;
import com.audition.platform.api.dto.saves.AuditionSaveItemResponse;
import com.audition.platform.infra.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.sql.Array;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * 관심 오디션 저장. 웹과 네이티브가 같은 목록을 쓰며, 지원 여부와는 별개다.
 */
@Service
public class AuditionSaveService {

    private final JdbcTemplate jdbc;

    public AuditionSaveService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public AuditionSaveIdsResponse ids() {
        UUID userId = requireUser();
        List<UUID> ids = jdbc.query(
                "SELECT audition_id FROM audition_saves WHERE user_id = ? ORDER BY created_at DESC",
                (rs, i) -> rs.getObject("audition_id", UUID.class),
                userId);
        return new AuditionSaveIdsResponse(ids);
    }

    public List<AuditionSaveItemResponse> list() {
        UUID userId = requireUser();
        Instant now = Instant.now();
        return jdbc.query("""
                SELECT s.audition_id, s.created_at,
                       a.status, a.title, a.agency_name,
                       COALESCE(NULLIF(a.image_medium_url, ''), NULLIF(a.cover_image, ''), a.image_thumb_url) AS cover_image,
                       a.country_code, a.host_country, a.recruit_fields,
                       a.deadline_at, a.start_date, a.end_date
                FROM audition_saves s
                LEFT JOIN auditions a ON a.id = s.audition_id
                WHERE s.user_id = ?
                ORDER BY s.created_at DESC
                """, (rs, i) -> mapRow(rs, now), userId);
    }

    public AuditionSaveItemResponse save(UUID auditionId) {
        UUID userId = requireUser();
        if (auditionId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "auditionId");
        }
        AuditionRow row = loadAudition(auditionId);
        if (row == null || !AuditionSaveStatus.isPubliclySavable(row.status())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "AUDITION_NOT_FOUND");
        }
        jdbc.update("""
                INSERT INTO audition_saves (id, user_id, audition_id)
                VALUES (?, ?, ?)
                ON CONFLICT (user_id, audition_id) DO NOTHING
                """, UUID.randomUUID(), userId, auditionId);
        return list().stream()
                .filter(item -> auditionId.equals(item.getAuditionId()))
                .findFirst()
                .orElseGet(() -> unavailable(auditionId, Instant.now()));
    }

    public void unsave(UUID auditionId) {
        UUID userId = requireUser();
        if (auditionId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "auditionId");
        }
        jdbc.update("DELETE FROM audition_saves WHERE user_id = ? AND audition_id = ?", userId, auditionId);
    }

    private record AuditionRow(String status) {
    }

    private AuditionRow loadAudition(UUID auditionId) {
        List<AuditionRow> rows = jdbc.query(
                "SELECT status FROM auditions WHERE id = ?",
                (rs, i) -> new AuditionRow(rs.getString("status")),
                auditionId);
        return rows.isEmpty() ? null : rows.get(0);
    }

    private AuditionSaveItemResponse mapRow(ResultSet rs, Instant now) throws SQLException {
        UUID auditionId = rs.getObject("audition_id", UUID.class);
        Instant savedAt = ts(rs.getTimestamp("created_at"));
        String status = rs.getString("status");
        String recruitment = AuditionSaveStatus.of(status, ts(rs.getTimestamp("start_date")), now);
        AuditionSaveItemResponse item = new AuditionSaveItemResponse();
        item.setAuditionId(auditionId);
        item.setSavedAt(savedAt);
        item.setRecruitmentStatus(recruitment);
        boolean available = !AuditionSaveStatus.UNAVAILABLE.equals(recruitment);
        item.setAvailable(available);
        if (!available) {
            return item;
        }
        item.setTitle(rs.getString("title"));
        item.setAgencyName(rs.getString("agency_name"));
        item.setCoverImage(rs.getString("cover_image"));
        item.setCountryCode(rs.getString("country_code"));
        item.setHostCountry(rs.getString("host_country"));
        item.setRecruitFields(textArray(rs.getArray("recruit_fields")));
        item.setDeadlineAt(ts(rs.getTimestamp("deadline_at")));
        item.setStartDate(ts(rs.getTimestamp("start_date")));
        item.setEndDate(ts(rs.getTimestamp("end_date")));
        return item;
    }

    private static AuditionSaveItemResponse unavailable(UUID auditionId, Instant savedAt) {
        AuditionSaveItemResponse item = new AuditionSaveItemResponse();
        item.setAuditionId(auditionId);
        item.setSavedAt(savedAt);
        item.setAvailable(false);
        item.setRecruitmentStatus(AuditionSaveStatus.UNAVAILABLE);
        return item;
    }

    private static String[] textArray(Array array) throws SQLException {
        if (array == null) {
            return new String[0];
        }
        Object raw = array.getArray();
        if (raw instanceof String[] strings) {
            return strings;
        }
        return new String[0];
    }

    private static Instant ts(Timestamp t) {
        return t == null ? null : t.toInstant();
    }

    private static UUID requireUser() {
        UUID userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        return userId;
    }
}
