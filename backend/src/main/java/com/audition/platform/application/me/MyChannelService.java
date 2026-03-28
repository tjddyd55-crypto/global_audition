package com.audition.platform.application.me;

import com.audition.platform.api.dto.channel.PublicChannelListItemResponse;
import com.audition.platform.api.dto.channel.PublicChannelResponse;
import com.audition.platform.api.dto.me.*;
import com.audition.platform.domain.channel.Channel;
import com.audition.platform.domain.channel.ChannelRepository;
import com.audition.platform.domain.channel.ChannelVideo;
import com.audition.platform.domain.channel.ChannelVideoRepository;
import com.audition.platform.domain.channel.ChannelVideoVisibility;
import com.audition.platform.application.user.UserNicknameService;
import com.audition.platform.application.user.UserSnsLinkReplacementService;
import com.audition.platform.domain.user.User;
import com.audition.platform.domain.user.UserRepository;
import com.audition.platform.domain.user.UserSnsLink;
import com.audition.platform.domain.user.UserSnsLinkRepository;
import com.audition.platform.infra.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class MyChannelService {

    private final ChannelRepository channelRepository;
    private final ChannelVideoRepository channelVideoRepository;
    private final UserRepository userRepository;
    private final UserSnsLinkRepository userSnsLinkRepository;
    private final UserNicknameService userNicknameService;
    private final UserSnsLinkReplacementService userSnsLinkReplacementService;

    public MyChannelService(ChannelRepository channelRepository,
                            ChannelVideoRepository channelVideoRepository,
                            UserRepository userRepository,
                            UserSnsLinkRepository userSnsLinkRepository,
                            UserNicknameService userNicknameService,
                            UserSnsLinkReplacementService userSnsLinkReplacementService) {
        this.channelRepository = channelRepository;
        this.channelVideoRepository = channelVideoRepository;
        this.userRepository = userRepository;
        this.userSnsLinkRepository = userSnsLinkRepository;
        this.userNicknameService = userNicknameService;
        this.userSnsLinkReplacementService = userSnsLinkReplacementService;
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
            String publicLabel = user.getPublicDisplayLabel();
            ch.setName(publicLabel != null && !publicLabel.isBlank() ? publicLabel : user.getUsername());
            ch.setDescription("");
            ch.setCreatedAt(Instant.now());
            ch.setUpdatedAt(Instant.now());
            return channelRepository.save(ch);
        });
    }

    public MyChannelResponse getChannel() {
        UUID ownerId = requireApplicant();
        User user = userRepository.findById(ownerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "사용자를 찾을 수 없습니다."));
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
        r.setChannelPublic(user.isChannelPublic());
        r.setNickname(user.getNickname());
        r.setIntroText(user.getIntroText());
        String mergedProfile = firstNonBlankTrimmed(user.getProfileImageUrl(), ch.getProfileImageUrl());
        r.setProfileImageUrl(trimToNull(mergedProfile));
        List<UserSnsLink> links = userSnsLinkRepository.findByUserIdOrderByCreatedAtAsc(ownerId);
        r.setSnsLinks(links.stream().map(l -> {
            MeUserSnsLinkDto d = new MeUserSnsLinkDto();
            d.setPlatform(l.getPlatform());
            d.setUrl(l.getUrl());
            return d;
        }).collect(Collectors.toList()));
        return r;
    }

    /**
     * 공개 채널 페이지. 비공개·미존재는 404(존재 여부 노출 최소화).
     */
    /**
     * 디스커버리: 채널 공개 ON + 공개 영상 1개 이상인 지원자(·관리자) 채널만.
     */
    @Transactional(readOnly = true)
    public List<PublicChannelListItemResponse> listPublicChannelsForDiscovery() {
        List<UUID> ownerIds = channelVideoRepository.findDistinctOwnerIdsForPublicChannelListing(
                ChannelVideoVisibility.PUBLIC);
        if (ownerIds.isEmpty()) {
            return List.of();
        }
        Map<UUID, User> users = userRepository.findAllById(ownerIds).stream()
                .collect(Collectors.toMap(User::getId, u -> u));
        List<PublicChannelListItemResponse> rows = new ArrayList<>();
        for (UUID ownerId : ownerIds) {
            User u = users.get(ownerId);
            if (u == null || !u.isChannelPublic()) {
                continue;
            }
            long pubCount = channelVideoRepository.countByOwnerIdAndVisibility(ownerId,
                    ChannelVideoVisibility.PUBLIC);
            if (pubCount <= 0) {
                continue;
            }
            var ch = channelRepository.findByOwnerId(ownerId);
            long sub = ch.map(Channel::getSubscriberCount).orElse(0L);
            String profile = firstNonBlankTrimmed(u.getProfileImageUrl(),
                    ch.map(Channel::getProfileImageUrl).orElse(null));
            PublicChannelListItemResponse row = new PublicChannelListItemResponse();
            row.setUserId(ownerId.toString());
            row.setNickname(u.getNickname());
            row.setProfileImage(profile);
            row.setIntroText(trimToNull(u.getIntroText()));
            row.setSubscriberCount(sub);
            row.setVideoCount(pubCount);
            rows.add(row);
        }
        rows.sort(Comparator.comparing(
                r -> {
                    User ux = users.get(UUID.fromString(r.getUserId()));
                    return ux != null ? ux.getDisplayName() : "";
                },
                String.CASE_INSENSITIVE_ORDER));
        return rows;
    }

    public PublicChannelResponse getPublicChannelByUserId(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "채널을 찾을 수 없습니다."));
        if (!user.isChannelPublic()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "채널을 찾을 수 없습니다.");
        }
        if (!"APPLICANT".equals(user.getRole()) && !"ADMIN".equals(user.getRole())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "채널을 찾을 수 없습니다.");
        }
        PublicChannelResponse out = new PublicChannelResponse();
        out.setUserId(user.getId().toString());
        out.setDisplayName(user.getPublicDisplayLabel());
        out.setName(user.getName());
        out.setNickname(user.getNickname());
        out.setIntroText(user.getIntroText());
        String userProfileImage = user.getProfileImageUrl();
        List<UserSnsLink> userSns = userSnsLinkRepository.findByUserIdOrderByCreatedAtAsc(userId);
        out.setSnsLinks(userSns.stream().map(l -> {
            MeUserSnsLinkDto d = new MeUserSnsLinkDto();
            d.setPlatform(l.getPlatform());
            d.setUrl(l.getUrl());
            return d;
        }).collect(Collectors.toList()));

        channelRepository.findByOwnerId(userId).ifPresentOrElse(ch -> {
            List<ChannelVideo> pub = channelVideoRepository.findByChannelIdAndVisibilityOrderByCreatedAtDesc(
                    ch.getId(), "PUBLIC");
            out.setVideos(pub.stream().map(this::toVideoDto).collect(Collectors.toList()));
            out.setChannelId(ch.getId().toString());
            out.setChannelName(ch.getName() != null ? ch.getName() : "");
            out.setChannelDescription(ch.getDescription() != null ? ch.getDescription() : "");
            out.setProfileImageUrl(firstNonBlankTrimmed(userProfileImage, ch.getProfileImageUrl()));
            out.setBannerImageUrl(ch.getBannerImageUrl());
            out.setSubscriberCount(ch.getSubscriberCount());
            out.setVideoCount(pub.size());
            out.setViewCount(pub.stream().mapToLong(ChannelVideo::getViewCount).sum());
        }, () -> {
            out.setVideos(List.of());
            out.setProfileImageUrl(trimToNull(userProfileImage));
            out.setVideoCount(0);
            out.setViewCount(0);
            out.setSubscriberCount(0);
        });
        return out;
    }

    private static String trimToNull(String s) {
        if (s == null || s.isBlank()) {
            return null;
        }
        return s.trim();
    }

    private static String firstNonBlankTrimmed(String a, String b) {
        String t = trimToNull(a);
        if (t != null) {
            return t;
        }
        return trimToNull(b);
    }

    @Transactional
    public MyChannelResponse patchChannel(PatchMyChannelRequest req) {
        UUID ownerId = requireApplicant();
        User user = userRepository.findById(ownerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "사용자를 찾을 수 없습니다."));
        Channel ch = getOrCreateChannel(ownerId);

        if (req.getNickname() != null) {
            String rawNick = req.getNickname().trim();
            if (rawNick.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "닉네임이 필요합니다.");
            }
            String next = userNicknameService.prepareNicknameOrThrow(rawNick, ownerId);
            user.setNickname(next);
            ch.setName(next);
        } else if (req.getChannelName() != null) {
            ch.setName(req.getChannelName().trim());
        }
        if (req.getChannelDescription() != null) {
            ch.setDescription(req.getChannelDescription().trim());
        }
        if (req.getIntroText() != null) {
            user.setIntroText(req.getIntroText().trim().isEmpty() ? null : req.getIntroText().trim());
        }
        if (req.getProfileImageUrl() != null) {
            String p = req.getProfileImageUrl().trim().isEmpty() ? null : req.getProfileImageUrl().trim();
            user.setProfileImageUrl(p);
            ch.setProfileImageUrl(p);
        }
        if (req.getBannerImageUrl() != null) {
            ch.setBannerImageUrl(req.getBannerImageUrl().trim().isEmpty() ? null : req.getBannerImageUrl().trim());
        }
        Boolean pub = req.resolveChannelPublic();
        if (pub != null) {
            user.setChannelPublic(Boolean.TRUE.equals(pub));
        }
        if (req.getSnsLinks() != null) {
            userSnsLinkReplacementService.replaceAll(ownerId, req.getSnsLinks());
        }
        ch.setUpdatedAt(Instant.now());
        user.setUpdatedAt(Instant.now());
        channelRepository.save(ch);
        userRepository.save(user);
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
        String vis = req.getVisibility();
        if (vis == null || vis.isBlank()) {
            vis = "PRIVATE";
        } else {
            vis = vis.trim().toUpperCase(Locale.ROOT);
            if (!ChannelVideoVisibility.PUBLIC.equals(vis) && !ChannelVideoVisibility.PRIVATE.equals(vis)
                    && !ChannelVideoVisibility.SUBSCRIBERS_ONLY.equals(vis)) {
                throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "visibility 값이 올바르지 않습니다.");
            }
        }
        v.setVisibility(vis);
        v.setViewCount(0);
        v.setLikeCount(0);
        v.setDislikeCount(0);
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
        if (req.getVisibility() != null && !req.getVisibility().isBlank()) {
            String vis = req.getVisibility().trim().toUpperCase(Locale.ROOT);
            if (!ChannelVideoVisibility.PUBLIC.equals(vis) && !ChannelVideoVisibility.PRIVATE.equals(vis)
                    && !ChannelVideoVisibility.SUBSCRIBERS_ONLY.equals(vis)) {
                throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "visibility 값이 올바르지 않습니다.");
            }
            v.setVisibility(vis);
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
