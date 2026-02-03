package com.audition.platform.application.dto;

import com.audition.platform.domain.entity.ApplicantProfile;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ChannelSearchItemDto {
    private Long userId;
    private String stageName;
    private String country;
    private String city;
    private String bannerUrl;
    private ApplicantProfile.ChannelVisibility channelVisibility;
}

