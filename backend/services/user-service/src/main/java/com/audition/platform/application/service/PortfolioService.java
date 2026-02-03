package com.audition.platform.application.service;

import com.audition.platform.application.dto.PortfolioDto;
import com.audition.platform.domain.entity.ApplicantProfile;
import com.audition.platform.domain.entity.User;
import com.audition.platform.domain.repository.ApplicantProfileRepository;
import com.audition.platform.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * 포트폴리오 서비스
 * 작업: 2026_18_portfolio_builder
 * 
 * 개인 채널을 포트폴리오로 자동 구성
 * - 영상/이력 자동 정리
 * - 공개 포트폴리오 링크 생성
 */
@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class PortfolioService {

    private final ApplicantProfileRepository applicantProfileRepository;
    private final UserRepository userRepository;

    /**
     * 포트폴리오 슬러그 생성/업데이트
     */
    public String generatePortfolioSlug(Long userId) {
        ApplicantProfile profile = applicantProfileRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Applicant profile not found: " + userId));

        // 이미 슬러그가 있으면 그대로 반환
        if (profile.getPortfolioSlug() != null && !profile.getPortfolioSlug().isEmpty()) {
            return profile.getPortfolioSlug();
        }

        // 새 슬러그 생성 (사용자 이름 기반 또는 UUID)
        String slug = generateUniqueSlug(profile);
        profile.setPortfolioSlug(slug);
        applicantProfileRepository.save(profile);

        log.info("포트폴리오 슬러그 생성: userId={}, slug={}", userId, slug);
        return slug;
    }

    /**
     * 고유한 슬러그 생성
     */
    private String generateUniqueSlug(ApplicantProfile profile) {
        User user = profile.getUser();
        String baseSlug = user.getName().toLowerCase()
                .replaceAll("[^a-z0-9가-힣]", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");

        // 최대 길이 제한
        if (baseSlug.length() > 50) {
            baseSlug = baseSlug.substring(0, 50);
        }

        // 고유성 확인
        String slug = baseSlug;
        int attempt = 0;
        while (applicantProfileRepository.existsByPortfolioSlug(slug)) {
            slug = baseSlug + "-" + UUID.randomUUID().toString().substring(0, 8);
            attempt++;
            if (attempt > 10) {
                // 최후의 수단: UUID만 사용
                slug = UUID.randomUUID().toString().replace("-", "").substring(0, 20);
                break;
            }
        }

        return slug;
    }

    /**
     * 포트폴리오 조회 (슬러그 기반)
     */
    @Transactional(readOnly = true)
    public PortfolioDto getPortfolioBySlug(String slug) {
        ApplicantProfile profile = applicantProfileRepository.findByPortfolioSlug(slug)
                .orElseThrow(() -> new RuntimeException("Portfolio not found: " + slug));

        // 공개 여부 확인
        if (profile.getChannelVisibility() != ApplicantProfile.ChannelVisibility.PUBLIC) {
            throw new RuntimeException("포트폴리오가 공개되지 않았습니다");
        }

        return buildPortfolioDto(profile);
    }

    /**
     * 포트폴리오 조회 (사용자 ID 기반)
     */
    @Transactional(readOnly = true)
    public PortfolioDto getPortfolioByUserId(Long userId) {
        ApplicantProfile profile = applicantProfileRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Applicant profile not found: " + userId));

        return buildPortfolioDto(profile);
    }

    /**
     * 포트폴리오 DTO 구성
     */
    private PortfolioDto buildPortfolioDto(ApplicantProfile profile) {
        User user = profile.getUser();

        return PortfolioDto.builder()
                .userId(user.getId())
                .userName(user.getName())
                .portfolioSlug(profile.getPortfolioSlug())
                .stageName(profile.getStageName())
                .bio(profile.getBio())
                .bannerUrl(profile.getBannerUrl())
                .profileImageUrl(user.getProfileImageUrl())
                .nationality(profile.getNationality())
                .gender(profile.getGender())
                .birthday(profile.getBirthday())
                .height(profile.getHeight())
                .weight(profile.getWeight())
                .youtubeUrl(profile.getYoutubeUrl())
                .instagramId(profile.getInstagramId())
                .country(profile.getCountry())
                .city(profile.getCity())
                .languages(profile.getLanguages())
                .build();
    }
}
