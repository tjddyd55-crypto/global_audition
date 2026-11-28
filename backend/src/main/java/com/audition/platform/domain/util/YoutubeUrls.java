package com.audition.platform.domain.util;

import java.net.URI;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

public final class YoutubeUrls {
    private static final Pattern RAW_ID = Pattern.compile("[A-Za-z0-9_-]{11}");
    private static final Pattern URL_ID = Pattern.compile("[A-Za-z0-9_-]{6,}");
    private static final Set<String> HOSTS = Set.of(
            "youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com",
            "youtube-nocookie.com", "www.youtube-nocookie.com");

    private YoutubeUrls() {}

    public static String tryExtractYoutubeVideoId(String raw) {
        if (raw == null || raw.isBlank()) return null;
        String text = raw.trim();
        if (RAW_ID.matcher(text).matches()) return text;
        try {
            URI uri = URI.create(text.matches("(?i)^https?://.*") ? text : "https://" + text);
            if (uri.getHost() == null || uri.getRawUserInfo() != null || uri.getPort() != -1) return null;
            String host = uri.getHost().toLowerCase(Locale.ROOT);
            String[] path = uri.getRawPath().split("/");
            if ("youtu.be".equals(host) || "www.youtu.be".equals(host)) return path.length > 1 ? validId(path[1]) : null;
            if (!HOSTS.contains(host)) return null;
            if ("/watch".equals(uri.getRawPath()) && uri.getRawQuery() != null) {
                for (String pair : uri.getRawQuery().split("&")) {
                    if (pair.startsWith("v=")) return validId(pair.substring(2));
                }
            }
            if (path.length >= 3 && Set.of("embed", "shorts", "live", "v").contains(path[1])) return validId(path[2]);
        } catch (IllegalArgumentException ignored) {
            return null;
        }
        return null;
    }

    private static String validId(String value) {
        return URL_ID.matcher(value).matches() ? value : null;
    }

    public static boolean isBlankOrValidYoutube(String raw) {
        return raw == null || raw.isBlank() || tryExtractYoutubeVideoId(raw) != null;
    }
}
