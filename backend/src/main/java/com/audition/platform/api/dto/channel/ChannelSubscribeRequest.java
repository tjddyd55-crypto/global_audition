package com.audition.platform.api.dto.channel;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public class ChannelSubscribeRequest {

    @NotNull(message = "channelOwnerId 가 필요합니다.")
    private UUID channelOwnerId;

    public UUID getChannelOwnerId() {
        return channelOwnerId;
    }

    public void setChannelOwnerId(UUID channelOwnerId) {
        this.channelOwnerId = channelOwnerId;
    }
}
