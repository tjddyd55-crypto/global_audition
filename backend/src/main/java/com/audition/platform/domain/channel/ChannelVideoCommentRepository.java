package com.audition.platform.domain.channel;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ChannelVideoCommentRepository extends JpaRepository<ChannelVideoComment, UUID> {

    List<ChannelVideoComment> findByVideoIdOrderByCreatedAtDesc(UUID videoId);
}
