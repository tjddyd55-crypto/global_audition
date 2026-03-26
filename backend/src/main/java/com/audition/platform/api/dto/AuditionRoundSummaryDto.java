package com.audition.platform.api.dto;

/**
 * MULTI_ROUND 오디션의 라운드 식별 — 지원자 eligibility·제출 URL 구성용.
 */
public class AuditionRoundSummaryDto {

    private String roundId;
    private int roundNumber;

    public AuditionRoundSummaryDto() {
    }

    public AuditionRoundSummaryDto(String roundId, int roundNumber) {
        this.roundId = roundId;
        this.roundNumber = roundNumber;
    }

    public String getRoundId() {
        return roundId;
    }

    public void setRoundId(String roundId) {
        this.roundId = roundId;
    }

    public int getRoundNumber() {
        return roundNumber;
    }

    public void setRoundNumber(int roundNumber) {
        this.roundNumber = roundNumber;
    }
}
