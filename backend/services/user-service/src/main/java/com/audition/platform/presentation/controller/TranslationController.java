package com.audition.platform.presentation.controller;

import com.audition.platform.application.dto.CreateTranslationJobRequest;
import com.audition.platform.application.dto.TranslationJobDto;
import com.audition.platform.application.service.TranslationService;
import com.audition.platform.infrastructure.security.AuthHeaderUserResolver;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/translations")
@RequiredArgsConstructor
@Tag(name = "Translations", description = "번역 작업 API")
public class TranslationController {

    private final TranslationService translationService;
    private final AuthHeaderUserResolver authHeaderUserResolver;

    @PostMapping("/jobs")
    @Operation(summary = "번역 작업 생성", description = "내부용 번역 작업 생성(관리자)")
    public ResponseEntity<TranslationJobDto> createJob(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody @Valid CreateTranslationJobRequest request
    ) {
        Long requesterId = authHeaderUserResolver.getUserIdFromAuthHeaderOrThrow(authHeader);
        TranslationJobDto created = translationService.createJob(requesterId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/jobs/{id}")
    @Operation(summary = "번역 작업 조회", description = "관리자 전용")
    public ResponseEntity<TranslationJobDto> getJob(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id
    ) {
        Long requesterId = authHeaderUserResolver.getUserIdFromAuthHeaderOrThrow(authHeader);
        TranslationJobDto job = translationService.getJob(requesterId, id);
        return ResponseEntity.ok(job);
    }
}

