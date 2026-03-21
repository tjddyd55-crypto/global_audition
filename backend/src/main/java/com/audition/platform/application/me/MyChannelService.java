package com.audition.platform.application.me;

import com.audition.platform.api.dto.me.*;
import com.audition.platform.domain.channel.Channel;
import com.audition.platform.domain.channel.ChannelRepository;
import com.audition.platform.domain.channel.ChannelVideo;
import com.audition.platform.domain.channel.ChannelVideoRepository;
import com.audition.platform.domain.user.User;
import com.audition.platform.domain.user.UserRepository;
import com.audition.platform.infra.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class MyChannelService {

    private final ChannelRepository channelRepository;
    private final ChannelVideoRepository channelVideoRepository;
    private final UserRepository userRepository;

    public MyChannelService(ChannelRepository channelRepository,
                            ChannelVideoRepository channelVideoRepository,
                            UserRepository userRepository) {
        this.channelRepository = channelRepository;
        this.channelVideoRepository = channelVideoRepository;
        this.userRepository = userRepository;
    }

    private UUID requireApplicant() {
        UUID userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        if (!SecurityUtils.hasRole("APPLICANT") && !SecurityUtils.hasRole("ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "지원자 채널만 이용할 수 있습니다.");
        }
        return userId;
    }

    @Transactional
    public Channel getOrCreateChannel(UUID ownerId) {
        return channelRepository.findByOwnerId(ownerId).orElseGet(() -> {
            User user = userRepository.findById(ownerId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "사용자를 찾을 수 없습니다."));
            Channel ch = new Channel();
            ch.setOwnerId(ownerId);
            ch.setName(user.getDisplayName() != null ? user.getDisplayName() : user.getUsername());
            ch.setDescription("");
            ch.setCreatedAt(Instant.now());
            ch.setUpdatedAt(Instant.now());
            return channelRepository.save(ch);
        });
    }

    public MyChannelResponse getChannel() {
        UUID ownerId = requireApplicant();
        Channel ch = getOrCreateChannel(ownerId);
        long videoCount = channelVideoRepository.findByChannelIdOrderByCreatedAtDesc(ch.getId()).size();
        long viewSum = channelVideoRepository.sumViewCountByChannelId(ch.getId());
        MyChannelResponse r = new MyChannelResponse();
        r.setChannelId(ch.getId().toString());
        r.setChannelName(ch.getName() != null ? ch.getName() : "");
        r.setChannelDescription(ch.getDescription() != null ? ch.getDescription() : "");
        r.setProfileImageUrl(ch.getProfileImageUrl());
        r.setBannerImageUrl(ch.getBannerImageUrl());
        r.setVideoCount(videoCount);
        r.setSubscriberCount(ch.getSubscriberCount());
        r.setViewCount(viewSum);
        return r;
    }

    @Transactional
    public MyChannelResponse patchChannel(PatchMyChannelRequest req) {
        UUID ownerId = requireApplicant();
        Channel ch = getOrCreateChannel(ownerId);
        if (req.getChannelName() != null) {
            ch.setName(req.getChannelName().trim());
        }
        if (req.getChannelDescription() != null) {
            ch.setDescription(req.getChannelDescription().trim());
        }
        if (req.getProfileImageUrl() != null) {
            ch.setProfileImageUrl(req.getProfileImageUrl().trim().isEmpty() ? null : req.getProfileImageUrl().trim());
        }
        if (req.getBannerImageUrl() != null) {
            ch.setBannerImageUrl(req.getBannerImageUrl().trim().isEmpty() ? null : req.getBannerImageUrl().trim());
        }
        ch.setUpdatedAt(Instant.now());
        channelRepository.save(ch);
        return getChannel();
    }

    public MyChannelVideosPageDto listVideos() {
        UUID ownerId = requireApplicant();
        Channel ch = getOrCreateChannel(ownerId);
        List<ChannelVideo> list = channelVideoRepository.findByChannelIdOrderByCreatedAtDesc(ch.getId());
        MyChannelVideosPageDto page = new MyChannelVideosPageDto();
        page.setItems(list.stream().map(this::toVideoDto).collect(Collectors.toList()));
        page.setTotal(list.size());
        return page;
    }

    private MyChannelVideoDto toVideoDto(ChannelVideo v) {
        MyChannelVideoDto dto = new MyChannelVideoDto();
        dto.setVideoId(v.getId().toString());
        dto.setTitle(v.getTitle());
        dto.setVideoUrl(v.getVideoUrl());
        dto.setDescription(v.getDescription());
        dto.setCategory(v.getCategory());
        dto.setThumbnailUrl(v.getThumbnailUrl());
        dto.setVisibility(v.getVisibility());
        dto.setViewCount(v.getViewCount());
        dto.setLikeCount(v.getLikeCount());
        dto.setCreatedAt(v.getCreatedAt());
        return dto;
    }

    @Transactional
    public MyChannelVideoDto createVideo(CreateMyChannelVideoRequest req) {
        UUID ownerId = requireApplicant();
        Channel ch = getOrCreateChannel(ownerId);
        ChannelVideo v = new ChannelVideo();
        v.setOwnerId(ownerId);
        v.setChannelId(ch.getId());
        v.setTitle(req.getTitle().trim());
        v.setDescription(req.getDescription() != null ? req.getDescription().trim() : null);
        v.setCategory(req.getCategory() != null ? req.getCategory().trim() : null);
        v.setVideoUrl(req.getVideoUrl().trim());
        v.setVisibility(req.getVisibility());
        v.setViewCount(0);
        v.setLikeCount(0);
        v.setCreatedAt(Instant.now());
        v.setUpdatedAt(Instant.now());
        v = channelVideoRepository.save(v);
        return toVideoDto(v);
    }

    @Transactional
    public MyChannelVideoDto patchVideo(UUID videoId, PatchMyChannelVideoRequest req) {
        UUID ownerId = requireApplicant();
        ChannelVideo v = channelVideoRepository.findByIdAndOwnerId(videoId, ownerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "영상을 찾을 수 없습니다."));
        if (req.getTitle() != null) {
            v.setTitle(req.getTitle().trim());
        }
        if (req.getDescription() != null) {
            v.setDescription(req.getDescription().trim().isEmpty() ? null : req.getDescription().trim());
        }
        if (req.getCategory() != null) {
            v.setCategory(req.getCategory().trim().isEmpty() ? null : req.getCategory().trim());
        }
        if (req.getThumbnailUrl() != null) {
            v.setThumbnailUrl(req.getThumbnailUrl().trim().isEmpty() ? null : req.getThumbnailUrl().trim());
        }
        if (req.getVisibility() != null) {
            v.setVisibility(req.getVisibility());
        }
        if (req.getVideoUrl() != null && !req.getVideoUrl().isBlank()) {
            String url = req.getVideoUrl().trim();
            if (!url.startsWith("http://") && !url.startsWith("https://")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "videoUrl must be a valid URL");
            }
            v.setVideoUrl(url);
        }
        v.setUpdatedAt(Instant.now());
        return toVideoDto(channelVideoRepository.save(v));
    }

    @Transactional
    public void deleteVideo(UUID videoId) {
        UUID ownerId = requireApplicant();
        ChannelVideo v = channelVideoRepository.findByIdAndOwnerId(videoId, ownerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "영상을 찾을 수 없습니다."));
        channelVideoRepository.delete(v);
    }
}
