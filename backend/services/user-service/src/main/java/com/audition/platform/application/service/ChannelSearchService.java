package com.audition.platform.application.service;

import com.audition.platform.application.dto.ChannelSearchItemDto;
import com.audition.platform.domain.entity.ApplicantProfile;
import com.audition.platform.domain.repository.ApplicantProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChannelSearchService {

    private final ApplicantProfileRepository applicantProfileRepository;

    public Page<ChannelSearchItemDto> searchPublicChannels(String country, String keyword, Pageable pageable) {
        return applicantProfileRepository.searchPublicProfiles(
                        ApplicantProfile.ChannelVisibility.PUBLIC,
                        normalizeBlank(country),
                        normalizeBlank(keyword),
                        pageable
                )
                .map(this::toDto);
    }

    private String normalizeBlank(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private ChannelSearchItemDto toDto(ApplicantProfile profile) {
        ApplicantProfile.ChannelVisibility visibility = profile.getChannelVisibility();
        if (visibility == null) {
            visibility = ApplicantProfile.ChannelVisibility.PUBLIC;
        }
        return ChannelSearchItemDto.builder()
                .userId(profile.getUserId())
                .stageName(profile.getStageName())
                .country(profile.getCountry())
                .city(profile.getCity())
                .bannerUrl(profile.getBannerUrl())
                .channelVisibility(visibility)
                .build();
    }
}

