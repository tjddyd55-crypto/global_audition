package com.audition.platform.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class CreateApplicationVideoRequest {

    @NotBlank
    @Pattern(
            regexp = "^(https?://).+",
            message = "videoUrl must be a valid URL"
    )
    private String videoUrl;

    public String getVideoUrl() { return videoUrl; }
    public void setVideoUrl(String videoUrl) { this.videoUrl = videoUrl; }
}
