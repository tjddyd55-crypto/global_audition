package com.audition.platform.presentation.controller;

import com.audition.platform.application.dto.DeductPointsRequest;
import com.audition.platform.application.dto.DeductPointsResponse;
import com.audition.platform.application.dto.PointBalanceDto;
import com.audition.platform.application.dto.PointTransactionDto;
import com.audition.platform.application.service.PointService;
import com.audition.platform.application.service.PointTransactionService;
import com.audition.platform.domain.entity.PointTransaction;
import com.audition.platform.infrastructure.security.AuthHeaderUserResolver;
import lombok.extern.slf4j.Slf4j;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 포인트 컨트롤러
 * 작업: POINTS_02_backend_points
 */
@RestController
@RequestMapping("/api/v1/points")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Points", description = "포인트 관리 API")
public class PointController {

    private final PointService pointService;
    private final PointTransactionService pointTransactionService;
    private final AuthHeaderUserResolver authHeaderUserResolver;

    @GetMapping("/balance")
    @Operation(summary = "포인트 잔액 조회")
    public ResponseEntity<PointBalanceDto> getBalance(
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        Long userId = authHeaderUserResolver.getUserIdFromAuthHeaderOrThrow(authHeader);
        Long balance = pointService.getBalance(userId);
        return ResponseEntity.ok(PointBalanceDto.builder()
                .userId(userId)
                .balance(balance)
                .build());
    }

    @GetMapping("/transactions")
    @Operation(summary = "포인트 거래 내역 조회")
    public ResponseEntity<Page<PointTransactionDto>> getTransactions(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(required = false) PointTransaction.TransactionType transactionType,
            @RequestParam(required = false) PointTransaction.EventType eventType,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Long userId = authHeaderUserResolver.getUserIdFromAuthHeaderOrThrow(authHeader);
        
        Page<PointTransactionDto> transactions;
        if (transactionType != null) {
            transactions = pointTransactionService.getTransactionsByType(userId, transactionType, pageable);
        } else if (eventType != null) {
            transactions = pointTransactionService.getTransactionsByEventType(userId, eventType, pageable);
        } else {
            transactions = pointTransactionService.getTransactions(userId, pageable);
        }
        
        return ResponseEntity.ok(transactions);
    }

    /**
     * 포인트 차감 (내부 API)
     * 작업: POINTS_04_usage_deduction
     */
    @PostMapping("/internal/{userId}/deduct")
    @Operation(summary = "포인트 차감 (내부 API)", description = "다른 서비스에서 호출하는 내부 API")
    public ResponseEntity<DeductPointsResponse> deductPoints(
            @PathVariable Long userId,
            @RequestBody DeductPointsRequest request
    ) {
        try {
            PointTransaction transaction = pointService.deductPoints(
                    userId,
                    request.getAmount(),
                    request.getEventType(),
                    request.getRelatedId(),
                    request.getDescription() != null ? request.getDescription() : 
                            String.format("%s - %s", request.getEventType(), request.getRelatedId())
            );

            return ResponseEntity.ok(DeductPointsResponse.builder()
                    .transactionId(transaction.getId())
                    .balanceBefore(transaction.getBalanceBefore())
                    .balanceAfter(transaction.getBalanceAfter())
                    .success(true)
                    .message("포인트 차감 완료")
                    .build());
        } catch (Exception e) {
            log.error("포인트 차감 실패: userId={}, amount={}", userId, request.getAmount(), e);
            return ResponseEntity.ok(DeductPointsResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }
}
