package com.audition.platform.api.dto.channel;

public class ChannelSubscribeStateDto {

    private boolean subscribed;
    private long subscriberCount;

    public boolean isSubscribed() {
        return subscribed;
    }

    public void setSubscribed(boolean subscribed) {
        this.subscribed = subscribed;
    }

    public long getSubscriberCount() {
        return subscriberCount;
    }

    public void setSubscriberCount(long subscriberCount) {
        this.subscriberCount = subscriberCount;
    }
}
