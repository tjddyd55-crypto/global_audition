package com.audition.platform.application.audition;

import com.audition.platform.application.org.AgencyApproval;
import com.audition.platform.application.org.JdbcCrmStore;
import com.audition.platform.application.org.JdbcCrmStore.AgencyRow;
import com.audition.platform.application.org.OrgDirectory;
import com.audition.platform.application.org.OrgRoles;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

/**
 * 기획사 공고의 게시 지점.
 *
 * <p>소유자는 {@code crm_agencies.linked_user_id} 다. 쓸 수 있는 지점은
 * stage ACTIVE 이고 approval_state APPROVED 인 행만이다.
 * 운영 국가는 그 지점의 country_code 이고, 지원자 국적이나 사용자 국가로 바꾸지 않는다.
 * 기존 공고의 지점은 요청이 없으면 그대로 둔다.</p>
 */
@Component
public class PostingBranchPolicy {

    public static final String REQUIRED = "POSTING_BRANCH_REQUIRED";
    public static final String NONE = "POSTING_BRANCH_NONE";
    public static final String NOT_APPROVED = "POSTING_BRANCH_NOT_APPROVED";
    public static final String FORBIDDEN = "POSTING_BRANCH_FORBIDDEN";
    public static final String INVALID = "POSTING_BRANCH_INVALID";

    private final JdbcCrmStore crm;
    private final OrgDirectory directory;

    public PostingBranchPolicy(JdbcCrmStore crm, OrgDirectory directory) {
        this.crm = crm;
        this.directory = directory;
    }

    /** 새 공고. 승인된 활성 지점이 하나면 그 지점을 붙인다. */
    public UUID resolveCreate(UUID ownerId, String requestedRaw, String status) {
        if (!agencyOwned(ownerId)) {
            return requestedRaw == null || requestedRaw.isBlank() ? null : requireSelectable(ownerId, parse(requestedRaw));
        }
        UUID requested = parse(requestedRaw);
        if (requested != null) {
            return requireSelectable(ownerId, requested);
        }
        List<AgencyRow> eligible = eligible(ownerId);
        if (eligible.size() > 1) {
            throw badRequest(REQUIRED);
        }
        UUID chosen = eligible.size() == 1 ? eligible.get(0).id() : null;
        if (published(status) && chosen == null) {
            throw badRequest(NONE);
        }
        return chosen;
    }

    /**
     * 임시 저장과 게시 전환에서 소유·승인을 다시 본다.
     * 요청에 지점이 없으면 이미 저장된 값을 유지하고, 비어 있는 기존 공고는 채우지 않는다.
     */
    public UUID resolveUpdate(UUID ownerId, UUID current, String requestedRaw, String previousStatus, String nextStatus) {
        if (!agencyOwned(ownerId)) {
            return requestedRaw == null || requestedRaw.isBlank() ? current : requireSelectable(ownerId, parse(requestedRaw));
        }
        UUID requested = parse(requestedRaw);
        UUID chosen = requested != null ? requireSelectable(ownerId, requested) : current;
        boolean enteringPublished = published(nextStatus) && !published(previousStatus);
        if (needsRecheck(chosen, requested, nextStatus, enteringPublished)) {
            chosen = requireSelectable(ownerId, chosen);
        }
        if (enteringPublished && chosen == null) {
            throw badRequest(eligible(ownerId).isEmpty() ? NONE : REQUIRED);
        }
        return chosen;
    }

    /** 다음 차 공고. 원 공고의 지점이 아직 유효하면 그 지점을 잇고, 없으면 하나일 때만 자동으로 붙인다. */
    public UUID continueSeries(UUID ownerId, UUID sourceBranchId) {
        if (!agencyOwned(ownerId)) {
            return sourceBranchId;
        }
        if (sourceBranchId != null && eligible(ownerId).stream().anyMatch(row -> sourceBranchId.equals(row.id()))) {
            return sourceBranchId;
        }
        List<AgencyRow> eligible = eligible(ownerId);
        return eligible.size() == 1 ? eligible.get(0).id() : null;
    }

    private boolean needsRecheck(UUID chosen, UUID requested, String nextStatus, boolean enteringPublished) {
        if (chosen == null || requested != null) {
            return false;
        }
        return !published(nextStatus) || enteringPublished;
    }

    private List<AgencyRow> eligible(UUID ownerId) {
        return crm.findByLinkedUser(ownerId).stream().filter(PostingBranchPolicy::approvedActive).toList();
    }

    private UUID requireSelectable(UUID ownerId, UUID branchId) {
        AgencyRow row = crm.find(branchId).orElseThrow(() -> badRequest(INVALID));
        if (row.linkedUserId() == null || !row.linkedUserId().equals(ownerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, FORBIDDEN);
        }
        if (!approvedActive(row)) {
            throw badRequest(NOT_APPROVED);
        }
        return row.id();
    }

    private boolean agencyOwned(UUID ownerId) {
        if (ownerId == null) {
            return false;
        }
        String role = directory.roleOf(ownerId);
        return role != null && OrgRoles.agencyOperator(role.trim());
    }

    private static boolean approvedActive(AgencyRow row) {
        return "ACTIVE".equals(row.stage()) && AgencyApproval.APPROVED.equals(row.approvalState());
    }

    private static boolean published(String status) {
        return "OPEN".equals(status) || "CLOSED".equals(status);
    }

    private static UUID parse(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return UUID.fromString(raw.trim());
        } catch (IllegalArgumentException ex) {
            throw badRequest(INVALID);
        }
    }

    private static ResponseStatusException badRequest(String code) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, code);
    }
}
