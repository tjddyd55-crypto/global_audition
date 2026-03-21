package com.audition.platform.api.dto.me;

import java.util.ArrayList;
import java.util.List;

public class VaultItemsPageDto {

    private List<VaultItemDto> items = new ArrayList<>();
    private long total;

    public List<VaultItemDto> getItems() {
        return items;
    }

    public void setItems(List<VaultItemDto> items) {
        this.items = items;
    }

    public long getTotal() {
        return total;
    }

    public void setTotal(long total) {
        this.total = total;
    }
}
