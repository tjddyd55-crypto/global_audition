package com.audition.platform.api.dto;

/**
 * 오디션 원문 또는 번역 한 벌. 공개 응답의 title 등 표시 필드와 분리한다.
 * description 이 본문이다. 별도 body 컬럼은 없다.
 */
public class AuditionTextSnapshot {

    private String title = "";
    private String description = "";
    private String location = "";
    private String agencyName = "";
    private String[] recruitFields = new String[0];
    private String[] qualifications = new String[0];
    private String[] schedules = new String[0];
    private String[] benefits = new String[0];

    public static AuditionTextSnapshot capture(AuditionResponse response) {
        AuditionTextSnapshot snapshot = new AuditionTextSnapshot();
        snapshot.title = text(response.getTitle());
        snapshot.description = text(response.getDescription());
        snapshot.location = text(response.getLocation());
        snapshot.agencyName = text(response.getAgencyName());
        snapshot.recruitFields = copy(response.getRecruitFields());
        snapshot.qualifications = copy(response.getQualifications());
        snapshot.schedules = copy(response.getSchedules());
        snapshot.benefits = copy(response.getBenefits());
        return snapshot;
    }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = text(title); }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = text(description); }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = text(location); }
    public String getAgencyName() { return agencyName; }
    public void setAgencyName(String agencyName) { this.agencyName = text(agencyName); }
    public String[] getRecruitFields() { return copy(recruitFields); }
    public void setRecruitFields(String[] recruitFields) { this.recruitFields = copy(recruitFields); }
    public String[] getQualifications() { return copy(qualifications); }
    public void setQualifications(String[] qualifications) { this.qualifications = copy(qualifications); }
    public String[] getSchedules() { return copy(schedules); }
    public void setSchedules(String[] schedules) { this.schedules = copy(schedules); }
    public String[] getBenefits() { return copy(benefits); }
    public void setBenefits(String[] benefits) { this.benefits = copy(benefits); }

    private static String text(String raw) {
        return raw == null ? "" : raw;
    }

    private static String[] copy(String[] values) {
        if (values == null || values.length == 0) {
            return new String[0];
        }
        String[] copied = new String[values.length];
        for (int i = 0; i < values.length; i++) {
            copied[i] = values[i] == null ? "" : values[i];
        }
        return copied;
    }
}
