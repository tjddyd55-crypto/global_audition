package com.audition.platform.application.me;

import com.audition.platform.domain.channel.ChannelVideo;
import com.audition.platform.domain.channel.ChannelVideoRepository;
import com.audition.platform.domain.user.User;
import com.audition.platform.domain.util.YoutubeUrls;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

/**
 * PATCH /api/me 및 PATCH /api/me/channel 에서 공유하는 채널 프로필 필드
 * (국적·shortBio·긴 bio·분야·대표 영상).
 */
public final class UserChannelProfilePatchSupport {

    private static final Set<String> ALLOWED_NATIONALITIES = Set.of("KR", "MN", "JP", "OTHER");

    private UserChannelProfilePatchSupport() {
    }

    public static void applyNationality(User user, String nationalityOrCountry) {
        if (nationalityOrCountry == null) {
            return;
        }
        String n = nationalityOrCountry.trim().toUpperCase(Locale.ROOT);
        if (n.isEmpty()) {
            user.setNationality(null);
            return;
        }
        if (!ALLOWED_NATIONALITIES.contains(n)) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "국적 값이 올바르지 않습니다.");
        }
        user.setNationality(n);
    }

    private static final int SHORT_BIO_MAX_LEN = 30;
    private static final int LONG_BIO_MAX_LEN = 8000;

    /**
     * 한줄 소개: 줄바꿈·제어문자 제거 후 공백 정리, 최대 30자. 빈 문자열이면 null.
     */
    public static void applyShortBio(User user, String shortBio) {
        if (shortBio == null) {
            return;
        }
        String normalized = shortBio.replaceAll("[\\r\\n\\u000B\\f]+", " ").trim().replaceAll("\\s+", " ");
        if (normalized.isEmpty()) {
            user.setShortBio(null);
            return;
        }
        if (normalized.length() > SHORT_BIO_MAX_LEN) {
            normalized = normalized.substring(0, SHORT_BIO_MAX_LEN);
        }
        user.setShortBio(normalized);
    }

    /** 채널 상세 소개(/정보 탭). 서버에서 길이 상한만 방어적으로 적용. */
    public static void applyChannelLongBio(User user, String bio) {
        if (bio == null) {
            return;
        }
        String t = bio.trim();
        if (t.isEmpty()) {
            user.setBio(null);
            return;
        }
        if (t.length() > LONG_BIO_MAX_LEN) {
            t = t.substring(0, LONG_BIO_MAX_LEN);
        }
        user.setBio(t);
    }

    public static void applyCategories(User user, List<String> categories) {
        if (categories == null) {
            return;
        }
        List<String> out = new ArrayList<>();
        for (String raw : categories) {
            if (raw == null) {
                continue;
            }
            String t = raw.trim();
            if (t.isEmpty()) {
                continue;
            }
            if (t.length() > 50) {
                t = t.substring(0, 50);
            }
            out.add(t);
            if (out.size() >= 3) {
                break;
            }
        }
        user.setChannelCategories(out.toArray(new String[0]));
    }

    /**
     * {@code featuredVideoIdRaw}: null 이면 변경 없음, 빈 문자열이면 해제.
     * 그 외: {@code channel_videos.id}(UUID) 또는 YouTube 전체 URL/영상 ID — 소유 영상과 매칭될 때만 설정.
     */
    public static void applyFeaturedVideo(
            User user,
            UUID ownerId,
            ChannelVideoRepository channelVideoRepository,
            String featuredVideoIdRaw) {
        if (featuredVideoIdRaw == null) {
            return;
        }
        String raw = featuredVideoIdRaw.trim();
        if (raw.isEmpty()) {
            user.setFeaturedVideoId(null);
            return;
        }
        try {
            UUID vid = UUID.fromString(raw);
            channelVideoRepository.findByIdAndOwnerId(vid, ownerId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                            "대표 영상을 찾을 수 없거나 권한이 없습니다."));
            user.setFeaturedVideoId(vid);
            return;
        } catch (IllegalArgumentException ignored) {
            // not a UUID — try YouTube URL / watch id
        }
        String ytId = YoutubeUrls.tryExtractYoutubeVideoId(raw);
        if (ytId == null) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "대표 영상 ID 형식이 올바르지 않습니다.");
        }
        String normalizedTarget = ytId.trim();
        List<ChannelVideo> mine = channelVideoRepository.findByOwnerIdOrderByCreatedAtDesc(ownerId);
        for (ChannelVideo v : mine) {
            String url = v.getVideoUrl();
            if (url == null || url.isBlank()) {
                continue;
            }
            String inUrl = YoutubeUrls.tryExtractYoutubeVideoId(url);
            if (inUrl != null && normalizedTarget.equalsIgnoreCase(inUrl.trim())) {
                user.setFeaturedVideoId(v.getId());
                return;
            }
        }
        throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                "대표 영상을 찾을 수 없거나 권한이 없습니다. 내 채널에 등록한 YouTube 영상 URL 또는 영상 ID를 입력해 주세요.");
    }
}
