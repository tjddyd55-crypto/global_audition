package com.audition.platform.presentation.controller;

import com.audition.platform.application.dto.AuditionDto;
import com.audition.platform.application.dto.CreateAuditionRequest;
import com.audition.platform.application.dto.UpdateAuditionRequest;
import com.audition.platform.application.service.AuditionService;
import com.audition.platform.infrastructure.security.SecurityUtils;
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
@RequestMapping("/api/v1/auditions")
@RequiredArgsConstructor
@Tag(name = "Auditions", description = "오디션 관리 API")
public class AuditionController {

    private final AuditionService auditionService;

    @GetMapping
    @Operation(summary = "오디션 목록 조회", description = "필터링 및 페이지네이션 지원")
    public ResponseEntity<Page<AuditionDto>> getAuditions(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String status,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Page<AuditionDto> auditions = auditionService.getAuditions(category, status, pageable);
        return ResponseEntity.ok(auditions);
    }

    @GetMapping("/{id}")
    @Operation(summary = "오디션 상세 조회")
    public ResponseEntity<AuditionDto> getAudition(@PathVariable Long id) {
        AuditionDto audition = auditionService.getAuditionById(id);
        return ResponseEntity.ok(audition);
    }

    @PostMapping
    @Operation(summary = "오디션 생성", description = "기획사만 생성 가능")
    public ResponseEntity<AuditionDto> createAudition(
            @RequestBody @Valid CreateAuditionRequest request
    ) {
        Long businessId = SecurityUtils.getCurrentUserIdOrThrow();
        AuditionDto created = auditionService.createAudition(businessId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "오디션 수정")
    public ResponseEntity<AuditionDto> updateAudition(
            @PathVariable Long id,
            @RequestBody @Valid UpdateAuditionRequest request
    ) {
        AuditionDto updated = auditionService.updateAudition(id, request);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "오디션 삭제")
    public ResponseEntity<Void> deleteAudition(@PathVariable Long id) {
        auditionService.deleteAudition(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/business/{businessId}")
    @Operation(summary = "기획사별 오디션 목록")
    public ResponseEntity<Page<AuditionDto>> getAuditionsByBusiness(
            @PathVariable Long businessId,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Page<AuditionDto> auditions = auditionService.getAuditionsByBusiness(businessId, pageable);
        return ResponseEntity.ok(auditions);
    }
    
    @GetMapping("/my")
    @Operation(summary = "내 오디션 목록", description = "현재 로그인한 기획사의 오디션 목록")
    public ResponseEntity<Page<AuditionDto>> getMyAuditions(
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Long businessId = SecurityUtils.getCurrentUserIdOrThrow();
        Page<AuditionDto> auditions = auditionService.getAuditionsByBusiness(businessId, pageable);
        return ResponseEntity.ok(auditions);
    }
}
