package com.audition.platform.infra;

import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class YoutubeThumbnailUtil {

    private static final Pattern WATCH = Pattern.compile("(?:youtube\\.com/watch\\?v=|youtu\\.be/)([a-zA-Z0-9_-]{6,})");
    private static final Pattern EMBED = Pattern.compile("youtube\\.com/embed/([a-zA-Z0-9_-]{6,})");

    private YoutubeThumbnailUtil() {}

    public static Optional<String> extractVideoId(String url) {
        if (url == null || url.isBlank()) {
            return Optional.empty();
        }
        Matcher m = WATCH.matcher(url);
        if (m.find()) {
            return Optional.of(m.group(1));
        }
        m = EMBED.matcher(url);
        if (m.find()) {
            return Optional.of(m.group(1));
        }
        return Optional.empty();
    }

    /** YouTube 정적 썸네일 (외부 CDN). */
    public static Optional<String> hqThumbnail(String videoUrl) {
        return extractVideoId(videoUrl).map(id -> "https://img.youtube.com/vi/" + id + "/hqdefault.jpg");
    }
}
