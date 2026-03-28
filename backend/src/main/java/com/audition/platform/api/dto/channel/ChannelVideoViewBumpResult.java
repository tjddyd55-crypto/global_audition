package com.audition.platform.api.dto.channel;

public class ChannelVideoViewBumpResult {

    private boolean counted;
    private long viewCount;

    public ChannelVideoViewBumpResult() {}

    public ChannelVideoViewBumpResult(boolean counted, long viewCount) {
        this.counted = counted;
        this.viewCount = viewCount;
    }

    public boolean isCounted() {
        return counted;
    }

    public void setCounted(boolean counted) {
        this.counted = counted;
    }

    public long getViewCount() {
        return viewCount;
    }

    public void setViewCount(long viewCount) {
        this.viewCount = viewCount;
    }
}
