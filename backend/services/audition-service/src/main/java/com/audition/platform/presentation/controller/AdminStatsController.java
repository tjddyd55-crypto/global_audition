package com.audition.platform.presentation.controller;

import com.audition.platform.application.dto.AdminKpiStatsDto;
import com.audition.platform.application.service.AdminStatsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auditions/admin")
@RequiredArgsConstructor
@Tag(name = "Admin Stats", description = "관리자 KPI 통계 API")
public class AdminStatsController {

    private final AdminStatsService adminStatsService;

    @GetMapping("/stats")
    @Operation(summary = "운영 KPI 통계 조회", description = "관리자 전용")
    public ResponseEntity<AdminKpiStatsDto> getStats() {
        AdminKpiStatsDto stats = adminStatsService.getKpiStats();
        return ResponseEntity.ok(stats);
    }
}

