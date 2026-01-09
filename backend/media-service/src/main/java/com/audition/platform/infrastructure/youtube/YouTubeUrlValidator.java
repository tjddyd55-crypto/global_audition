package com.audition.platform.infrastructure.youtube;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * YouTube URL 검증 및 영상 ID 추출 유틸리티
 */
public class YouTubeUrlValidator {

    private static final Pattern YOUTUBE_PATTERN = Pattern.compile(
        "(?:youtube\\.com\\/watch\\?v=|youtu\\.be\\/|youtube\\.com\\/embed\\/)([^&\\n?#]+)"
    );

    /**
     * YouTube URL이 유효한지 검증
     */
    public static boolean isValidYouTubeUrl(String url) {
        if (url == null || url.trim().isEmpty()) {
            return false;
        }
        return YOUTUBE_PATTERN.matcher(url).find();
    }

    /**
     * YouTube URL에서 영상 ID 추출
     * @param url YouTube URL
     * @return 영상 ID
     * @throws IllegalArgumentException 유효하지 않은 URL인 경우
     */
    public static String extractVideoId(String url) {
        if (url == null || url.trim().isEmpty()) {
            throw new IllegalArgumentException("URL이 비어있습니다");
        }

        Matcher matcher = YOUTUBE_PATTERN.matcher(url);
        if (matcher.find()) {
            return matcher.group(1);
        }

        throw new IllegalArgumentException("유효한 YouTube URL이 아닙니다: " + url);
    }

    /**
     * YouTube 영상 ID로 썸네일 URL 생성
     */
    public static String generateThumbnailUrl(String videoId) {
        return "https://img.youtube.com/vi/" + videoId + "/maxresdefault.jpg";
    }

    /**
     * YouTube 영상 ID로 임베드 URL 생성
     */
    public static String generateEmbedUrl(String videoId) {
        return "https://www.youtube.com/embed/" + videoId;
    }
}
