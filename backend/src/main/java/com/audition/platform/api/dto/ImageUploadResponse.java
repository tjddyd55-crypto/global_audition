package com.audition.platform.api.dto;

/**
 * POST /api/uploads/image 응답 — 프론트 폼 state에 URL만 저장.
 */
public class ImageUploadResponse {

    private String url;

    public ImageUploadResponse() {
    }

    public ImageUploadResponse(String url) {
        this.url = url;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }
}
