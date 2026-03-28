package com.audition.platform.api.dto.channel;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class PatchVideoVisibilityRequest {

    @NotBlank
    @Pattern(regexp = "PUBLIC|PRIVATE")
    private String visibility;

    public String getVisibility() {
        return visibility;
    }

    public void setVisibility(String visibility) {
        this.visibility = visibility;
    }
}
