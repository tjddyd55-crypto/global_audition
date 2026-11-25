package com.audition.platform.application.applications;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

/** Read persisted numbers; filtering, sorting and votes never allocate or change them. */
@Service
public class ApplicationEntryNumbers {
    private final JdbcTemplate jdbc;
    public ApplicationEntryNumbers(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public Map<UUID, Integer> forScope(UUID auditionId, int roundNumber) {
        Map<UUID, Integer> numbers = new HashMap<>();
        jdbc.query("SELECT application_id, entry_number FROM application_entry_numbers WHERE audition_id = ? AND round_number = ?",
                (org.springframework.jdbc.core.RowCallbackHandler) row -> numbers.put(row.getObject("application_id", UUID.class), row.getInt("entry_number")),
                auditionId, roundNumber);
        return numbers;
    }
    public Map<Integer, Long> roundCounts(UUID auditionId) {
        Map<Integer, Long> counts = new HashMap<>();
        jdbc.query("SELECT round_number, COUNT(*) AS n FROM application_entry_numbers WHERE audition_id = ? AND round_number > 0 GROUP BY round_number",
                (org.springframework.jdbc.core.RowCallbackHandler) row -> counts.put(row.getInt("round_number"), row.getLong("n")), auditionId);
        return counts;
    }

    public java.util.List<com.audition.platform.api.dto.ApplicationAgencyDetailDto.NumberHistoryItem> history(UUID applicationId) {
        return jdbc.query("""
                SELECT kind, round_number, number FROM (
                  SELECT CASE WHEN round_number = 0 THEN 'RECEIPT' ELSE 'REVIEW' END AS kind,
                         round_number, entry_number AS number, 0 AS stage
                  FROM application_entry_numbers WHERE application_id = ?
                  UNION ALL
                  SELECT 'VOTE', round_number, candidate_number, 1 FROM audition_vote_candidates WHERE application_id = ?
                ) n ORDER BY round_number, stage
                """, (row, index) -> new com.audition.platform.api.dto.ApplicationAgencyDetailDto.NumberHistoryItem(
                    row.getString("kind"), row.getInt("round_number"), row.getInt("number")), applicationId, applicationId);
    }

}
