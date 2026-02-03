package com.audition.platform.application.service;

import com.audition.platform.application.dto.ChannelProfileDto;
import com.audition.platform.application.dto.UpdateChannelProfileRequest;
import com.audition.platform.domain.entity.ApplicantProfile;
import com.audition.platform.domain.entity.User;
import com.audition.platform.domain.repository.ApplicantProfileRepository;
import com.audition.platform.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * 채널 서비스 (MVP_02_creator_channel)
 * 채널 공개 페이지 및 관리 기능
 */
@Service
@RequiredArgsConstructor
@Transactional
public class ChannelService {

    private final ApplicantProfileRepository applicantProfileRepository;
    private final UserRepository userRepository;
    private final UserRoleValidator userRoleValidator; // MVP_02: 권한 검증 강화

    /**
     * 채널 프로필 조회 (MVP_02: 공개 범위 정책 고정)
     * 
     * 공개 범위 정책:
     * - PUBLIC: 모든 사용자 조회 가능 (로그인 불필요)
     * - PRIVATE: 소유자 또는 ADMIN만 조회 가능
     * - UNLISTED: PUBLIC과 동일 (향후 확장 가능)
     */
    @Transactional(readOnly = true)
    public ChannelProfileDto getChannelProfile(Long userId, Long requesterId) {
        ApplicantProfile profile = applicantProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, 
                        "Applicant profile not found: " + userId));

        // 공개 범위 검증 (MVP_02: 정책 고정)
        ApplicantProfile.ChannelVisibility visibility = profile.getChannelVisibility();
        if (visibility == null) {
            visibility = ApplicantProfile.ChannelVisibility.PUBLIC; // 기본값
        }

        if (visibility == ApplicantProfile.ChannelVisibility.PRIVATE) {
            // PRIVATE: 소유자 또는 ADMIN만 조회 가능
            if (requesterId == null || (!requesterId.equals(userId) && !isAdmin(requesterId))) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "비공개 채널입니다");
            }
        }
        // PUBLIC, UNLISTED: 모든 사용자 조회 가능

        return toDto(profile);
    }

    /**
     * ADMIN 권한 확인
     */
    private boolean isAdmin(Long userId) {
        try {
            userRoleValidator.requireAdmin(userId);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * 내 채널 프로필 수정 (MVP_02: 소유자만 수정 가능)
     */
    public ChannelProfileDto updateMyChannelProfile(Long userId, UpdateChannelProfileRequest request) {
        // STEP 1: 권한 체크 - APPLICANT만 채널 수정 가능
        userRoleValidator.requireApplicant(userId);

        ApplicantProfile profile = applicantProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, 
                        "Applicant profile not found: " + userId));

        // 채널 정보 업데이트
        if (request.getStageName() != null) profile.setStageName(request.getStageName());
        if (request.getBio() != null) profile.setBio(request.getBio());
        if (request.getBannerUrl() != null) profile.setBannerUrl(request.getBannerUrl());
        if (request.getYoutubeUrl() != null) profile.setYoutubeUrl(request.getYoutubeUrl());
        if (request.getInstagramId() != null) profile.setInstagramId(request.getInstagramId());
        if (request.getFeaturedVideoId() != null) {
            // MVP_02: 대표영상 설정
            // TODO: Media Service에서 해당 비디오가 사용자 소유인지 확인 필요 (향후 확장)
            profile.setFeaturedVideoId(request.getFeaturedVideoId());
        }
        if (request.getChannelVisibility() != null) {
            profile.setChannelVisibility(request.getChannelVisibility());
        }

        ApplicantProfile saved = applicantProfileRepository.save(profile);
        return toDto(saved);
    }

    /**
     * ApplicantProfile을 ChannelProfileDto로 변환 (MVP_02: 실제 데이터 포함)
     */
    private ChannelProfileDto toDto(ApplicantProfile profile) {
        // 사용자 정보 조회 (실제 데이터)
        User user = profile.getUser();
        String userName = user != null ? user.getName() : null;

        ApplicantProfile.ChannelVisibility visibility = profile.getChannelVisibility();
        if (visibility == null) {
            visibility = ApplicantProfile.ChannelVisibility.PUBLIC;
        }

        return ChannelProfileDto.builder()
                .userId(profile.getUserId())
                .userName(userName) // MVP_02: 실제 사용자 이름
                .stageName(profile.getStageName()) // 닉네임/예명
                .bio(profile.getBio()) // 소개
                .bannerUrl(profile.getBannerUrl()) // 배너 이미지
                .youtubeUrl(profile.getYoutubeUrl()) // 유튜브 링크
                .instagramId(profile.getInstagramId()) // 인스타그램 링크
                .featuredVideoId(profile.getFeaturedVideoId()) // MVP_02: 대표영상
                .channelVisibility(visibility) // 공개 범위
                .build();
    }
}

