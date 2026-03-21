package com.audition.platform.api.dto.me;

import java.util.ArrayList;
import java.util.List;

public class MyChannelVideosPageDto {

    private List<MyChannelVideoDto> items = new ArrayList<>();
    private long total;

    public List<MyChannelVideoDto> getItems() {
        return items;
    }

    public void setItems(List<MyChannelVideoDto> items) {
        this.items = items;
    }

    public long getTotal() {
        return total;
    }

    public void setTotal(long total) {
        this.total = total;
    }
}
