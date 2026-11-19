package com.audition.platform.application.channel;

import org.springframework.stereotype.Component;

import java.util.UUID;

/** 공개 영상이 새로 올라왔을 때 구독자 알림을 남긴다(알림 연동은 UserNotificationService). */
@Component
public class ChannelVideoEvents {

    public void publishedNewPublicVideo(UUID ownerId, UUID videoId, String title) {
        // 알림 연동 전에는 아무 것도 하지 않는다.
    }
}
