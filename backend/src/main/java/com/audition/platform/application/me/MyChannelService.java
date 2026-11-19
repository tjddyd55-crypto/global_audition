package com.audition.platform.application.me;

import com.audition.platform.api.dto.channel.PublicChannelListItemResponse;
import com.audition.platform.api.dto.channel.PublicChannelResponse;
import com.audition.platform.api.dto.me.*;
import com.audition.platform.application.channel.CastingOfferEligibility;
import com.audition.platform.application.channel.ChannelCareerService;
import com.audition.platform.application.channel.ChannelVideoEvents;
import com.audition.platform.application.channel.ChannelPortfolioRules;
import com.audition.platform.application.channel.PublicChannelDiscoveryService;
import com.audition.platform.application.channel.YoutubeEmbedChecker;
import com.audition.platform.application.channel.YoutubeVideoRef;
import com.audition.platform.domain.channel.Channel;
import com.audition.platform.domain.channel.ChannelRepository;
import com.audition.platform.domain.channel.ChannelSubscriptionRepository;
import com.audition.platform.domain.channel.ChannelVideo;
import com.audition.platform.domain.channel.ChannelVideoRepository;
import com.audition.platform.domain.channel.ChannelVideoVisibility;
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
import java.util.Arrays;
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
    private final ChannelSubscriptionRepository channelSubscriptionRepository;
    private final PublicChannelDiscoveryService discovery;
    private final ChannelCareerService careers;
    private final YoutubeEmbedChecker embedChecker;
    private final CastingOfferEligibility castingEligibility;
    private final ChannelVideoEvents videoEvents;

    public MyChannelService(ChannelRepository channelRepository,
                            ChannelVideoRepository channelVideoRepository,
                            UserRepository userRepository,
                            UserSnsLinkRepository userSnsLinkRepository,
                            ChannelSubscriptionRepository channelSubscriptionRepository,
                            PublicChannelDiscoveryService discovery,
                            ChannelCareerService careers,
                            YoutubeEmbedChecker embedChecker,
                            CastingOfferEligibility castingEligibility,
                            ChannelVideoEvents videoEvents) {
        this.discovery = discovery;
        this.careers = careers;
        this.embedChecker = embedChecker;
        this.castingEligibility = castingEligibility;
        this.videoEvents = videoEvents;
        this.channelRepository = channelRepository;
        this.channelVideoRepository = channelVideoRepository;
        this.userRepository = userRepository;
        this.userSnsLinkRepository = userSnsLinkRepository;
        this.channelSubscriptionRepository = channelSubscriptionRepository;
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
        r.setUserId(ownerId.toString());
        r.setChannelName(ch.getName() != null ? ch.getName() : "");
        r.setChannelDescription(ch.getDescription() != null ? ch.getDescription() : "");
        r.setProfileImageUrl(ch.getProfileImageUrl());
        r.setBannerImageUrl(ch.getBannerImageUrl());
        r.setVideoCount(videoCount);
        r.setSubscriberCount(ch.getSubscriberCount());
        r.setViewCount(viewSum);
        r.setChannelPublic(user.isChannelPublic());
        r.setNickname(user.getNickname());
        r.setName(user.getName());
        r.setIntroText(user.getIntroText());
        r.setNationality(user.getNationality());
        r.setShortBio(trimToNull(user.getShortBio()));
        r.setBio(trimToNull(user.getBio()));
        String[] catt = user.getChannelCategories();
        r.setCategories(catt != null && catt.length > 0 ? Arrays.asList(catt) : List.of());
        r.setFeaturedVideoId(user.getFeaturedVideoId() != null ? user.getFeaturedVideoId().toString() : null);
        String mergedProfile = firstNonBlankTrimmed(user.getProfileImageUrl(), ch.getProfileImageUrl());
        r.setProfileImageUrl(trimToNull(mergedProfile));
        List<UserSnsLink> links = userSnsLinkRepository.findByUserIdOrderByCreatedAtAsc(ownerId);
        r.setSnsLinks(links.stream().map(l -> {
            MeUserSnsLinkDto d = new MeUserSnsLinkDto();
            d.setPlatform(l.getPlatform());
            d.setUrl(l.getUrl());
            return d;
        }).collect(Collectors.toList()));
        r.setCareerText(trimToNull(user.getCareerText()));
        String[] activity = user.getActivityFields();
        r.setActivityFields(activity != null && activity.length > 0 ? Arrays.asList(activity) : List.of());
        String[] shown = user.getChannelShownFields();
        r.setSelectionCustomized(shown != null);
        r.setShownFields(shown == null ? List.of() : Arrays.asList(shown));
        r.setResidenceCountry(user.getResidenceCountry());
        r.setLanguages(user.getLanguages() == null ? List.of() : Arrays.asList(user.getLanguages()));
        r.setTalents(trimToNull(user.getTalents()));
        r.setTalentSearchVisible(user.isTalentSearchVisible());
        r.setCastingOffersEnabled(user.isCastingOffersEnabled());
        java.time.LocalDate today = java.time.LocalDate.now(java.time.ZoneOffset.UTC);
        r.setAgeBand(ChannelPortfolioRules.ageBand(user.getBirthDate(), today));
        r.setAdultConfirmed(ChannelPortfolioRules.confirmedAdult(user.getBirthDate(), today));
        r.setBirthDateSet(user.getBirthDate() != null);
        r.setMaxVideos(ChannelPortfolioRules.MAX_CHANNEL_VIDEOS);
        return r;
    }

    /**
     * 공개 채널 페이지. 비공개·미존재는 404(존재 여부 노출 최소화).
     */
    /**
     * 디스커버리: 채널 공개 ON 인 지원자·관리자. 비공개 채널은 포함하지 않는다.
     */
    @Transactional(readOnly = true)
    public List<PublicChannelListItemResponse> listPublicChannelsForDiscovery() {
        return listPublicChannelsForDiscovery(null, null, null);
    }

    @Transactional(readOnly = true)
    public List<PublicChannelListItemResponse> listPublicChannelsForDiscovery(String stageName, String country, String category) {
        return discovery.list(stageName, country, null, category, null, null, null);
    }

    @Transactional(readOnly = true)
    public List<PublicChannelListItemResponse> listPublicChannels(String q, String country, String field, String category,
                                                                  String sort, Integer limit, Integer offset) {
        return discovery.list(q, country, field, category, sort, limit, offset);
    }

    public PublicChannelResponse getPublicChannelByUserId(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "채널을 찾을 수 없습니다."));
        if (!user.isChannelPublic() || user.isChannelModerationHidden()
                || !"ACTIVE".equals(user.getAccountStatus() == null ? "ACTIVE" : user.getAccountStatus())) {
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
        out.setNationality(user.getNationality());
        out.setShortBio(trimToNull(user.getShortBio()));
        out.setBio(trimToNull(user.getBio()));
        String[] catArr = user.getChannelCategories();
        out.setCategories(catArr != null && catArr.length > 0 ? Arrays.asList(catArr) : List.of());
        out.setFeaturedVideoId(user.getFeaturedVideoId() != null ? user.getFeaturedVideoId().toString() : null);
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
                    ch.getId(), ChannelVideoVisibility.PUBLIC).stream().filter(v -> !v.isModerationHidden()).toList();
            MyChannelVideoDto featuredDto = pickFeaturedVideo(user, pub);
            List<MyChannelVideoDto> allDtos = pub.stream().map(this::toVideoDto).collect(Collectors.toList());
            List<MyChannelVideoDto> rest = featuredDto == null
                    ? allDtos
                    : allDtos.stream()
                    .filter(d -> !d.getVideoId().equals(featuredDto.getVideoId()))
                    .collect(Collectors.toList());
            out.setFeaturedVideo(featuredDto);
            out.setVideos(rest);
            out.setChannelId(ch.getId().toString());
            out.setChannelName(ch.getName() != null ? ch.getName() : "");
            out.setChannelDescription(ch.getDescription() != null ? ch.getDescription() : "");
            out.setProfileImageUrl(firstNonBlankTrimmed(userProfileImage, ch.getProfileImageUrl()));
            out.setBannerImageUrl(ch.getBannerImageUrl());
            out.setSubscriberCount(ch.getSubscriberCount());
            out.setVideoCount(pub.size());
            out.setViewCount(pub.stream().mapToLong(ChannelVideo::getViewCount).sum());
        }, () -> {
            out.setFeaturedVideo(null);
            out.setVideos(List.of());
            out.setProfileImageUrl(trimToNull(userProfileImage));
            out.setVideoCount(0);
            out.setViewCount(0);
            out.setSubscriberCount(0);
        });

        out.setResidenceCountry(user.getResidenceCountry());
        out.setAgeBand(ChannelPortfolioRules.ageBand(user.getBirthDate(), java.time.LocalDate.now(java.time.ZoneOffset.UTC)));
        out.setLanguages(user.getLanguages() == null ? List.of() : Arrays.asList(user.getLanguages()));
        out.setTalents(trimToNull(user.getTalents()));
        out.setCareers(careers.publicFor(userId));
        PublicChannelProfileFilter.apply(out, user);
        if (ChannelShownFields.visible(user.getChannelShownFields(), ChannelShownFields.SPECIALTIES)) {
            out.setMainField(ChannelPortfolioRules.mainField(user.getChannelCategories()));
        }
        out.setLastActiveAt(user.getLastActiveAt());
        out.setAcceptsCastingOffers(castingEligibility.receivable(user));

        UUID viewerId = SecurityUtils.getCurrentUserId();
        boolean sub = false;
        if (viewerId != null && !viewerId.equals(userId)) {
            sub = channelSubscriptionRepository.existsBySubscriberIdAndChannelOwnerId(viewerId, userId);
        }
        out.setSubscribed(sub);
        out.setCanSendCastingOffer(viewerId != null && !viewerId.equals(userId) && castingEligibility.canSendTo(viewerId, user));
        return out;
    }

    private MyChannelVideoDto pickFeaturedVideo(User user, List<ChannelVideo> pub) {
        if (pub.isEmpty()) {
            return null;
        }
        UUID fid = user.getFeaturedVideoId();
        if (fid != null) {
            for (ChannelVideo v : pub) {
                if (v.getId().equals(fid)) {
                    return toVideoDto(v);
                }
            }
        }
        return toVideoDto(pub.get(0));
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

        // 닉네임·소개·국적·분야·SNS·프로필 이미지는 프로필 API 원본이다. 채널 패치는 무시한다.
        if (req.getChannelDescription() != null) {
            ch.setDescription(req.getChannelDescription().trim());
        }
        if (req.getBannerImageUrl() != null) {
            ch.setBannerImageUrl(req.getBannerImageUrl().trim().isEmpty() ? null : req.getBannerImageUrl().trim());
        }
        Boolean pub = req.resolveChannelPublic();
        if (pub != null) {
            user.setChannelPublic(Boolean.TRUE.equals(pub));
        }
        if (req.getShownFields() != null) {
            try {
                user.setChannelShownFields(ChannelShownFields.normalize(req.getShownFields()));
            } catch (IllegalArgumentException ex) {
                throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "공개할 프로필 항목이 올바르지 않습니다.");
            }
        }
        UserChannelProfilePatchSupport.applyFeaturedVideo(user, ownerId, channelVideoRepository, req.getFeaturedVideoId());
        String residence = ChannelPortfolioRules.residence(req.getResidenceCountry());
        if (residence != null) {
            user.setResidenceCountry(residence.isEmpty() ? null : residence);
        }
        String[] langs = ChannelPortfolioRules.languages(req.getLanguages());
        if (langs != null) {
            user.setLanguages(langs);
        }
        if (req.getTalents() != null) {
            String t = req.getTalents().trim();
            user.setTalents(t.isEmpty() ? null : t.length() > ChannelPortfolioRules.TALENTS_MAX
                    ? t.substring(0, ChannelPortfolioRules.TALENTS_MAX) : t);
        }
        if (req.getTalentSearchVisible() != null) {
            user.setTalentSearchVisible(req.getTalentSearchVisible());
        }
        if (req.getCastingOffersEnabled() != null) {
            if (Boolean.TRUE.equals(req.getCastingOffersEnabled())) {
                castingEligibility.requireCanEnable(user);
            }
            user.setCastingOffersEnabled(req.getCastingOffersEnabled());
        }
        user.setLastActiveAt(Instant.now());

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
        String yt = v.getYoutubeVideoId() != null ? v.getYoutubeVideoId() : YoutubeVideoRef.idOf(v.getVideoUrl());
        dto.setYoutubeVideoId(yt);
        dto.setEmbedStatus(v.getEmbedStatus());
        dto.setShorts(YoutubeVideoRef.isShorts(v.getVideoUrl()));
        if ((dto.getThumbnailUrl() == null || dto.getThumbnailUrl().isBlank()) && yt != null) {
            dto.setThumbnailUrl(YoutubeVideoRef.thumbnailUrl(yt));
        }
        return dto;
    }

    @Transactional
    public MyChannelVideoDto createVideo(CreateMyChannelVideoRequest req) {
        UUID ownerId = requireApplicant();
        Channel ch = getOrCreateChannel(ownerId);
        String ytId = YoutubeVideoRef.idOf(req.getVideoUrl());
        if (ytId == null) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "YOUTUBE_URL_REQUIRED");
        }
        List<ChannelVideo> existing = channelVideoRepository.findByOwnerIdOrderByCreatedAtDesc(ownerId);
        if (existing.size() >= ChannelPortfolioRules.MAX_CHANNEL_VIDEOS) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "CHANNEL_VIDEO_LIMIT");
        }
        for (ChannelVideo e : existing) {
            if (ytId.equals(e.getYoutubeVideoId() != null ? e.getYoutubeVideoId() : YoutubeVideoRef.idOf(e.getVideoUrl()))) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "CHANNEL_VIDEO_DUPLICATE");
            }
        }
        ChannelVideo v = new ChannelVideo();
        v.setOwnerId(ownerId);
        v.setYoutubeVideoId(ytId);
        YoutubeEmbedChecker.Result check = embedChecker.check(ytId);
        v.setEmbedStatus(check.status());
        v.setEmbedCheckedAt(Instant.now());
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
        if (req.getCategory() != null && !req.getCategory().isBlank()) {
            v.setCategory(req.getCategory().trim());
        }
        v = channelVideoRepository.save(v);
        touch(ownerId);
        if (ChannelVideoVisibility.PUBLIC.equals(v.getVisibility())) {
            videoEvents.publishedNewPublicVideo(ownerId, v.getId(), v.getTitle());
        }
        return toVideoDto(v);
    }

    @Transactional
    public MyChannelVideoDto patchVideo(UUID videoId, PatchMyChannelVideoRequest req) {
        UUID ownerId = requireApplicant();
        ChannelVideo v = channelVideoRepository.findByIdAndOwnerId(videoId, ownerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "영상을 찾을 수 없습니다."));
        String wasVisibility = v.getVisibility();
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
            String ytId = YoutubeVideoRef.idOf(url);
            if (ytId == null) {
                throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "YOUTUBE_URL_REQUIRED");
            }
            if (!ytId.equals(v.getYoutubeVideoId())) {
                for (ChannelVideo e : channelVideoRepository.findByOwnerIdOrderByCreatedAtDesc(ownerId)) {
                    if (!e.getId().equals(v.getId()) && ytId.equals(e.getYoutubeVideoId() != null
                            ? e.getYoutubeVideoId() : YoutubeVideoRef.idOf(e.getVideoUrl()))) {
                        throw new ResponseStatusException(HttpStatus.CONFLICT, "CHANNEL_VIDEO_DUPLICATE");
                    }
                }
                v.setYoutubeVideoId(ytId);
                YoutubeEmbedChecker.Result check = embedChecker.check(ytId);
                v.setEmbedStatus(check.status());
                v.setEmbedCheckedAt(Instant.now());
            }
            v.setVideoUrl(url);
        }
        boolean becamePublic = !ChannelVideoVisibility.PUBLIC.equals(wasVisibility)
                && ChannelVideoVisibility.PUBLIC.equals(v.getVisibility());
        v.setUpdatedAt(Instant.now());
        ChannelVideo saved = channelVideoRepository.save(v);
        touch(ownerId);
        if (becamePublic) {
            videoEvents.publishedNewPublicVideo(ownerId, saved.getId(), saved.getTitle());
        }
        return toVideoDto(saved);
    }

    @Transactional
    public void deleteVideo(UUID videoId) {
        UUID ownerId = requireApplicant();
        ChannelVideo v = channelVideoRepository.findByIdAndOwnerId(videoId, ownerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "영상을 찾을 수 없습니다."));
        if (v.getId().equals(userRepository.findById(ownerId).map(User::getFeaturedVideoId).orElse(null))) {
            userRepository.findById(ownerId).ifPresent(u -> {
                u.setFeaturedVideoId(null);
                userRepository.save(u);
            });
        }
        channelVideoRepository.delete(v);
        touch(ownerId);
    }

    /** 소유자가 요청할 때만 YouTube 재생 가능 여부를 다시 확인한다(10분에 한 번). */
    @Transactional
    public MyChannelVideoDto recheckVideo(UUID videoId) {
        UUID ownerId = requireApplicant();
        ChannelVideo v = channelVideoRepository.findByIdAndOwnerId(videoId, ownerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "영상을 찾을 수 없습니다."));
        String ytId = v.getYoutubeVideoId() != null ? v.getYoutubeVideoId() : YoutubeVideoRef.idOf(v.getVideoUrl());
        if (ytId == null) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "YOUTUBE_URL_REQUIRED");
        }
        if (v.getEmbedCheckedAt() == null || v.getEmbedCheckedAt().isBefore(Instant.now().minusSeconds(600))) {
            v.setYoutubeVideoId(ytId);
            v.setEmbedStatus(embedChecker.check(ytId).status());
            v.setEmbedCheckedAt(Instant.now());
            v = channelVideoRepository.save(v);
        }
        return toVideoDto(v);
    }

    private void touch(UUID ownerId) {
        userRepository.findById(ownerId).ifPresent(u -> {
            u.setLastActiveAt(Instant.now());
            userRepository.save(u);
        });
    }
}
