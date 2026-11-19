package com.audition.platform.application.channel;

import com.audition.platform.domain.util.YoutubeUrls;

import java.util.regex.Pattern;

/**
 * 채널 영상은 YouTube 링크만 등록한다(watch·youtu.be·Shorts·embed·live).
 * 직접 업로드·재호스팅은 하지 않으며 썸네일은 YouTube 정적 이미지 주소 패턴을 쓴다(API 호출 없음).
 */
public final class YoutubeVideoRef {

    private static final Pattern STRICT_ID = Pattern.compile("^[A-Za-z0-9_-]{11}$");

    private YoutubeVideoRef() {
    }

    /** 유효한 11자 영상 ID 또는 null. */
    public static String idOf(String raw) {
        String id = YoutubeUrls.tryExtractYoutubeVideoId(raw);
        if (id == null) {
            return null;
        }
        id = id.trim();
        return STRICT_ID.matcher(id).matches() ? id : null;
    }

    public static String watchUrl(String id) {
        return "https://www.youtube.com/watch?v=" + id;
    }

    public static String thumbnailUrl(String id) {
        return "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg";
    }

    public static boolean isShorts(String raw) {
        return raw != null && raw.contains("/shorts/");
    }
}
