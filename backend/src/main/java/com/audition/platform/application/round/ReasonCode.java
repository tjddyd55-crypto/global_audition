package com.audition.platform.application.round;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/**
 * 라운드·제출·관리자 심사 API의 실패 reason — {@link #name()}이 응답 reason과 일치한다.
 * HTTP Status는 {@link #toException()}에서 일관 매핑한다.
 */
public enum ReasonCode {

    /** eligibility 성공 응답용 (예외로 사용 금지) */
    OK,

    // --- 사용자 submit / eligibility ---
    UNDER_REVIEW_LOCKED,
    ROUND_NOT_ACTIVE,
    /** 제출 불가(폴백·알 수 없는 코드) */
    NOT_ELIGIBLE_ROUND,
    SUBMISSION_NOT_FOUND,

    AUDITION_ROUND_MISMATCH,
    NOT_MULTI_ROUND,
    AUDITION_NOT_OPEN,
    APPLICATION_CLOSED,
    WRONG_CURRENT_ROUND,
    PREVIOUS_ROUND_NOT_PASSED,
    NO_SUBMISSION_ROW,
    SUBMISSION_CLOSED,
    ROUND_ALREADY_DECIDED,

    // --- 리소스 404 (관리자·사용자 공통 조회 실패) ---
    APPLICATION_NOT_FOUND,
    AUDITION_NOT_FOUND,
    ROUND_NOT_FOUND,

    // --- 관리자 심사 ---
    REVIEW_SUBMISSION_ALREADY_FINAL,
    REVIEW_ROUND_SKIPPED,
    REVIEW_INVALID_FROM_STATUS,
    REVIEW_INVALID_RESULT_STATUS,
    NEXT_ROUND_NOT_CREATED,

    /** 공개 투표 — 라운드 review_method·제출 상태·vote_count 동기화 */
    VOTE_ROUND_NOT_PUBLIC,
    VOTE_SUBMISSION_NOT_VOTEABLE,
    VOTE_COUNT_SYNC_ERROR;

    /**
     * API 오류 응답({@link ResponseStatusException#getReason()} = {@link #name()}).
     */
    public ResponseStatusException toException() {
        if (this == OK) {
            throw new IllegalStateException("ReasonCode.OK must not be thrown as an API error");
        }
        return new ResponseStatusException(httpStatus(), name());
    }

    private HttpStatus httpStatus() {
        return switch (this) {
            case OK -> throw new IllegalStateException();
            case UNDER_REVIEW_LOCKED, ROUND_NOT_ACTIVE, WRONG_CURRENT_ROUND, PREVIOUS_ROUND_NOT_PASSED,
                    SUBMISSION_CLOSED, ROUND_ALREADY_DECIDED, REVIEW_SUBMISSION_ALREADY_FINAL, REVIEW_ROUND_SKIPPED,
                    NEXT_ROUND_NOT_CREATED -> HttpStatus.CONFLICT;
            case NOT_ELIGIBLE_ROUND, APPLICATION_CLOSED -> HttpStatus.FORBIDDEN;
            case SUBMISSION_NOT_FOUND, NO_SUBMISSION_ROW, APPLICATION_NOT_FOUND, AUDITION_NOT_FOUND, ROUND_NOT_FOUND ->
                    HttpStatus.NOT_FOUND;
            case AUDITION_ROUND_MISMATCH, NOT_MULTI_ROUND, AUDITION_NOT_OPEN, REVIEW_INVALID_FROM_STATUS,
                    REVIEW_INVALID_RESULT_STATUS, VOTE_ROUND_NOT_PUBLIC, VOTE_SUBMISSION_NOT_VOTEABLE ->
                    HttpStatus.BAD_REQUEST;
            case VOTE_COUNT_SYNC_ERROR -> HttpStatus.CONFLICT;
        };
    }

    /**
     * 제출 API: eligibility 상세의 reasonCode 문자열 → 동일 코드·HTTP 로 예외.
     * 알 수 없거나 OK 인 경우 {@link #NOT_ELIGIBLE_ROUND}(403).
     */
    public static ResponseStatusException submitEligibilityDenied(String reasonCodeName) {
        if (reasonCodeName == null || reasonCodeName.isBlank()) {
            return NOT_ELIGIBLE_ROUND.toException();
        }
        if (OK.name().equals(reasonCodeName)) {
            return NOT_ELIGIBLE_ROUND.toException();
        }
        try {
            ReasonCode c = ReasonCode.valueOf(reasonCodeName);
            if (c == OK) {
                return NOT_ELIGIBLE_ROUND.toException();
            }
            return c.toException();
        } catch (IllegalArgumentException e) {
            return NOT_ELIGIBLE_ROUND.toException();
        }
    }
}
