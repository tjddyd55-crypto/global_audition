package com.audition.platform.api.dto.recommend;

import java.util.List;

public class AuditionRecommendationResponse {

    private List<RecommendedAuditionItemResponse> items = List.of();
    private boolean fallback;
    private boolean personalized;

    public List<RecommendedAuditionItemResponse> getItems() { return items; }
    public void setItems(List<RecommendedAuditionItemResponse> items) { this.items = items != null ? items : List.of(); }
    public boolean isFallback() { return fallback; }
    public void setFallback(boolean fallback) { this.fallback = fallback; }
    public boolean isPersonalized() { return personalized; }
    public void setPersonalized(boolean personalized) { this.personalized = personalized; }
}
