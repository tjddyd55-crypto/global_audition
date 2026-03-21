package com.audition.platform.api.dto.me;

import java.util.ArrayList;
import java.util.List;

public class MyApplicationsPageDto {

    private List<MyApplicationListItemDto> items = new ArrayList<>();
    private long total;

    public List<MyApplicationListItemDto> getItems() {
        return items;
    }

    public void setItems(List<MyApplicationListItemDto> items) {
        this.items = items;
    }

    public long getTotal() {
        return total;
    }

    public void setTotal(long total) {
        this.total = total;
    }
}
