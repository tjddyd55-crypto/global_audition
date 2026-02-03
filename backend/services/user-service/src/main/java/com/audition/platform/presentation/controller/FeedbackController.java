package com.audition.platform.presentation.controller;

import com.audition.platform.application.dto.CreateFeedbackRequest;
import com.audition.platform.application.dto.FeedbackSessionDto;
import com.audition.platform.application.dto.UpdateFeedbackStatusRequest;
import com.audition.platform.application.service.FeedbackService;
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
@RequestMapping("/api/v1/feedback")
@RequiredArgsConstructor
@Tag(name = "Feedback", description = "트레이너 피드백 API")
public class FeedbackController {

    private final FeedbackService feedbackService;
    private final AuthHeaderUserResolver authHeaderUserResolver;

    @PostMapping("/requests")
    @Operation(summary = "피드백 요청", description = "지원자가 트레이너에게 요청")
    public ResponseEntity<FeedbackSessionDto> requestFeedback(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody @Valid CreateFeedbackRequest request
    ) {
        Long applicantId = authHeaderUserResolver.getUserIdFromAuthHeaderOrThrow(authHeader);
        FeedbackSessionDto created = feedbackService.requestFeedback(applicantId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/sessions/{id}/status")
    @Operation(summary = "피드백 상태 변경", description = "트레이너가 수락/거절/완료")
    public ResponseEntity<FeedbackSessionDto> updateStatus(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id,
            @RequestBody @Valid UpdateFeedbackStatusRequest request
    ) {
        Long instructorId = authHeaderUserResolver.getUserIdFromAuthHeaderOrThrow(authHeader);
        FeedbackSessionDto updated = feedbackService.updateFeedbackStatus(instructorId, id, request);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/my")
    @Operation(summary = "내 피드백 요청 목록", description = "지원자용")
    public ResponseEntity<Page<FeedbackSessionDto>> getMyRequests(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Long applicantId = authHeaderUserResolver.getUserIdFromAuthHeaderOrThrow(authHeader);
        Page<FeedbackSessionDto> sessions = feedbackService.getMyFeedbackRequests(applicantId, pageable);
        return ResponseEntity.ok(sessions);
    }

    @GetMapping("/instructor")
    @Operation(summary = "내 피드백 세션 목록", description = "트레이너용")
    public ResponseEntity<Page<FeedbackSessionDto>> getInstructorSessions(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Long instructorId = authHeaderUserResolver.getUserIdFromAuthHeaderOrThrow(authHeader);
        Page<FeedbackSessionDto> sessions = feedbackService.getInstructorSessions(instructorId, pageable);
        return ResponseEntity.ok(sessions);
    }
}

