package com.audition.platform.api.dto.me;

import java.time.Instant;

public class MeNotificationItemResponse {

    private String id;
    private String type;
    private String status;
    private String title;
    private String body;
    /** notifications 카탈로그 키. 있으면 화면이 ko/en/mn 으로 번역한다. */
    private String titleKey;
    private String bodyKey;
    private Instant createdAt;
    private Instant readAt;
    private String auditionId;
    private String applicationId;
    private String channel;
    /** 다단계 알림의 회차. 단일 심사 결과는 null. 저장된 타입은 바꾸지 않는다. */
    private String roundId;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getBody() {
        return body;
    }

    public void setBody(String body) {
        this.body = body;
    }

    public String getTitleKey() {
        return titleKey;
    }

    public void setTitleKey(String titleKey) {
        this.titleKey = titleKey;
    }

    public String getBodyKey() {
        return bodyKey;
    }

    public void setBodyKey(String bodyKey) {
        this.bodyKey = bodyKey;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getReadAt() {
        return readAt;
    }

    public void setReadAt(Instant readAt) {
        this.readAt = readAt;
    }

    public String getAuditionId() {
        return auditionId;
    }

    public void setAuditionId(String auditionId) {
        this.auditionId = auditionId;
    }

    public String getApplicationId() {
        return applicationId;
    }

    public void setApplicationId(String applicationId) {
        this.applicationId = applicationId;
    }

    public String getChannel() {
        return channel;
    }

    public void setChannel(String channel) {
        this.channel = channel;
    }

    public String getRoundId() {
        return roundId;
    }

    public void setRoundId(String roundId) {
        this.roundId = roundId;
    }
}
