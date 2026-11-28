package com.audition.platform.domain.util;

import java.net.URI;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

public record BilibiliVideo(String id, int page) {
    private static final Set<String> HOSTS = Set.of("bilibili.com", "www.bilibili.com", "m.bilibili.com");
    private static final Pattern VIDEO = Pattern.compile("^/video/(BV[A-Za-z0-9]{10}|av[1-9][0-9]{0,18})/?$");
    private static final Pattern SHORT = Pattern.compile("^/[A-Za-z0-9]{1,32}/?$");
    private static final Pattern SHARED = Pattern.compile("https://[^\\s<>\\p{Z}【】（）「」《》，。；！？]+", Pattern.CASE_INSENSITIVE);

    public String url() {
        return "https://www.bilibili.com/video/" + id + (page == 1 ? "" : "?p=" + page);
    }

    public static BilibiliVideo parse(URI uri) {
        if (!https(uri) || !HOSTS.contains(host(uri))) return null;
        var path = VIDEO.matcher(uri.getRawPath());
        if (!path.matches()) return null;
        int page = 1;
        boolean present = false;
        for (String part : (uri.getRawQuery() == null ? "" : uri.getRawQuery()).split("&")) {
            if (!part.equals("p") && !part.startsWith("p=")) continue;
            if (present || !part.matches("p=[1-9][0-9]{0,5}")) return null;
            page = Integer.parseInt(part.substring(2));
            present = true;
        }
        return new BilibiliVideo(path.group(1), page);
    }

    public static URI input(String raw) {
        if (raw == null || raw.length() > 2048) return null;
        String text = raw.trim();
        URI direct = uri(text);
        if (parse(direct) != null || isShort(direct)) return direct;
        if (!text.matches("(?s).*\\s.*") || text.indexOf('<') >= 0 || text.indexOf('>') >= 0) return null;
        var matches = SHARED.matcher(text);
        URI found = null;
        while (matches.find()) {
            URI candidate = uri(matches.group().replaceFirst("[),.!]+$", ""));
            if (parse(candidate) == null && !isShort(candidate)) continue;
            if (found != null) return null;
            found = candidate;
        }
        return found;
    }

    public static boolean isShort(URI uri) {
        return https(uri) && "b23.tv".equals(host(uri)) && SHORT.matcher(uri.getRawPath()).matches();
    }

    private static boolean https(URI uri) {
        return uri != null && "https".equalsIgnoreCase(uri.getScheme()) && uri.getHost() != null
                && uri.getHost().equalsIgnoreCase(uri.getRawAuthority());
    }

    private static String host(URI uri) {
        return uri.getHost().toLowerCase(Locale.ROOT);
    }

    private static URI uri(String text) {
        try {
            return URI.create(text);
        } catch (IllegalArgumentException ignored) {
            return null;
        }
    }
}
