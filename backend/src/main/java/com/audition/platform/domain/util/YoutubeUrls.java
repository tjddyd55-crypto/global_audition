package com.audition.platform.domain.util;

import java.net.URI;
import java.util.regex.Pattern;

/**
 * 영상은 YouTube만 허용 — 비어 있으면 통과, 값이 있으면 유효한 YouTube 링크/ID 여부 검사.
 */
public final class YoutubeUrls {

    private static final Pattern RAW_ID = Pattern.compile("^[\\w-]{11}$");

    private YoutubeUrls() {
    }

    public static boolean isBlankOrValidYoutube(String raw) {
        if (raw == null || raw.isBlank()) {
            return true;
        }
        String s = raw.trim();
        if (RAW_ID.matcher(s).matches()) {
            return true;
        }
        try {
            URI u = URI.create(s.startsWith("http") ? s : "https://" + s);
            String host = u.getHost();
            if (host == null) {
                return false;
            }
            host = host.toLowerCase();
            if (host.startsWith("www.")) {
                host = host.substring(4);
            }
            if ("youtu.be".equals(host)) {
                String path = u.getPath();
                if (path == null || path.length() < 2) {
                    return false;
                }
                String id = path.replaceFirst("^/+", "").split("/")[0];
                return id != null && id.length() >= 6;
            }
            if (host.contains("youtube.com")) {
                String q = u.getQuery();
                if (q != null) {
                    for (String part : q.split("&")) {
                        if (part.startsWith("v=")) {
                            String v = part.substring(2);
                            int amp = v.indexOf('&');
                            if (amp >= 0) {
                                v = v.substring(0, amp);
                            }
                            return v.length() >= 6;
                        }
                    }
                }
                String path = u.getPath();
                if (path != null) {
                    String[] parts = path.split("/");
                    for (int i = 0; i < parts.length; i++) {
                        if ("embed".equals(parts[i]) && i + 1 < parts.length && parts[i + 1].length() >= 6) {
                            return true;
                        }
                        if ("shorts".equals(parts[i]) && i + 1 < parts.length && parts[i + 1].length() >= 6) {
                            return true;
                        }
                    }
                }
            }
        } catch (IllegalArgumentException ignored) {
            return false;
        }
        return false;
    }
}
