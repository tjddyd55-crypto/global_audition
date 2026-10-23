package com.audition.platform.api.dto.admin;

public class AdminPatchAuditionRoundNoticesRequest {

    private String announcementTitle;
    private String announcementBody;
    private String submissionLabel;
    private String submissionGuide;
    private String sourceLocale;

    public String getAnnouncementTitle() { return announcementTitle; }
    public void setAnnouncementTitle(String announcementTitle) { this.announcementTitle = announcementTitle; }
    public String getAnnouncementBody() { return announcementBody; }
    public void setAnnouncementBody(String announcementBody) { this.announcementBody = announcementBody; }
    public String getSubmissionLabel() { return submissionLabel; }
    public void setSubmissionLabel(String submissionLabel) { this.submissionLabel = submissionLabel; }
    public String getSubmissionGuide() { return submissionGuide; }
    public void setSubmissionGuide(String submissionGuide) { this.submissionGuide = submissionGuide; }
    public String getSourceLocale() { return sourceLocale; }
    public void setSourceLocale(String sourceLocale) { this.sourceLocale = sourceLocale; }
}
