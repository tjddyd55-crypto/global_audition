package com.audition.platform.api.dto;

/**
 * 오디션에 붙은 태그 한 건: catalog면 {@code tagId} 설정, 직입력이면 {@code tagId} null.
 */
public class AuditionTagRefDto {

    private String tagId;
    private String name;

    public AuditionTagRefDto() {
    }

    public AuditionTagRefDto(String tagId, String name) {
        this.tagId = tagId;
        this.name = name;
    }

    public String getTagId() {
        return tagId;
    }

    public void setTagId(String tagId) {
        this.tagId = tagId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
