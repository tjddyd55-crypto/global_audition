package com.audition.platform.presentation.controller;

import com.audition.platform.application.dto.CreateExpertFeedbackRequest;
import com.audition.platform.application.dto.ExpertFeedbackDto;
import com.audition.platform.application.service.ExpertFeedbackService;
import com.audition.platform.domain.entity.ExpertFeedback;
import com.audition.platform.domain.entity.User;
import com.audition.platform.infrastructure.security.CurrentUserContext;
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

/**
 * 전문가 평가 컨트롤러
 * 작업: GA_20260202_CREATIVE_REGISTRY_EXTENSION
 */
@RestController
@RequestMapping("/api/v1/feedback")
@RequiredArgsConstructor
@Tag(name = "Expert Feedback", description = "전문가 평가 API")
public class ExpertFeedbackController {

    private final ExpertFeedbackService expertFeedbackService;
    private final CurrentUserContext currentUserContext;

    @PostMapping
    @Operation(summary = "전문가 평가 작성", description = "기획사 또는 인증 평가자만 가능")
    public ResponseEntity<ExpertFeedbackDto> createFeedback(
            @RequestBody @Valid CreateExpertFeedbackRequest request
    ) {
        Long evaluatorId = currentUserContext.getCurrentUserIdOrThrow();
        
        // 사용자 타입 확인 (기획사인지 확인)
        // TODO: 인증 평가자 타입도 확인 필요
        ExpertFeedback.EvaluatorType evaluatorType = ExpertFeedback.EvaluatorType.AGENCY;
        
        ExpertFeedbackDto feedback = expertFeedbackService.createFeedback(
                evaluatorId, evaluatorType, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(feedback);
    }

    @GetMapping("/asset/{assetId}")
    @Operation(summary = "자산별 평가 목록 조회", description = "창작자도 열람 가능")
    public ResponseEntity<Page<ExpertFeedbackDto>> getFeedbackByAsset(
            @PathVariable Long assetId,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Page<ExpertFeedbackDto> feedbacks = expertFeedbackService.getFeedbackByAsset(assetId, pageable);
        return ResponseEntity.ok(feedbacks);
    }

    @GetMapping("/my")
    @Operation(summary = "내가 작성한 평가 목록")
    public ResponseEntity<Page<ExpertFeedbackDto>> getMyFeedback(
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Long evaluatorId = currentUserContext.getCurrentUserIdOrThrow();
        Page<ExpertFeedbackDto> feedbacks = expertFeedbackService.getFeedbackByEvaluator(evaluatorId, pageable);
        return ResponseEntity.ok(feedbacks);
    }
}
