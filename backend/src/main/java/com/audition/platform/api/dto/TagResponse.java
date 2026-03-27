package com.audition.platform.api.dto;

public class TagResponse {

    private String id;
    private String name;
    private String type;
    private boolean active;

    public TagResponse() {
    }

    public TagResponse(String id, String name, String type, boolean active) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.active = active;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
