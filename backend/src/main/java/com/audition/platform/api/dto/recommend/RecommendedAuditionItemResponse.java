package com.audition.platform.api.dto.recommend;

import com.audition.platform.api.dto.AuditionResponse;

import java.util.List;

public class RecommendedAuditionItemResponse {

    private AuditionResponse audition;
    private List<String> reasons = List.of();
    private String eligibility;
    private int score;

    public AuditionResponse getAudition() { return audition; }
    public void setAudition(AuditionResponse audition) { this.audition = audition; }
    public List<String> getReasons() { return reasons; }
    public void setReasons(List<String> reasons) { this.reasons = reasons != null ? reasons : List.of(); }
    public String getEligibility() { return eligibility; }
    public void setEligibility(String eligibility) { this.eligibility = eligibility; }
    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }
}
