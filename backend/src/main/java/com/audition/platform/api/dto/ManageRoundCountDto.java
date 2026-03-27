package com.audition.platform.api.dto;

/**
 * 지원자 관리 화면 — 지원서 현재 차수({@code applications.current_round_number})별 인원.
 */
public class ManageRoundCountDto {

    private int round;
    private long count;

    public ManageRoundCountDto() {
    }

    public ManageRoundCountDto(int round, long count) {
        this.round = round;
        this.count = count;
    }

    public int getRound() {
        return round;
    }

    public void setRound(int round) {
        this.round = round;
    }

    public long getCount() {
        return count;
    }

    public void setCount(long count) {
        this.count = count;
    }
}
