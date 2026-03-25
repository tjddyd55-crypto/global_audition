package com.audition.platform.api.dto.me;

import jakarta.validation.constraints.Size;

/**
 * POST /api/me/applications/{applicationId}/rounds/{roundId}/submit
 */
public class MeRoundSubmitRequest {

    @Size(max = 4000)
    private String videoUrl;

    @Size(max = 4000)
    private String fileUrl;

    @Size(max = 20000)
    private String textAnswer;

    public String getVideoUrl() {
        return videoUrl;
    }

    public void setVideoUrl(String videoUrl) {
        this.videoUrl = videoUrl;
    }

    public String getFileUrl() {
        return fileUrl;
    }

    public void setFileUrl(String fileUrl) {
        this.fileUrl = fileUrl;
    }

    public String getTextAnswer() {
        return textAnswer;
    }

    public void setTextAnswer(String textAnswer) {
        this.textAnswer = textAnswer;
    }
}
