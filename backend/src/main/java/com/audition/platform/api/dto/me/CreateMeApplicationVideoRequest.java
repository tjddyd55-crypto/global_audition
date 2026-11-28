package com.audition.platform.api.dto.me;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CreateMeApplicationVideoRequest {

    @Size(max = 200)
    private String title;

    @NotBlank
    @jakarta.validation.constraints.Size(max = 4000)
    private String videoUrl;

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getVideoUrl() {
        return videoUrl;
    }

    public void setVideoUrl(String videoUrl) {
        this.videoUrl = videoUrl;
    }
}
