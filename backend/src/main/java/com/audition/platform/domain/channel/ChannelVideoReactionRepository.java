package com.audition.platform.domain.channel;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ChannelVideoReactionRepository extends JpaRepository<ChannelVideoReaction, UUID> {

    Optional<ChannelVideoReaction> findByVideoIdAndUserId(UUID videoId, UUID userId);
}
