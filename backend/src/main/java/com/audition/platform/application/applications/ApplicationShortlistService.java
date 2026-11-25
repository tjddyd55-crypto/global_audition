package com.audition.platform.application.applications;

import com.audition.platform.application.round.AuditionManageAccess;
import com.audition.platform.domain.audition.Audition;
import com.audition.platform.infra.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.time.Instant;
import java.util.*;

/** Internal review state, shared by existing authorized audition managers, separate from talent saves. */
@Service
public class ApplicationShortlistService {
    private final JdbcTemplate jdbc;
    private final AuditionManageAccess access;
    public ApplicationShortlistService(JdbcTemplate jdbc, AuditionManageAccess access) { this.jdbc = jdbc; this.access = access; }
    public record Saved(UUID applicationId, int roundNumber, UUID savedBy, Instant savedAt, String memo) {}

    public Map<UUID, Saved> list(UUID auditionId, int round) {
        Audition audition = access.requireManagedAudition(auditionId);
        checkRound(round);
        Map<UUID, Saved> result = new HashMap<>();
        jdbc.query("SELECT application_id, round_number, saved_by, saved_at, memo FROM application_shortlists WHERE agency_user_id=? AND audition_id=? AND round_number=?",
            rs -> { UUID id = rs.getObject(1, UUID.class); result.put(id, new Saved(id, rs.getInt(2), rs.getObject(3, UUID.class), rs.getTimestamp(4).toInstant(), rs.getString(5))); },
            audition.getOwnerId(), auditionId, round);
        return result;
    }

    @Transactional
    public void change(UUID auditionId, int round, List<UUID> applicationIds, boolean saved) {
        Audition audition = access.requireManagedAudition(auditionId);
        checkRound(round);
        if (applicationIds == null || applicationIds.isEmpty() || applicationIds.size() > 100 || applicationIds.stream().anyMatch(Objects::isNull)) bad("지원자를 1~100명 선택해 주세요.");
        // Validate the whole batch first: no partial writes and no cross-audition/stage bookmarks.
        for (UUID id : new LinkedHashSet<>(applicationIds)) {
            Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM application_entry_numbers WHERE audition_id=? AND application_id=? AND round_number=?", Integer.class, auditionId, id, round);
            if (count == null || count != 1) bad("해당 검토 단계의 지원자가 아닙니다.");
        }
        for (UUID id : new LinkedHashSet<>(applicationIds)) {
            if (saved) jdbc.update("INSERT INTO application_shortlists(agency_user_id,audition_id,application_id,round_number,saved_by) VALUES(?,?,?,?,?) ON CONFLICT DO NOTHING", audition.getOwnerId(), auditionId, id, round, SecurityUtils.getCurrentUserId());
            else jdbc.update("DELETE FROM application_shortlists WHERE agency_user_id=? AND audition_id=? AND application_id=? AND round_number=?", audition.getOwnerId(), auditionId, id, round);
        }
    }

    @Transactional
    public void memo(UUID auditionId, int round, UUID id, String memo) {
        Audition audition = access.requireManagedAudition(auditionId);
        checkRound(round);
        if (memo != null && memo.length() > 1000) bad("메모는 1,000자 이내로 작성해 주세요.");
        int changed = jdbc.update("UPDATE application_shortlists SET memo=?, updated_by=?, updated_at=NOW() WHERE agency_user_id=? AND audition_id=? AND application_id=? AND round_number=?", memo == null ? null : memo.trim(), SecurityUtils.getCurrentUserId(), audition.getOwnerId(), auditionId, id, round);
        if (changed == 0) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "관심 등록 후 메모를 저장해 주세요.");
    }
    private static void checkRound(int round) { if (round < 0) bad("검토 단계가 올바르지 않습니다."); }
    private static void bad(String message) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message); }
}
