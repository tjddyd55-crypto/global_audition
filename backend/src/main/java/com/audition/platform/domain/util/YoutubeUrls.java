package com.audition.platform.domain.util;

import java.net.URI;
import java.util.regex.Pattern;

/**
 * 영상은 YouTube만 허용 — 비어 있으면 통과, 값이 있으면 유효한 YouTube 링크/ID 여부 검사.
 */
public final class YoutubeUrls {

    private static final Pattern RAW_ID = Pattern.compile("^[\\w-]{11}$");
    private static final Pattern WATCH_V = Pattern.compile(
            "(?:youtube\\.com/watch\\?v=|youtu\\.be/)([^&\\n?#]+)");

    private YoutubeUrls() {
    }

    /**
     * watch?v= / youtu.be 경로에서 ID 추출.
     */
    public static String extractFromWatchOrShortUrl(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        var m = WATCH_V.matcher(raw.trim());
        if (m.find()) {
            String id = m.group(1);
            return id != null && !id.isBlank() ? id : null;
        }
        return null;
    }

    /**
     * YouTube 공유 URL·shorts·embed·11자 raw id 에서 영상 ID 추출. 실패 시 {@code null}.
     */
    public static String tryExtractYoutubeVideoId(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String s = raw.trim();
        if (RAW_ID.matcher(s).matches()) {
            return s;
        }
        String fromWatch = extractFromWatchOrShortUrl(s);
        if (fromWatch != null && fromWatch.length() >= 6) {
            return fromWatch;
        }
        try {
            URI u = URI.create(s.startsWith("http") ? s : "https://" + s);
            String host = u.getHost();
            if (host == null) {
                return null;
            }
            host = host.toLowerCase();
            if (host.startsWith("www.")) {
                host = host.substring(4);
            }
            if ("youtu.be".equals(host)) {
                String path = u.getPath();
                if (path == null || path.length() < 2) {
                    return null;
                }
                String id = path.replaceFirst("^/+", "").split("/")[0];
                return id != null && id.length() >= 6 ? id : null;
            }
            if (host.contains("youtube.com") || host.contains("youtube-nocookie.com")) {
                String q = u.getQuery();
                if (q != null) {
                    for (String part : q.split("&")) {
                        if (part.startsWith("v=")) {
                            String v = part.substring(2);
                            int amp = v.indexOf('&');
                            if (amp >= 0) {
                                v = v.substring(0, amp);
                            }
                            return v.length() >= 6 ? v : null;
                        }
                    }
                }
                String path = u.getPath();
                if (path != null) {
                    String[] parts = path.split("/");
                    for (int i = 0; i < parts.length; i++) {
                        if ("embed".equals(parts[i]) && i + 1 < parts.length && parts[i + 1].length() >= 6) {
                            return parts[i + 1];
                        }
                        if ("shorts".equals(parts[i]) && i + 1 < parts.length && parts[i + 1].length() >= 6) {
                            return parts[i + 1];
                        }
                        if ("live".equals(parts[i]) && i + 1 < parts.length && parts[i + 1].length() >= 6) {
                            return parts[i + 1];
                        }
                    }
                }
            }
        } catch (IllegalArgumentException ignored) {
            return null;
        }
        return extractFromWatchOrShortUrl(s);
    }

    public static boolean isBlankOrValidYoutube(String raw) {
        if (raw == null || raw.isBlank()) {
            return true;
        }
        return tryExtractYoutubeVideoId(raw) != null;
    }
}
