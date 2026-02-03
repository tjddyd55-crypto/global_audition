package com.audition.platform.presentation.controller;

import com.audition.platform.application.dto.ChannelSearchItemDto;
import com.audition.platform.application.service.ChannelSearchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/channels")
@RequiredArgsConstructor
@Tag(name = "Channels", description = "채널 탐색 API")
public class ChannelSearchController {

    private final ChannelSearchService channelSearchService;

    @GetMapping("/search")
    @Operation(summary = "채널 검색", description = "공개 채널 검색/필터")
    public ResponseEntity<Page<ChannelSearchItemDto>> searchChannels(
            @RequestParam(required = false) String country,
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Page<ChannelSearchItemDto> result = channelSearchService.searchPublicChannels(country, keyword, pageable);
        return ResponseEntity.ok(result);
    }
}

