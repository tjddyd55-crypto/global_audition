package com.audition.platform.api.dto.me;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class MeUserSnsLinkDto {

    @NotBlank(message = "SNS 플랫폼을 선택해 주세요.")
    @Size(max = 32, message = "SNS 플랫폼 값이 너무 깁니다.")
    private String platform;

    @NotBlank(message = "SNS URL을 입력해 주세요.")
    @Size(max = 2048, message = "SNS URL이 너무 깁니다.")
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
