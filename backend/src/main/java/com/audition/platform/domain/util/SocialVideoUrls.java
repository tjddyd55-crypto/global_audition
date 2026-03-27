package com.audition.platform.domain.util;

import java.net.URI;

/**
 * 오디션 지원 영상 URL — YouTube, TikTok, Instagram(릴/게시물) 등 허용.
 */
public final class SocialVideoUrls {

    private SocialVideoUrls() {
    }

    public static boolean isValidAuditionVideoUrl(String raw) {
        if (raw == null || raw.isBlank()) {
            return false;
        }
        String trimmed = raw.trim();
        if (YoutubeUrls.isBlankOrValidYoutube(trimmed)) {
            return true;
        }
        String s = trimmed;
        if (!s.startsWith("http://") && !s.startsWith("https://")) {
            s = "https://" + s;
        }
        try {
            URI u = URI.create(s);
            String host = u.getHost();
            if (host == null) {
                return false;
            }
            host = host.toLowerCase();
            if (host.startsWith("www.")) {
                host = host.substring(4);
            }
            if (isTikTokHost(host)) {
                return pathHasSegment(u.getPath());
            }
            if ("instagram.com".equals(host)) {
                return isInstagramVideoPath(u.getPath());
            }
        } catch (IllegalArgumentException ignored) {
            return false;
        }
        return false;
    }

    private static boolean isTikTokHost(String host) {
        return "tiktok.com".equals(host)
                || "vm.tiktok.com".equals(host)
                || "vt.tiktok.com".equals(host)
                || host.endsWith(".tiktok.com");
    }

    private static boolean pathHasSegment(String path) {
        if (path == null || path.length() < 2) {
            return false;
        }
        String p = path.replaceFirst("^/+", "");
        return !p.isEmpty();
    }

    private static boolean isInstagramVideoPath(String path) {
        if (path == null) {
            return false;
        }
        String p = path.toLowerCase();
        return p.contains("/reel/")
                || p.contains("/reels/")
                || p.contains("/p/")
                || p.contains("/tv/");
    }
}
