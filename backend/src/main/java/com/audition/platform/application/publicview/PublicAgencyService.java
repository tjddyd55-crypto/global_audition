package com.audition.platform.application.publicview;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * 승인된 기획사 공개 소개. CRM 연락처·메모·사업자 번호는 읽지 않는다.
 * 진행 중 오디션은 auditions 행을 그대로 가리킨다.
 */
@Service
public class PublicAgencyService {

    private final JdbcTemplate jdbcTemplate;

    public PublicAgencyService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<PublicAgencyCard> list() {
        return jdbcTemplate.query(
                """
                SELECT g.id::text AS id, g.display_name, g.country_code, g.website,
                       (
                         SELECT COUNT(*) FROM auditions a
                         WHERE a.status = 'OPEN' AND a.posting_branch_id = g.id
                       ) AS open_count
                FROM crm_agencies g
                WHERE g.approval_state = 'APPROVED'
                ORDER BY g.display_name
                """,
                (rs, rowNum) -> new PublicAgencyCard(
                        rs.getString("id"),
                        rs.getString("display_name"),
                        rs.getString("country_code"),
                        rs.getString("website"),
                        rs.getInt("open_count")));
    }

    public PublicAgencyDetail get(UUID id) {
        List<PublicAgencyDetail> rows = jdbcTemplate.query(
                """
                SELECT id::text AS id, display_name, country_code, website
                FROM crm_agencies
                WHERE id = ? AND approval_state = 'APPROVED'
                """,
                (rs, rowNum) -> new PublicAgencyDetail(
                        rs.getString("id"),
                        rs.getString("display_name"),
                        rs.getString("country_code"),
                        rs.getString("website"),
                        List.of()),
                id);
        if (rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "기획사를 찾을 수 없습니다.");
        }
        PublicAgencyDetail row = rows.get(0);
        return new PublicAgencyDetail(row.id(), row.displayName(), row.countryCode(), row.website(), openAuditions(id));
    }

    private List<PublicAgencyAudition> openAuditions(UUID agencyId) {
        return jdbcTemplate.query(
                """
                SELECT id::text AS id, title, status, country_code, deadline_at
                FROM auditions
                WHERE status = 'OPEN' AND posting_branch_id = ?
                ORDER BY created_at DESC
                """,
                (rs, rowNum) -> mapAudition(rs),
                agencyId);
    }

    private static PublicAgencyAudition mapAudition(ResultSet rs) throws SQLException {
        Timestamp deadline = rs.getTimestamp("deadline_at");
        Instant at = deadline != null ? deadline.toInstant() : null;
        return new PublicAgencyAudition(
                rs.getString("id"),
                rs.getString("title"),
                rs.getString("status"),
                rs.getString("country_code"),
                at);
    }

    public record PublicAgencyCard(String id, String displayName, String countryCode, String website, int openAuditionCount) {
    }

    public record PublicAgencyDetail(
            String id, String displayName, String countryCode, String website, List<PublicAgencyAudition> auditions) {
    }

    public record PublicAgencyAudition(String id, String title, String status, String countryCode, Instant deadlineAt) {
    }
}
