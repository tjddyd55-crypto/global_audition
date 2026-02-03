package com.audition.platform.application.dto;

import com.audition.platform.domain.entity.ApplicantProfile;
import lombok.Builder;
import lombok.Data;

/**
 * 채널 프로필 DTO (MVP_02_creator_channel)
 * 채널 공개 페이지에 표시되는 실제 데이터
 */
@Data
@Builder
public class ChannelProfileDto {
    private Long userId;
    private String userName; // 사용자 이름 (실제 데이터)
    private String stageName; // 닉네임/예명
    private String bio; // 소개
    private String bannerUrl; // 배너 이미지
    private String youtubeUrl; // 유튜브 링크
    private String instagramId; // 인스타그램 링크
    private Long featuredVideoId; // 대표영상 ID (MVP_02)
    private ApplicantProfile.ChannelVisibility channelVisibility; // 공개 범위
}

