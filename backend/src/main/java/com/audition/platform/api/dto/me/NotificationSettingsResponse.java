package com.audition.platform.api.dto.me;

public class NotificationSettingsResponse {

    private boolean savedDeadline = true;
    private boolean newMatch = true;
    private boolean results = true;
    private boolean offers = true;

    public boolean isSavedDeadline() { return savedDeadline; }
    public void setSavedDeadline(boolean savedDeadline) { this.savedDeadline = savedDeadline; }
    public boolean isNewMatch() { return newMatch; }
    public void setNewMatch(boolean newMatch) { this.newMatch = newMatch; }
    public boolean isResults() { return results; }
    public void setResults(boolean results) { this.results = results; }
    public boolean isOffers() { return offers; }
    public void setOffers(boolean offers) { this.offers = offers; }
}
