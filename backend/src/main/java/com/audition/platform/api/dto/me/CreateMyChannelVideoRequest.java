package com.audition.platform.api.dto.me;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class CreateMyChannelVideoRequest {

    @NotBlank
    @Size(max = 300)
    private String title;

    @Size(max = 8000)
    private String description;

    @NotBlank
    @Pattern(regexp = "^(https?://).+", message = "videoUrl must be a valid URL")
    private String videoUrl;

    @Size(max = 100)
    private String category;

    /** 생략 시 PRIVATE */
    @Pattern(regexp = "^$|PUBLIC|PRIVATE")
    private String visibility;

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
        this.description = description;
    }

    public String getVideoUrl() {
        return videoUrl;
    }

    public void setVideoUrl(String videoUrl) {
        this.videoUrl = videoUrl;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getVisibility() {
        return visibility;
    }

    public void setVisibility(String visibility) {
        this.visibility = visibility;
    }
}
