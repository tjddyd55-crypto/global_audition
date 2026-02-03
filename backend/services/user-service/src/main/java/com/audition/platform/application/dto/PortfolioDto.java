package com.audition.platform.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * 포트폴리오 DTO
 * 작업: 2026_18_portfolio_builder
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PortfolioDto {
    private Long userId;
    private String userName;
    private String portfolioSlug;
    private String stageName;
    private String bio;
    private String bannerUrl;
    private String profileImageUrl;
    private String nationality;
    private String gender;
    private LocalDate birthday;
    private BigDecimal height;
    private BigDecimal weight;
    private String youtubeUrl;
    private String instagramId;
    private String country;
    private String city;
    private String languages;
    // TODO: 영상 목록, 이력 등 추가 필요 (Media Service와 연동)
}
