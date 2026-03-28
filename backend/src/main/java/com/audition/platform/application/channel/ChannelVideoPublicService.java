package com.audition.platform.application.channel;

import com.audition.platform.api.dto.channel.ChannelVideoCommentDto;
import com.audition.platform.api.dto.channel.ChannelVideoReactionResponse;
import com.audition.platform.api.dto.channel.ChannelVideoViewBumpResult;
import com.audition.platform.api.dto.channel.PublicChannelVideoDetailDto;
import com.audition.platform.api.dto.channel.PublicChannelVideoSummaryDto;
import com.audition.platform.api.dto.me.MyChannelVideoDto;
import com.audition.platform.domain.channel.*;
import com.audition.platform.domain.user.User;
import com.audition.platform.domain.user.UserRepository;
import com.audition.platform.infra.IpAddressHash;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

@Service
public class ChannelVideoPublicService {

    private static final int BROWSE_PAGE_SIZE = 60;
    private static final int RECOMMEND_PAGE_SIZE = 24;
    /** 동일 시청자(회원 또는 IP) 기준 조회수 중복 증가 방지 간격 */
    private static final Duration VIEW_COUNT_COOLDOWN = Duration.ofHours(24);

    private final ChannelVideoRepository channelVideoRepository;
    private final ChannelVideoCommentRepository channelVideoCommentRepository;
    private final ChannelVideoReactionRepository channelVideoReactionRepository;
    private final ChannelSubscriptionRepository channelSubscriptionRepository;
    private final ChannelVideoViewDedupRepository channelVideoViewDedupRepository;
    private final ChannelRepository channelRepository;
    private final UserRepository userRepository;

    public ChannelVideoPublicService(ChannelVideoRepository channelVideoRepository,
                                     ChannelVideoCommentRepository channelVideoCommentRepository,
                                     ChannelVideoReactionRepository channelVideoReactionRepository,
                                     ChannelSubscriptionRepository channelSubscriptionRepository,
                                     ChannelVideoViewDedupRepository channelVideoViewDedupRepository,
                                     ChannelRepository channelRepository,
                                     UserRepository userRepository) {
        this.channelVideoRepository = channelVideoRepository;
        this.channelVideoCommentRepository = channelVideoCommentRepository;
        this.channelVideoReactionRepository = channelVideoReactionRepository;
        this.channelSubscriptionRepository = channelSubscriptionRepository;
        this.channelVideoViewDedupRepository = channelVideoViewDedupRepository;
        this.channelRepository = channelRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public PublicChannelVideoDetailDto getPublicDetail(UUID videoId, UUID viewerId) {
        ChannelVideo video = loadPlayableVideoOrThrow(videoId, viewerId);
        return toDetailDto(video, viewerId);
    }

    /**
     * 조회수 반영. 로그인 시 (videoId,userId), 비로그인 시 (videoId,ip 해시)당
     * {@link #VIEW_COUNT_COOLDOWN} 내 재요청은 카운트하지 않는다.
     */
    @Transactional
    public ChannelVideoViewBumpResult bumpView(UUID videoId, UUID viewerUserId, String clientIpRaw) {
        ChannelVideo video = loadPlayableVideoOrThrow(videoId, viewerUserId);
        Instant now = Instant.now();
        Instant cooldownEnd = now.minus(VIEW_COUNT_COOLDOWN);

        if (viewerUserId != null) {
            Optional<ChannelVideoViewDedup> existing = channelVideoViewDedupRepository
                    .findByVideoIdAndUserId(videoId, viewerUserId);
            if (existing.isPresent() && !existing.get().getLastCountedAt().isBefore(cooldownEnd)) {
                return new ChannelVideoViewBumpResult(false, video.getViewCount());
            }
            video.setViewCount(video.getViewCount() + 1);
            video.setUpdatedAt(now);
            channelVideoRepository.save(video);
            ChannelVideoViewDedup row = existing.orElseGet(ChannelVideoViewDedup::new);
            row.setVideoId(videoId);
            row.setUserId(viewerUserId);
            row.setIpHash(null);
            row.setLastCountedAt(now);
            channelVideoViewDedupRepository.save(row);
            return new ChannelVideoViewBumpResult(true, video.getViewCount());
        }

        String ipHash = IpAddressHash.sha256Hex(clientIpRaw);
        Optional<ChannelVideoViewDedup> existing = channelVideoViewDedupRepository
                .findByVideoIdAndIpHash(videoId, ipHash);
        if (existing.isPresent() && !existing.get().getLastCountedAt().isBefore(cooldownEnd)) {
            return new ChannelVideoViewBumpResult(false, video.getViewCount());
        }
        video.setViewCount(video.getViewCount() + 1);
        video.setUpdatedAt(now);
        channelVideoRepository.save(video);
        ChannelVideoViewDedup row = existing.orElseGet(ChannelVideoViewDedup::new);
        row.setVideoId(videoId);
        row.setUserId(null);
        row.setIpHash(ipHash);
        row.setLastCountedAt(now);
        channelVideoViewDedupRepository.save(row);
        return new ChannelVideoViewBumpResult(true, video.getViewCount());
    }

    @Transactional(readOnly = true)
    public List<ChannelVideoCommentDto> listComments(UUID videoId, UUID viewerId) {
        loadPlayableVideoOrThrow(videoId, viewerId);
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
        loadPlayableVideoOrThrow(videoId, authorId);
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
        loadPlayableVideoOrThrow(videoId, userId);
        ChannelVideo video = channelVideoRepository.lockByIdForUpdate(videoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "영상을 찾을 수 없습니다."));
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
        loadPlayableVideoOrThrow(videoId, userId);
        ChannelVideo video = channelVideoRepository.lockByIdForUpdate(videoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "영상을 찾을 수 없습니다."));
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

    /**
     * 공개 채널 페이지용: {@code owner_id = channelOwnerId} 이고 {@code visibility = PUBLIC} 인 영상만, {@code created_at DESC}.
     * 비공개·부적격 채널은 404 ({@code GET /api/channels/{userId}} 와 동일 정책).
     */
    @Transactional(readOnly = true)
    public List<MyChannelVideoDto> listPublicVideosForChannelOwner(UUID channelOwnerId) {
        User user = userRepository.findById(channelOwnerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "채널을 찾을 수 없습니다."));
        if (!user.isChannelPublic()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "채널을 찾을 수 없습니다.");
        }
        if (!"APPLICANT".equals(user.getRole()) && !"ADMIN".equals(user.getRole())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "채널을 찾을 수 없습니다.");
        }
        List<ChannelVideo> list = channelVideoRepository.findByOwnerIdAndVisibilityOrderByCreatedAtDesc(
                channelOwnerId, ChannelVideoVisibility.PUBLIC);
        List<MyChannelVideoDto> out = new ArrayList<>();
        for (ChannelVideo v : list) {
            out.add(toMyChannelListDto(v));
        }
        return out;
    }

    private MyChannelVideoDto toMyChannelListDto(ChannelVideo v) {
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

    @Transactional(readOnly = true)
    public List<PublicChannelVideoSummaryDto> listPublicBrowseVideos(String category) {
        String normalizedCategory = category == null ? null : category.trim();
        List<ChannelVideo> slice = channelVideoRepository.findPublicBrowseVideos(
                normalizedCategory == null || normalizedCategory.isBlank() ? null : normalizedCategory,
                PageRequest.of(0, BROWSE_PAGE_SIZE));
        List<PublicChannelVideoSummaryDto> out = new ArrayList<>();
        for (ChannelVideo v : slice) {
            out.add(toSummaryDto(v));
        }
        return out;
    }

    /**
     * 공개 API에서 시청·상세 가능한 영상만 통과.
     * {@link ChannelVideoVisibility#SUBSCRIBERS_ONLY} 는 구독자 또는 소유자만 허용.
     */
    private ChannelVideo loadPlayableVideoOrThrow(UUID videoId, UUID viewerId) {
        ChannelVideo v = channelVideoRepository.findById(videoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "영상을 찾을 수 없습니다."));
        User owner = userRepository.findById(v.getOwnerId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "영상을 찾을 수 없습니다."));
        if (!"APPLICANT".equals(owner.getRole()) && !"ADMIN".equals(owner.getRole())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "영상을 찾을 수 없습니다.");
        }
        if (!owner.isChannelPublic()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "영상을 찾을 수 없습니다.");
        }
        String vis = v.getVisibility() == null ? "" : v.getVisibility().trim().toUpperCase(Locale.ROOT);
        if (ChannelVideoVisibility.PRIVATE.equals(vis)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "영상을 찾을 수 없습니다.");
        }
        if (ChannelVideoVisibility.PUBLIC.equals(vis)) {
            return v;
        }
        if (ChannelVideoVisibility.SUBSCRIBERS_ONLY.equals(vis)) {
            if (viewerId == null) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "영상을 찾을 수 없습니다.");
            }
            if (viewerId.equals(v.getOwnerId())) {
                return v;
            }
            if (channelSubscriptionRepository.existsBySubscriberIdAndChannelOwnerId(viewerId, v.getOwnerId())) {
                return v;
            }
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "영상을 찾을 수 없습니다.");
        }
        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "영상을 찾을 수 없습니다.");
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
        String profileImageUrl = firstNonBlank(
                owner != null ? trimToNull(owner.getProfileImageUrl()) : null,
                ch.map(c -> trimToNull(c.getProfileImageUrl())).orElse(null));
        PublicChannelVideoSummaryDto dto = new PublicChannelVideoSummaryDto();
        dto.setVideoId(v.getId().toString());
        dto.setTitle(v.getTitle());
        dto.setVideoUrl(v.getVideoUrl());
        dto.setThumbnailUrl(v.getThumbnailUrl());
        dto.setCategory(v.getCategory());
        dto.setChannelDisplayName(displayName != null ? displayName : "");
        dto.setChannelProfileImageUrl(profileImageUrl);
        dto.setViewCount(v.getViewCount());
        dto.setLikeCount(v.getLikeCount());
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
