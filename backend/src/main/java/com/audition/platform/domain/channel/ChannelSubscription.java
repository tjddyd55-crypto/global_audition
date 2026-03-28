package com.audition.platform.domain.channel;

import jakarta.persistence.*;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "channel_subscriptions")
public class ChannelSubscription {

    @Id
    @UuidGenerator(style = UuidGenerator.Style.RANDOM)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "subscriber_id", nullable = false)
    private UUID subscriberId;

    @Column(name = "channel_owner_id", nullable = false)
    private UUID channelOwnerId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getSubscriberId() {
        return subscriberId;
    }

    public void setSubscriberId(UUID subscriberId) {
        this.subscriberId = subscriberId;
    }

    public UUID getChannelOwnerId() {
        return channelOwnerId;
    }

    public void setChannelOwnerId(UUID channelOwnerId) {
        this.channelOwnerId = channelOwnerId;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
