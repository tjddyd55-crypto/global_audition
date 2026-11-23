package com.audition.platform.api.dto.saves;

import java.util.List;
import java.util.UUID;

public class AuditionSaveIdsResponse {

    private List<UUID> ids;

    public AuditionSaveIdsResponse() {
    }

    public AuditionSaveIdsResponse(List<UUID> ids) {
        this.ids = ids;
    }

    public List<UUID> getIds() {
        return ids;
    }

    public void setIds(List<UUID> ids) {
        this.ids = ids;
    }
}
