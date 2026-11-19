package com.audition.platform.application.channel;

import com.audition.platform.application.casting.UserNotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/** 공개 영상이 새로 올라오면 그 채널 팔로워에게 앱 내 알림을 남긴다(영상당 1회, 실패해도 저장은 계속). */
@Component
public class ChannelVideoEvents {

    private static final Logger log = LoggerFactory.getLogger(ChannelVideoEvents.class);
    private final UserNotificationService notifications;
    private final JdbcTemplate jdbc;

    public ChannelVideoEvents(UserNotificationService notifications, JdbcTemplate jdbc) {
        this.notifications = notifications;
        this.jdbc = jdbc;
    }

    public void publishedNewPublicVideo(UUID ownerId, UUID videoId, String title) {
        try {
            String name = jdbc.query("SELECT COALESCE(NULLIF(trim(nickname), ''), display_name) FROM users WHERE id = ?",
                    (rs, i) -> rs.getString(1), ownerId).stream().findFirst().orElse("");
            Map<String, String> params = new LinkedHashMap<>();
            params.put("channel", name == null ? "" : name);
            params.put("title", title == null ? "" : title.length() > 80 ? title.substring(0, 80) : title);
            notifications.notifyFollowersOfVideo(ownerId, videoId, params);
        } catch (RuntimeException e) {
            log.warn("follower video notification failed video={}: {}", videoId, e.getMessage());
        }
    }
}
