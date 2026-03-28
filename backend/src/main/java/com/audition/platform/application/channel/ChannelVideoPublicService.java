package com.audition.platform.application.channel;

import com.audition.platform.api.dto.channel.ChannelVideoCommentDto;
import com.audition.platform.api.dto.channel.ChannelVideoReactionResponse;
import com.audition.platform.api.dto.channel.PublicChannelVideoDetailDto;
import com.audition.platform.api.dto.channel.PublicChannelVideoSummaryDto;
import com.audition.platform.domain.channel.*;
import com.audition.platform.domain.user.User;
import com.audition.platform.domain.user.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class ChannelVideoPublicService {

    private static final int RECOMMEND_PAGE_SIZE = 24;

    private final ChannelVideoRepository channelVideoRepository;
    private final ChannelVideoCommentRepository channelVideoCommentRepository;
    private final ChannelVideoReactionRepository channelVideoReactionRepository;
    private final ChannelSubscriptionRepository channelSubscriptionRepository;
    private final ChannelRepository channelRepository;
    private final UserRepository userRepository;

    public ChannelVideoPublicService(ChannelVideoRepository channelVideoRepository,
                                     ChannelVideoCommentRepository channelVideoCommentRepository,
                                     ChannelVideoReactionRepository channelVideoReactionRepository,
                                     ChannelSubscriptionRepository channelSubscriptionRepository,
                                     ChannelRepository channelRepository,
                                     UserRepository userRepository) {
        this.channelVideoRepository = channelVideoRepository;
        this.channelVideoCommentRepository = channelVideoCommentRepository;
        this.channelVideoReactionRepository = channelVideoReactionRepository;
        this.channelSubscriptionRepository = channelSubscriptionRepository;
        this.channelRepository = channelRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public PublicChannelVideoDetailDto getPublicDetail(UUID videoId, UUID viewerId) {
        ChannelVideo video = loadPublicVideoOrThrow(videoId);
        return toDetailDto(video, viewerId);
    }

    @Transactional
    public void bumpView(UUID videoId) {
        ChannelVideo video = loadPublicVideoOrThrow(videoId);
        video.setViewCount(video.getViewCount() + 1);
        video.setUpdatedAt(Instant.now());
        channelVideoRepository.save(video);
    }

    @Transactional(readOnly = true)
    public List<ChannelVideoCommentDto> listComments(UUID videoId) {
        loadPublicVideoOrThrow(videoId);
        List<ChannelVideoComment> rows = channelVideoCommentRepository.findByVideoIdOrderByCreatedAtDesc(videoId);
        List<ChannelVideoCommentDto> out = new ArrayList<>();
        for (ChannelVideoComment c : rows) {
            out.add(toCommentDto(c));
        }
        return out;
    }

    @Transactional
    public ChannelVideoCommentDto postComment(UUID videoId, UUID authorId, String rawContent) {
        if (authorId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        loadPublicVideoOrThrow(videoId);
        String content = rawContent == null ? "" : rawContent.trim();
        if (content.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "댓글 내용이 필요합니다.");
        }
        if (content.length() > 4000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "댓글은 4000자 이하여야 합니다.");
        }
        ChannelVideoComment row = new ChannelVideoComment();
        row.setVideoId(videoId);
        row.setUserId(authorId);
        row.setBody(content);
        row = channelVideoCommentRepository.save(row);
        return toCommentDto(row);
    }

    @Transactional
    public ChannelVideoReactionResponse toggleLike(UUID videoId, UUID userId) {
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        ChannelVideo video = loadPublicVideoOrThrow(videoId);
        Optional<ChannelVideoReaction> opt = channelVideoReactionRepository.findByVideoIdAndUserId(videoId, userId);
        String current = opt.map(ChannelVideoReaction::getReaction).orElse(null);

        if (ChannelVideoReaction.LIKE.equals(current)) {
            opt.ifPresent(channelVideoReactionRepository::delete);
            video.setLikeCount(Math.max(0, video.getLikeCount() - 1));
            channelVideoRepository.save(video);
            return reactionResponse(video, userId);
        }
        if (ChannelVideoReaction.DISLIKE.equals(current)) {
            ChannelVideoReaction r = opt.orElseThrow();
            r.setReaction(ChannelVideoReaction.LIKE);
            r.setCreatedAt(Instant.now());
            channelVideoReactionRepository.save(r);
            video.setDislikeCount(Math.max(0, video.getDislikeCount() - 1));
            video.setLikeCount(video.getLikeCount() + 1);
            channelVideoRepository.save(video);
            return reactionResponse(video, userId);
        }
        ChannelVideoReaction created = new ChannelVideoReaction();
        created.setVideoId(videoId);
        created.setUserId(userId);
        created.setReaction(ChannelVideoReaction.LIKE);
        channelVideoReactionRepository.save(created);
        video.setLikeCount(video.getLikeCount() + 1);
        channelVideoRepository.save(video);
        return reactionResponse(video, userId);
    }

    @Transactional
    public ChannelVideoReactionResponse toggleDislike(UUID videoId, UUID userId) {
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        ChannelVideo video = loadPublicVideoOrThrow(videoId);
        Optional<ChannelVideoReaction> opt = channelVideoReactionRepository.findByVideoIdAndUserId(videoId, userId);
        String current = opt.map(ChannelVideoReaction::getReaction).orElse(null);

        if (ChannelVideoReaction.DISLIKE.equals(current)) {
            opt.ifPresent(channelVideoReactionRepository::delete);
            video.setDislikeCount(Math.max(0, video.getDislikeCount() - 1));
            channelVideoRepository.save(video);
            return reactionResponse(video, userId);
        }
        if (ChannelVideoReaction.LIKE.equals(current)) {
            ChannelVideoReaction r = opt.orElseThrow();
            r.setReaction(ChannelVideoReaction.DISLIKE);
            r.setCreatedAt(Instant.now());
            channelVideoReactionRepository.save(r);
            video.setLikeCount(Math.max(0, video.getLikeCount() - 1));
            video.setDislikeCount(video.getDislikeCount() + 1);
            channelVideoRepository.save(video);
            return reactionResponse(video, userId);
        }
        ChannelVideoReaction created = new ChannelVideoReaction();
        created.setVideoId(videoId);
        created.setUserId(userId);
        created.setReaction(ChannelVideoReaction.DISLIKE);
        channelVideoReactionRepository.save(created);
        video.setDislikeCount(video.getDislikeCount() + 1);
        channelVideoRepository.save(video);
        return reactionResponse(video, userId);
    }

    @Transactional(readOnly = true)
    public List<PublicChannelVideoSummaryDto> listPublicByCategory(String category, UUID excludeVideoId) {
        if (category == null || category.isBlank()) {
            return List.of();
        }
        if (excludeVideoId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "exclude 파라미터가 필요합니다.");
        }
        String cat = category.trim();
        List<ChannelVideo> slice = channelVideoRepository.findPublicRecommendations(
                cat,
                excludeVideoId,
                PageRequest.of(0, RECOMMEND_PAGE_SIZE));
        List<PublicChannelVideoSummaryDto> out = new ArrayList<>();
        for (ChannelVideo v : slice) {
            out.add(toSummaryDto(v));
        }
        return out;
    }

    private ChannelVideo loadPublicVideoOrThrow(UUID id) {
        ChannelVideo v = channelVideoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "영상을 찾을 수 없습니다."));
        if (!"PUBLIC".equalsIgnoreCase(v.getVisibility())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "영상을 찾을 수 없습니다.");
        }
        User owner = userRepository.findById(v.getOwnerId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "영상을 찾을 수 없습니다."));
        if (!owner.isChannelPublic()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "영상을 찾을 수 없습니다.");
        }
        if (!"APPLICANT".equals(owner.getRole()) && !"ADMIN".equals(owner.getRole())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "영상을 찾을 수 없습니다.");
        }
        return v;
    }

    private PublicChannelVideoDetailDto toDetailDto(ChannelVideo v, UUID viewerId) {
        User owner = userRepository.findById(v.getOwnerId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "영상을 찾을 수 없습니다."));
        Optional<Channel> ch = channelRepository.findByOwnerId(v.getOwnerId());
        String channelName = ch.map(Channel::getName).orElse("");
        String displayName = firstNonBlank(trimToNull(channelName), owner.getPublicDisplayLabel());
        String profileImage = firstNonBlank(
                trimToNull(owner.getProfileImageUrl()),
                ch.map(c -> trimToNull(c.getProfileImageUrl())).orElse(null));
        long subscriberCount = ch.map(Channel::getSubscriberCount).orElse(0L);
        boolean subscribed = viewerId != null
                && channelSubscriptionRepository.existsBySubscriberIdAndChannelOwnerId(viewerId, v.getOwnerId());
        boolean liked = false;
        boolean disliked = false;
        if (viewerId != null) {
            Optional<ChannelVideoReaction> rr = channelVideoReactionRepository.findByVideoIdAndUserId(v.getId(), viewerId);
            if (rr.isPresent()) {
                if (ChannelVideoReaction.LIKE.equals(rr.get().getReaction())) {
                    liked = true;
                } else if (ChannelVideoReaction.DISLIKE.equals(rr.get().getReaction())) {
                    disliked = true;
                }
            }
        }
        PublicChannelVideoDetailDto dto = new PublicChannelVideoDetailDto();
        dto.setVideoId(v.getId().toString());
        dto.setTitle(v.getTitle());
        dto.setVideoUrl(v.getVideoUrl());
        dto.setThumbnailUrl(v.getThumbnailUrl());
        dto.setDescription(v.getDescription());
        dto.setCategory(v.getCategory());
        dto.setViewCount(v.getViewCount());
        dto.setLikeCount(v.getLikeCount());
        dto.setDislikeCount(v.getDislikeCount());
        dto.setPublishedAt(v.getCreatedAt());
        dto.setChannelOwnerId(owner.getId().toString());
        dto.setChannelDisplayName(displayName != null ? displayName : "");
        dto.setChannelProfileImageUrl(profileImage);
        dto.setSubscriberCount(subscriberCount);
        dto.setSubscribed(subscribed);
        dto.setLiked(liked);
        dto.setDisliked(disliked);
        return dto;
    }

    private PublicChannelVideoSummaryDto toSummaryDto(ChannelVideo v) {
        User owner = userRepository.findById(v.getOwnerId()).orElse(null);
        Optional<Channel> ch = channelRepository.findByOwnerId(v.getOwnerId());
        String channelName = ch.map(Channel::getName).orElse("");
        String displayName = owner != null
                ? firstNonBlank(trimToNull(channelName), owner.getPublicDisplayLabel())
                : trimToNull(channelName);
        PublicChannelVideoSummaryDto dto = new PublicChannelVideoSummaryDto();
        dto.setVideoId(v.getId().toString());
        dto.setTitle(v.getTitle());
        dto.setThumbnailUrl(v.getThumbnailUrl());
        dto.setChannelDisplayName(displayName != null ? displayName : "");
        dto.setViewCount(v.getViewCount());
        dto.setPublishedAt(v.getCreatedAt());
        return dto;
    }

    private ChannelVideoCommentDto toCommentDto(ChannelVideoComment c) {
        User author = userRepository.findById(c.getUserId()).orElse(null);
        ChannelVideoCommentDto dto = new ChannelVideoCommentDto();
        dto.setId(c.getId().toString());
        dto.setContent(c.getBody());
        dto.setCreatedAt(c.getCreatedAt());
        if (author != null) {
            dto.setAuthorDisplayName(author.getPublicDisplayLabel());
            dto.setAuthorProfileImageUrl(author.getProfileImageUrl());
        } else {
            dto.setAuthorDisplayName("삭제된 사용자");
        }
        return dto;
    }

    private ChannelVideoReactionResponse reactionResponse(ChannelVideo video, UUID userId) {
        boolean liked = false;
        boolean disliked = false;
        Optional<ChannelVideoReaction> rr = channelVideoReactionRepository.findByVideoIdAndUserId(video.getId(), userId);
        if (rr.isPresent()) {
            if (ChannelVideoReaction.LIKE.equals(rr.get().getReaction())) {
                liked = true;
            } else if (ChannelVideoReaction.DISLIKE.equals(rr.get().getReaction())) {
                disliked = true;
            }
        }
        ChannelVideoReactionResponse dto = new ChannelVideoReactionResponse();
        dto.setLikeCount(video.getLikeCount());
        dto.setDislikeCount(video.getDislikeCount());
        dto.setLiked(liked);
        dto.setDisliked(disliked);
        return dto;
    }

    private static String trimToNull(String s) {
        if (s == null || s.isBlank()) {
            return null;
        }
        return s.trim();
    }

    private static String firstNonBlank(String a, String b) {
        if (a != null && !a.isBlank()) {
            return a.trim();
        }
        if (b != null && !b.isBlank()) {
            return b.trim();
        }
        return null;
    }
}
