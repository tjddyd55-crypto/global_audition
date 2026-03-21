package com.audition.platform.api.dto.me;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class PatchVaultItemRequest {

    @Size(max = 500)
    private String title;

    @Size(max = 8000)
    private String description;

    @Pattern(regexp = "DEMO_AUDIO|LYRICS|STEP_VIDEO|DANCE_IDEA|GUIDE_VOCAL|PORTFOLIO_FILE")
    private String type;

    @Pattern(regexp = "PUBLIC|AUDITION_ONLY|PRIVATE")
    private String visibility;

    @Pattern(regexp = "HUMAN|AI_ASSISTED|AI_GENERATED")
    private String creationMethod;

    @Size(max = 2048)
    private String fileUrl;

    @Size(max = 2048)
    private String audioUrl;

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

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getVisibility() {
        return visibility;
    }

    public void setVisibility(String visibility) {
        this.visibility = visibility;
    }

    public String getCreationMethod() {
        return creationMethod;
    }

    public void setCreationMethod(String creationMethod) {
        this.creationMethod = creationMethod;
    }

    public String getFileUrl() {
        return fileUrl;
    }

    public void setFileUrl(String fileUrl) {
        this.fileUrl = fileUrl;
    }

    public String getAudioUrl() {
        return audioUrl;
    }

    public void setAudioUrl(String audioUrl) {
        this.audioUrl = audioUrl;
    }

    public String getVideoUrl() {
        return videoUrl;
    }

    public void setVideoUrl(String videoUrl) {
        this.videoUrl = videoUrl;
    }
}
