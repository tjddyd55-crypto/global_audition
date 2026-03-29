package com.audition.platform.application.me;

import com.audition.platform.domain.channel.ChannelVideoRepository;
import com.audition.platform.domain.user.User;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

/**
 * PATCH /api/me 및 PATCH /api/me/channel 에서 공유하는 채널 프로필 필드(국적·한줄 소개·분야·대표 영상).
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

    public static void applyBioChannelTagline(User user, String bio) {
        if (bio == null) {
            return;
        }
        user.setBio(bio.trim().isEmpty() ? null : bio.trim());
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
     * {@code featuredVideoIdRaw}: null 이면 변경 없음, 빈 문자열이면 해제, UUID 문자열이면 해당 영상(소유자 일치)으로 설정.
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
        UUID vid;
        try {
            vid = UUID.fromString(raw);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "대표 영상 ID 형식이 올바르지 않습니다.");
        }
        channelVideoRepository.findByIdAndOwnerId(vid, ownerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                        "대표 영상을 찾을 수 없거나 권한이 없습니다."));
        user.setFeaturedVideoId(vid);
    }
}
