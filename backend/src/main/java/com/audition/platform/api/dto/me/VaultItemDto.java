package com.audition.platform.api.dto.me;

import java.time.Instant;

public class VaultItemDto {

    private String vaultItemId;
    private String title;
    private String description;
    private String type;
    private String visibility;
    private String creationMethod;
    private Instant createdAt;

    public String getVaultItemId() {
        return vaultItemId;
    }

    public void setVaultItemId(String vaultItemId) {
        this.vaultItemId = vaultItemId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getVisibility() {
        return visibility;
    }

    public void setVisibility(String visibility) {
        this.visibility = visibility;
    }

    public String getCreationMethod() {
        return creationMethod;
    }

    public void setCreationMethod(String creationMethod) {
        this.creationMethod = creationMethod;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
