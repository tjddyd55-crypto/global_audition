package com.audition.platform.api.dto;

public class AdminCreditBulkGrantResponse {

    private int affectedUsers;
    private long totalCreditsGranted;

    public AdminCreditBulkGrantResponse() {
    }

    public AdminCreditBulkGrantResponse(int affectedUsers, long totalCreditsGranted) {
        this.affectedUsers = affectedUsers;
        this.totalCreditsGranted = totalCreditsGranted;
    }

    public int getAffectedUsers() {
        return affectedUsers;
    }

    public void setAffectedUsers(int affectedUsers) {
        this.affectedUsers = affectedUsers;
    }

    public long getTotalCreditsGranted() {
        return totalCreditsGranted;
    }

    public void setTotalCreditsGranted(long totalCreditsGranted) {
        this.totalCreditsGranted = totalCreditsGranted;
    }
}
