package com.audition.platform.presentation.controller;

import com.audition.platform.application.dto.AuditionDto;
import com.audition.platform.application.service.AuditionSearchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 오디션 검색 컨트롤러
 * 작업: 2026_19_search_discovery
 */
@RestController
@RequestMapping("/api/v1/search/auditions")
@RequiredArgsConstructor
@Tag(name = "Audition Search", description = "오디션 검색 API")
public class AuditionSearchController {

    private final AuditionSearchService auditionSearchService;

    @GetMapping
    @Operation(summary = "오디션 검색", description = "키워드, 카테고리, 상태로 오디션 검색")
    public ResponseEntity<Page<AuditionDto>> searchAuditions(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String category, // SINGER, DANCER, ACTOR, MODEL, INSTRUMENT
            @RequestParam(required = false) String status, // ONGOING, UNDER_SCREENING, FINISHED
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Page<AuditionDto> auditions = auditionSearchService.searchAuditions(keyword, category, status, pageable);
        return ResponseEntity.ok(auditions);
    }
}
