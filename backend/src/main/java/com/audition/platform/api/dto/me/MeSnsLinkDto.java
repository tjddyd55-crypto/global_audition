package com.audition.platform.api.dto.me;

public class MeSnsLinkDto {

    private String platform;
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
