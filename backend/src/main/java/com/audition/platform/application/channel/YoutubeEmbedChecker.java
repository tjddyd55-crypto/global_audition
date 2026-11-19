package com.audition.platform.application.channel;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

/**
 * 등록·주소 변경 때 한 번만 YouTube oEmbed 로 재생 가능 여부를 확인하고 결과를 저장한다.
 * 키가 필요 없는 공개 엔드포인트이며 페이지 조회마다 부르지 않는다.
 * 200 = 공개(또는 일부 공개) 재생 가능, 401/403 = 비공개·외부 재생 제한, 400/404 = 삭제·없음.
 * 일부 공개(Unlisted)는 oEmbed 로 구분되지 않아 OK 로 취급한다(링크를 받은 사람만 아는 영상을 채널에 올린 것은 본인 선택).
 */
@Component
public class YoutubeEmbedChecker {

    public static final String OK = "OK";
    public static final String NOT_FOUND = "NOT_FOUND";
    public static final String RESTRICTED = "RESTRICTED";
    public static final String UNKNOWN = "UNKNOWN";

    private static final Logger log = LoggerFactory.getLogger(YoutubeEmbedChecker.class);

    private final boolean enabled;
    private final HttpClient http;

    public YoutubeEmbedChecker(@Value("${app.youtube.oembed-check.enabled:true}") boolean enabled) {
        this.enabled = enabled;
        this.http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(3))
                .followRedirects(HttpClient.Redirect.NORMAL).build();
    }

    public record Result(String status, String title) {
    }

    public Result check(String videoId) {
        if (!enabled || videoId == null) {
            return new Result(UNKNOWN, null);
        }
        try {
            String target = URLEncoder.encode(YoutubeVideoRef.watchUrl(videoId), StandardCharsets.UTF_8);
            HttpRequest req = HttpRequest.newBuilder(URI.create("https://www.youtube.com/oembed?format=json&url=" + target))
                    .timeout(Duration.ofSeconds(4)).GET().build();
            HttpResponse<String> res = http.send(req, HttpResponse.BodyHandlers.ofString());
            return switch (res.statusCode()) {
                case 200 -> new Result(OK, titleOf(res.body()));
                case 401, 403 -> new Result(RESTRICTED, null);
                case 400, 404 -> new Result(NOT_FOUND, null);
                default -> new Result(UNKNOWN, null);
            };
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return new Result(UNKNOWN, null);
        } catch (Exception e) {
            log.debug("oEmbed check failed: {}", e.getClass().getSimpleName());
            return new Result(UNKNOWN, null);
        }
    }

    static String titleOf(String json) {
        if (json == null) {
            return null;
        }
        int i = json.indexOf("\"title\"");
        if (i < 0) {
            return null;
        }
        int q1 = json.indexOf('"', json.indexOf(':', i) + 1);
        if (q1 < 0) {
            return null;
        }
        StringBuilder sb = new StringBuilder();
        for (int k = q1 + 1; k < json.length(); k++) {
            char c = json.charAt(k);
            if (c == '\\' && k + 1 < json.length()) {
                char n = json.charAt(++k);
                if (n == 'u' && k + 4 < json.length()) {
                    sb.append((char) Integer.parseInt(json.substring(k + 1, k + 5), 16));
                    k += 4;
                } else {
                    sb.append(n == 'n' ? ' ' : n);
                }
            } else if (c == '"') {
                break;
            } else {
                sb.append(c);
            }
        }
        String t = sb.toString().trim();
        return t.isEmpty() ? null : (t.length() > 200 ? t.substring(0, 200) : t);
    }
}
