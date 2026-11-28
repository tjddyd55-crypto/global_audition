package com.audition.platform.infra;

import java.util.Optional;
import com.audition.platform.domain.util.YoutubeUrls;

public final class YoutubeThumbnailUtil {

    private YoutubeThumbnailUtil() {}

    public static Optional<String> extractVideoId(String url) {
        return Optional.ofNullable(YoutubeUrls.tryExtractYoutubeVideoId(url));
    }

    /** YouTube 정적 썸네일 (외부 CDN). */
    public static Optional<String> hqThumbnail(String videoUrl) {
        return extractVideoId(videoUrl).map(id -> "https://img.youtube.com/vi/" + id + "/hqdefault.jpg");
    }
}
