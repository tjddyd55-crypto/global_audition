package com.audition.platform.api.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class TagPatchRequest {

    @Size(max = 80)
    private String name;

    @Pattern(regexp = "SYSTEM|USER")
    private String type;

    private Boolean active;

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

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }
}
