package com.audition.platform.presentation.controller;

import com.audition.platform.application.dto.PortfolioDto;
import com.audition.platform.application.service.PortfolioService;
import com.audition.platform.infrastructure.security.AuthHeaderUserResolver;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 포트폴리오 컨트롤러
 * 작업: 2026_18_portfolio_builder
 */
@RestController
@RequestMapping("/api/v1/portfolio")
@RequiredArgsConstructor
@Tag(name = "Portfolio", description = "포트폴리오 API")
public class PortfolioController {

    private final PortfolioService portfolioService;
    private final AuthHeaderUserResolver authHeaderUserResolver;

    @PostMapping("/generate-slug")
    @Operation(summary = "포트폴리오 슬러그 생성", description = "공개 포트폴리오 링크용 슬러그 생성")
    public ResponseEntity<PortfolioSlugDto> generateSlug(
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        Long userId = authHeaderUserResolver.getUserIdFromAuthHeaderOrThrow(authHeader);
        String slug = portfolioService.generatePortfolioSlug(userId);
        return ResponseEntity.ok(new PortfolioSlugDto(slug));
    }

    @GetMapping("/slug/{slug}")
    @Operation(summary = "포트폴리오 조회 (슬러그)", description = "공개 포트폴리오 링크로 조회")
    public ResponseEntity<PortfolioDto> getPortfolioBySlug(@PathVariable String slug) {
        PortfolioDto portfolio = portfolioService.getPortfolioBySlug(slug);
        return ResponseEntity.ok(portfolio);
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "포트폴리오 조회 (사용자 ID)", description = "사용자 ID로 포트폴리오 조회")
    public ResponseEntity<PortfolioDto> getPortfolioByUserId(@PathVariable Long userId) {
        PortfolioDto portfolio = portfolioService.getPortfolioByUserId(userId);
        return ResponseEntity.ok(portfolio);
    }

    @GetMapping("/my")
    @Operation(summary = "내 포트폴리오 조회")
    public ResponseEntity<PortfolioDto> getMyPortfolio(
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        Long userId = authHeaderUserResolver.getUserIdFromAuthHeaderOrThrow(authHeader);
        PortfolioDto portfolio = portfolioService.getPortfolioByUserId(userId);
        return ResponseEntity.ok(portfolio);
    }

    // DTO 클래스
    public static class PortfolioSlugDto {
        private String slug;

        public PortfolioSlugDto(String slug) {
            this.slug = slug;
        }

        public String getSlug() {
            return slug;
        }
    }
}
