package com.audition.platform.api.dto.me;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class PatchMyChannelVideoRequest {

    @Size(max = 300)
    private String title;

    @Size(max = 8000)
    private String description;

    @Size(max = 100)
    private String category;

    @Size(max = 2048)
    private String thumbnailUrl;

    @Pattern(regexp = "PUBLIC|PRIVATE")
    private String visibility;

    @Size(max = 2048)
    private String videoUrl;

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

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getThumbnailUrl() {
        return thumbnailUrl;
    }

    public void setThumbnailUrl(String thumbnailUrl) {
        this.thumbnailUrl = thumbnailUrl;
    }

    public String getVisibility() {
        return visibility;
    }

    public void setVisibility(String visibility) {
        this.visibility = visibility;
    }

    public String getVideoUrl() {
        return videoUrl;
    }

    public void setVideoUrl(String videoUrl) {
        this.videoUrl = videoUrl;
    }
}
