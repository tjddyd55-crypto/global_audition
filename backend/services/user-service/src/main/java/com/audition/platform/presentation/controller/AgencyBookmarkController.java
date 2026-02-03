package com.audition.platform.presentation.controller;

import com.audition.platform.application.dto.AgencyBookmarkDto;
import com.audition.platform.application.dto.UpsertAgencyBookmarkRequest;
import com.audition.platform.application.service.AgencyBookmarkService;
import com.audition.platform.infrastructure.security.AuthHeaderUserResolver;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/agency/bookmarks")
@RequiredArgsConstructor
@Tag(name = "Agency Bookmarks", description = "기획사 북마크/메모 API")
public class AgencyBookmarkController {

    private final AgencyBookmarkService agencyBookmarkService;
    private final AuthHeaderUserResolver authHeaderUserResolver;

    @GetMapping
    @Operation(summary = "내 북마크 목록")
    public ResponseEntity<Page<AgencyBookmarkDto>> getMyBookmarks(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Long ownerId = authHeaderUserResolver.getUserIdFromAuthHeaderOrThrow(authHeader);
        Page<AgencyBookmarkDto> result = agencyBookmarkService.getMyBookmarks(ownerId, pageable);
        return ResponseEntity.ok(result);
    }

    @PostMapping
    @Operation(summary = "북마크 등록/수정")
    public ResponseEntity<AgencyBookmarkDto> upsertBookmark(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody @Valid UpsertAgencyBookmarkRequest request
    ) {
        Long ownerId = authHeaderUserResolver.getUserIdFromAuthHeaderOrThrow(authHeader);
        AgencyBookmarkDto result = agencyBookmarkService.upsertBookmark(ownerId, request);
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/{applicantId}")
    @Operation(summary = "북마크 삭제")
    public ResponseEntity<Void> deleteBookmark(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long applicantId
    ) {
        Long ownerId = authHeaderUserResolver.getUserIdFromAuthHeaderOrThrow(authHeader);
        agencyBookmarkService.deleteBookmark(ownerId, applicantId);
        return ResponseEntity.noContent().build();
    }
}

