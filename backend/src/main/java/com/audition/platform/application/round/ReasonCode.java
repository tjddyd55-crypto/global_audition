package com.audition.platform.application.round;

/**
 * 라운드·제출 eligibility 및 submit 실패 시 응답 reason 단일 정의.
 * API/프론트 계약은 {@link #name()} 문자열로 통일한다.
 */
public enum ReasonCode {

    /** eligibility 성공 (제출 가능 여부는 별도 필드) */
    OK,

    UNDER_REVIEW_LOCKED,
    ROUND_NOT_ACTIVE,
    /** eligibility 통과했으나 제출 불가 등 기본 거절 */
    NOT_ELIGIBLE_ROUND,
    /** 재조회 등으로 제출 행이 사라진 동시성/데이터 이상 */
    SUBMISSION_NOT_FOUND,

    AUDITION_ROUND_MISMATCH,
    NOT_MULTI_ROUND,
    AUDITION_NOT_OPEN,
    APPLICATION_CLOSED,
    WRONG_CURRENT_ROUND,
    PREVIOUS_ROUND_NOT_PASSED,
    NO_SUBMISSION_ROW,
    SUBMISSION_CLOSED,
    ROUND_ALREADY_DECIDED
}
