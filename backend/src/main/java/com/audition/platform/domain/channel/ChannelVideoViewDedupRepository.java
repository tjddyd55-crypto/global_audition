package com.audition.platform.domain.channel;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ChannelVideoViewDedupRepository extends JpaRepository<ChannelVideoViewDedup, UUID> {

    Optional<ChannelVideoViewDedup> findByVideoIdAndUserId(UUID videoId, UUID userId);

    Optional<ChannelVideoViewDedup> findByVideoIdAndIpHash(UUID videoId, String ipHash);
}
