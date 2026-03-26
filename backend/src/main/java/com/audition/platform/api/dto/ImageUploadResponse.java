package com.audition.platform.api.dto;

import com.audition.platform.application.storage.ImageUploadResult;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * POST /api/uploads/image 응답 — {@code url}은 원본(하위 호환), {@code urls}에 파생 포함.
 */
public class ImageUploadResponse {

    /** 원본(풀 해상도) 공개 URL — 기존 폼·DB 저장용 */
    private String url;

    /** original / medium / thumb */
    private Map<String, String> urls;

    public ImageUploadResponse() {
    }

    public ImageUploadResponse(ImageUploadResult result) {
        this.url = result.originalUrl();
        this.urls = new LinkedHashMap<>();
        this.urls.put("original", result.originalUrl());
        this.urls.put("medium", result.mediumUrl());
        this.urls.put("thumb", result.thumbUrl());
    }

    public ImageUploadResponse(String url) {
        this.url = url;
        this.urls = new LinkedHashMap<>();
        this.urls.put("original", url);
        this.urls.put("medium", url);
        this.urls.put("thumb", url);
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public Map<String, String> getUrls() {
        return urls;
    }

    public void setUrls(Map<String, String> urls) {
        this.urls = urls;
    }
}
