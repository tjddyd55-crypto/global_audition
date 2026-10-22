package com.audition.platform.application.org;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/**
 * 국가 검토 뒤 본사만 APPROVED 로 바꾼다. 국가 관리자의 승인 시도는 거절한다.
 */
public final class AgencyApproval {

    public static final String PENDING = "PENDING";
    public static final String COUNTRY_REVIEW = "COUNTRY_REVIEW";
    public static final String HQ_REVIEW = "HQ_REVIEW";
    public static final String APPROVED = "APPROVED";
    public static final String REJECTED = "REJECTED";
    public static final String SUSPENDED = "SUSPENDED";

    public static final String SUBMIT = "SUBMIT";
    public static final String SUPPLEMENT = "SUPPLEMENT";
    public static final String RECOMMEND = "RECOMMEND";
    public static final String COUNTRY_REJECT = "COUNTRY_REJECT";
    public static final String HQ_APPROVE = "HQ_APPROVE";
    public static final String HQ_REJECT = "HQ_REJECT";
    public static final String SUSPEND = "SUSPEND";

    private AgencyApproval() {
    }

    public static String next(String current, String action, boolean hq) {
        if (HQ_APPROVE.equals(action) && !hq) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "HQ_APPROVAL_REQUIRED");
        }
        if (SUSPEND.equals(action) && !hq) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "HQ_ONLY");
        }
        return switch (action) {
            case SUBMIT -> {
                if (!PENDING.equals(current)) {
                    throw invalid();
                }
                yield COUNTRY_REVIEW;
            }
            case SUPPLEMENT -> {
                if (!COUNTRY_REVIEW.equals(current) && !HQ_REVIEW.equals(current)) {
                    throw invalid();
                }
                yield current;
            }
            case RECOMMEND -> {
                if (!COUNTRY_REVIEW.equals(current)) {
                    throw invalid();
                }
                yield HQ_REVIEW;
            }
            case COUNTRY_REJECT -> {
                if (!COUNTRY_REVIEW.equals(current)) {
                    throw invalid();
                }
                yield REJECTED;
            }
            case HQ_APPROVE -> {
                if (!HQ_REVIEW.equals(current)) {
                    throw invalid();
                }
                yield APPROVED;
            }
            case HQ_REJECT -> {
                if (!HQ_REVIEW.equals(current) && !COUNTRY_REVIEW.equals(current)) {
                    throw invalid();
                }
                yield REJECTED;
            }
            case SUSPEND -> {
                if (!APPROVED.equals(current)) {
                    throw invalid();
                }
                yield SUSPENDED;
            }
            default -> throw invalid();
        };
    }

    private static ResponseStatusException invalid() {
        return new ResponseStatusException(HttpStatus.CONFLICT, "APPROVAL_TRANSITION_DENIED");
    }
}
