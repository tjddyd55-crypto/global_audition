package com.audition.platform.api.dto.me;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class MeUserSnsLinkDto {

    @NotBlank
    @Size(max = 32)
    private String platform;

    @NotBlank
    @Size(max = 2048)
    private String url;

    public String getPlatform() {
        return platform;
    }

    public void setPlatform(String platform) {
        this.platform = platform;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }
}
