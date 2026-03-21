package com.audition.platform.domain.channel;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ChannelVideoRepository extends JpaRepository<ChannelVideo, UUID> {

    List<ChannelVideo> findByChannelIdOrderByCreatedAtDesc(UUID channelId);

    Optional<ChannelVideo> findFirstByOwnerIdOrderByUpdatedAtDesc(UUID ownerId);

    long countByOwnerId(UUID ownerId);

    @Query("SELECT COALESCE(SUM(v.viewCount), 0) FROM ChannelVideo v WHERE v.channelId = :channelId")
    long sumViewCountByChannelId(@Param("channelId") UUID channelId);

    Optional<ChannelVideo> findByIdAndOwnerId(UUID id, UUID ownerId);
}
