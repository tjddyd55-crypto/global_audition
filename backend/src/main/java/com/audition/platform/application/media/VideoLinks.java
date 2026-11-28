package com.audition.platform.application.media;

import com.audition.platform.domain.util.BilibiliVideo;
import com.audition.platform.domain.util.SocialVideoUrls;
import com.audition.platform.domain.util.YoutubeUrls;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.net.InetAddress;
import java.net.Proxy;
import java.net.URI;
import java.net.UnknownHostException;
import java.time.Duration;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.Semaphore;

public final class VideoLinks {
    private static final Semaphore SHORT_LINK_SLOTS = new Semaphore(4);
    private static final OkHttpClient SHORT_LINK_CLIENT = new OkHttpClient.Builder()
            .proxy(Proxy.NO_PROXY)
            .dns(VideoLinks::publicAddresses)
            .followRedirects(false)
            .followSslRedirects(false)
            .retryOnConnectionFailure(false)
            .connectTimeout(Duration.ofSeconds(2))
            .readTimeout(Duration.ofSeconds(2))
            .callTimeout(Duration.ofSeconds(3))
            .build();

    private VideoLinks() {}

    public static String audition(String raw) {
        return validated(raw, true);
    }

    public static String embeddable(String raw) {
        return validated(raw, false);
    }

    private static String validated(String raw, boolean allowSocial) {
        String input = raw == null ? "" : raw.trim();
        if (BilibiliVideo.input(input) != null) return bilibili(input);
        if (allowSocial ? SocialVideoUrls.isValidAuditionVideoUrl(input) : YoutubeUrls.tryExtractYoutubeVideoId(input) != null) {
            return input;
        }
        throw invalid(allowSocial ? "VIDEO_URL_UNSUPPORTED" : "EMBEDDABLE_VIDEO_URL_REQUIRED");
    }

    public static String bilibili(String input) {
        URI uri = BilibiliVideo.input(input);
        if (uri != null) {
            BilibiliVideo video = BilibiliVideo.parse(uri);
            if (video != null) return video.url();
            if (SHORT_LINK_SLOTS.tryAcquire()) {
                try {
                    video = resolve(uri, VideoLinks::redirect);
                    if (video != null) return video.url();
                } catch (IOException | IllegalArgumentException ignored) {
                    // The user can submit the original video URL when the short link is unavailable.
                } finally {
                    SHORT_LINK_SLOTS.release();
                }
            }
            throw invalid("BILIBILI_SHORT_LINK_UNAVAILABLE");
        }
        throw invalid("EMBEDDABLE_VIDEO_URL_REQUIRED");
    }

    @FunctionalInterface
    interface Redirect {
        String location(URI uri) throws IOException;
    }

    static BilibiliVideo resolve(URI uri, Redirect redirect) throws IOException {
        for (int hop = 0; hop < 3 && BilibiliVideo.isShort(uri); hop++) {
            String location = redirect.location(uri);
            if (location == null || location.length() > 2048) return null;
            uri = uri.resolve(location);
            BilibiliVideo video = BilibiliVideo.parse(uri);
            if (video != null) return video;
        }
        return null;
    }

    private static String redirect(URI uri) throws IOException {
        Request request = new Request.Builder().url(uri.toString()).get().build();
        try (var response = SHORT_LINK_CLIENT.newCall(request).execute()) {
            return switch (response.code()) {
                case 301, 302, 303, 307, 308 -> response.header("Location");
                default -> null;
            };
        }
    }

    private static List<InetAddress> publicAddresses(String host) throws UnknownHostException {
        if (!"b23.tv".equals(host)) throw new UnknownHostException();
        // OkHttp connects to these exact checked addresses over hostname-verified TLS.
        List<InetAddress> addresses = Arrays.stream(InetAddress.getAllByName(host)).filter(VideoLinks::publicIpv4).toList();
        if (addresses.isEmpty()) throw new UnknownHostException(host);
        return addresses;
    }

    static boolean publicIpv4(InetAddress address) {
        byte[] ip = address.getAddress();
        if (ip.length != 4 || address.isAnyLocalAddress() || address.isLoopbackAddress()
                || address.isLinkLocalAddress() || address.isSiteLocalAddress() || address.isMulticastAddress()) return false;
        int a = ip[0] & 255;
        int b = ip[1] & 255;
        int c = ip[2] & 255;
        return a > 0 && a < 224 && !(a == 100 && b >= 64 && b <= 127)
                && !(a == 192 && (b == 0 || (b == 88 && c == 99)))
                && !(a == 198 && (b == 18 || b == 19 || (b == 51 && c == 100)))
                && !(a == 203 && b == 0 && c == 113);
    }

    private static ResponseStatusException invalid(String code) {
        return new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, code);
    }
}
