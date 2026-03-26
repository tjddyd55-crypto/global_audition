package com.audition.platform.api.dto;

import jakarta.validation.constraints.Size;

/**
 * 오디션 대표 이미지 — R2 업로드 API {@code urls} 와 동일 키.
 */
public class AuditionImagesDto {

    @Size(max = 2000)
    private String original;

    @Size(max = 2000)
    private String medium;

    @Size(max = 2000)
    private String thumb;

    public String getOriginal() {
        return original;
    }

    public void setOriginal(String original) {
        this.original = original;
    }

    public String getMedium() {
        return medium;
    }

    public void setMedium(String medium) {
        this.medium = medium;
    }

    public String getThumb() {
        return thumb;
    }

    public void setThumb(String thumb) {
        this.thumb = thumb;
    }
}
