package com.audition.platform.application.org;

import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class AgencyApprovalTest {

    @Test
    void countryReviewThenHqApprovalActivates() {
        String reviewed = AgencyApproval.next(AgencyApproval.PENDING, AgencyApproval.SUBMIT, false);
        assertEquals(AgencyApproval.COUNTRY_REVIEW, reviewed);
        String waiting = AgencyApproval.next(reviewed, AgencyApproval.RECOMMEND, false);
        assertEquals(AgencyApproval.HQ_REVIEW, waiting);
        assertEquals(AgencyApproval.APPROVED, AgencyApproval.next(waiting, AgencyApproval.HQ_APPROVE, true));
    }

    @Test
    void countryAdminCannotApprove() {
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> AgencyApproval.next(AgencyApproval.HQ_REVIEW, AgencyApproval.HQ_APPROVE, false));
        assertEquals(403, ex.getStatusCode().value());
        assertEquals("HQ_APPROVAL_REQUIRED", ex.getReason());
    }

    @Test
    void approvalWithoutHqReviewIsBlocked() {
        assertThrows(ResponseStatusException.class,
                () -> AgencyApproval.next(AgencyApproval.COUNTRY_REVIEW, AgencyApproval.HQ_APPROVE, true));
    }
}
