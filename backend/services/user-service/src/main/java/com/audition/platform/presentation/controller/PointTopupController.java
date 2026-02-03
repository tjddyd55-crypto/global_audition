package com.audition.platform.presentation.controller;

import com.audition.platform.application.dto.CreatePointTopupRequest;
import com.audition.platform.application.dto.PointTopupResponse;
import com.audition.platform.application.service.PointTopupService;
import com.audition.platform.infrastructure.security.AuthHeaderUserResolver;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 포인트 충전 컨트롤러
 * 작업: POINTS_03_stripe_topup
 */
@RestController
@RequestMapping("/api/v1/points/topup")
@RequiredArgsConstructor
@Tag(name = "Point Topup", description = "포인트 충전 API (Stripe)")
public class PointTopupController {

    private final PointTopupService pointTopupService;
    private final AuthHeaderUserResolver authHeaderUserResolver;

    @PostMapping
    @Operation(summary = "포인트 충전 Intent 생성", description = "Stripe Payment Intent를 생성하여 포인트 충전을 시작합니다")
    public ResponseEntity<PointTopupResponse> createTopupIntent(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody @Valid CreatePointTopupRequest request
    ) {
        Long userId = authHeaderUserResolver.getUserIdFromAuthHeaderOrThrow(authHeader);
        PointTopupResponse response = pointTopupService.createTopupIntent(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
