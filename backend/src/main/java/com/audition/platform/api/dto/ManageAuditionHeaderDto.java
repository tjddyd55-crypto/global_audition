package com.audition.platform.api.dto;

public class ManageAuditionHeaderDto {

    private String id;
    private String title;
    /** 부제·한 줄 설명 */
    private String description = "";
    /** SINGLE | MULTI_ROUND */
    private String processMode = "SINGLE";
    /** 오디션 설정 상 최대 차수(있을 때만) */
    private Integer maxRoundNumber;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description != null ? description : "";
    }

    public String getProcessMode() {
        return processMode;
    }

    public void setProcessMode(String processMode) {
        this.processMode = processMode != null ? processMode : "SINGLE";
    }

    public Integer getMaxRoundNumber() {
        return maxRoundNumber;
    }

    public void setMaxRoundNumber(Integer maxRoundNumber) {
        this.maxRoundNumber = maxRoundNumber;
    }
}
