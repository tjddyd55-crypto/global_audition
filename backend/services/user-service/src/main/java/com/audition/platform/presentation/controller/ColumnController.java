package com.audition.platform.presentation.controller;

import com.audition.platform.application.dto.ColumnDto;
import com.audition.platform.application.dto.CreateColumnRequest;
import com.audition.platform.application.service.ColumnService;
import com.audition.platform.infrastructure.security.AuthHeaderUserResolver;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/columns")
@RequiredArgsConstructor
@Tag(name = "Columns", description = "칼럼 콘텐츠 API")
public class ColumnController {

    private final ColumnService columnService;
    private final AuthHeaderUserResolver authHeaderUserResolver;

    @GetMapping
    @Operation(summary = "칼럼 목록 조회", description = "공개 칼럼 목록")
    public ResponseEntity<Page<ColumnDto>> getColumns(
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Page<ColumnDto> columns = columnService.getPublishedColumns(pageable);
        return ResponseEntity.ok(columns);
    }

    @GetMapping("/{id}")
    @Operation(summary = "칼럼 상세 조회", description = "공개 칼럼 조회 (초안은 관리자만)")
    public ResponseEntity<ColumnDto> getColumn(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        Long requesterId = authHeaderUserResolver.getUserIdFromAuthHeader(authHeader);
        ColumnDto column = columnService.getColumn(id, requesterId);
        return ResponseEntity.ok(column);
    }

    @PostMapping
    @Operation(summary = "칼럼 생성", description = "기획사 또는 관리자(트레이너)만 가능 (작업: 2026_14_columns_content)")
    public ResponseEntity<ColumnDto> createColumn(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody @Valid CreateColumnRequest request
    ) {
        Long authorId = authHeaderUserResolver.getUserIdFromAuthHeaderOrThrow(authHeader);
        ColumnDto created = columnService.createColumn(authorId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}/publish")
    @Operation(summary = "칼럼 발행", description = "기획사 또는 관리자(트레이너)만 가능 (작업: 2026_14_columns_content)")
    public ResponseEntity<ColumnDto> publishColumn(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id
    ) {
        Long authorId = authHeaderUserResolver.getUserIdFromAuthHeaderOrThrow(authHeader);
        ColumnDto updated = columnService.publishColumn(authorId, id);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/my")
    @Operation(summary = "내 칼럼 목록", description = "현재 로그인한 사용자가 작성한 칼럼 목록 (작업: 2026_14_columns_content)")
    public ResponseEntity<Page<ColumnDto>> getMyColumns(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Long authorId = authHeaderUserResolver.getUserIdFromAuthHeaderOrThrow(authHeader);
        Page<ColumnDto> columns = columnService.getMyColumns(authorId, pageable);
        return ResponseEntity.ok(columns);
    }
}

