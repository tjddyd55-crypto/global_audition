package com.audition.platform.domain.channel;

import jakarta.persistence.*;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "channel_video_view_dedup")
public class ChannelVideoViewDedup {

    @Id
    @UuidGenerator(style = UuidGenerator.Style.RANDOM)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "video_id", nullable = false)
    private UUID videoId;

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "ip_hash", length = 64)
    private String ipHash;

    @Column(name = "last_counted_at", nullable = false)
    private Instant lastCountedAt = Instant.now();

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getVideoId() {
        return videoId;
    }

    public void setVideoId(UUID videoId) {
        this.videoId = videoId;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getIpHash() {
        return ipHash;
    }

    public void setIpHash(String ipHash) {
        this.ipHash = ipHash;
    }

    public Instant getLastCountedAt() {
        return lastCountedAt;
    }

    public void setLastCountedAt(Instant lastCountedAt) {
        this.lastCountedAt = lastCountedAt;
    }
}
