package com.audition.platform.api.dto;

public class CategoryCountDto {

    private String name;
    private long count;

    public CategoryCountDto() {
    }

    public CategoryCountDto(String name, long count) {
        this.name = name;
        this.count = count;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public long getCount() {
        return count;
    }

    public void setCount(long count) {
        this.count = count;
    }
}
