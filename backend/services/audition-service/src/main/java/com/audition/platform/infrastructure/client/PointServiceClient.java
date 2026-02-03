package com.audition.platform.infrastructure.client;

import com.audition.platform.application.dto.DeductPointsResponse;
import com.audition.platform.application.service.PointService;
import com.audition.platform.domain.entity.PointTransaction;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Point Service 내부 API 클라이언트 (프로덕션: api-backend 통합 구조)
 * 
 * 서버 기준선(SSOT): api-backend는 gateway + user-domain + audition-domain이 하나의 배포 단위
 * - localhost/포트 기반 통신 금지
 * - api-backend 내부는 직접 서비스 주입 사용
 * - media-service와의 통신만 도메인 기반 HTTP 호출
 * 
 * 통합 배포 시 user-domain과 audition-domain은 같은 애플리케이션 컨텍스트에 있으므로
 * HTTP 호출 대신 직접 서비스 주입을 사용한다.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class PointServiceClient {

    // 프로덕션: api-backend 통합 구조에서는 직접 서비스 주입 사용
    // 통합 배포 시 user-domain과 audition-domain은 같은 애플리케이션 컨텍스트
    private final PointService pointService;

    /**
     * 포인트 차감 (프로덕션: 직접 서비스 호출)
     * 
     * 서버 기준선: api-backend 통합 구조에서는 HTTP 호출 대신 직접 서비스 주입 사용
     * 
     * @param userId 사용자 ID
     * @param amount 차감할 포인트
     * @param eventType 이벤트 타입
     * @param relatedId 관련 엔티티 ID
     * @param description 설명
     * @return 차감 결과 (실패 시 null 반환)
     */
    public DeductPointsResponse deductPoints(
            Long userId,
            Long amount,
            PointTransaction.EventType eventType,
            Long relatedId,
            String description
    ) {
        try {
            PointTransaction transaction = pointService.deductPoints(
                    userId,
                    amount,
                    eventType,
                    relatedId,
                    description != null ? description : String.format("%s - %s", eventType, relatedId)
            );

            return DeductPointsResponse.builder()
                    .transactionId(transaction.getId())
                    .balanceBefore(transaction.getBalanceBefore())
                    .balanceAfter(transaction.getBalanceAfter())
                    .success(true)
                    .message("포인트 차감 완료")
                    .build();
        } catch (Exception e) {
            log.error("Point Service 내부 API 호출 실패: userId={}, amount={}, error={}", 
                    userId, amount, e.getMessage());
            return DeductPointsResponse.builder()
                    .success(false)
                    .message("포인트 차감 실패: " + e.getMessage())
                    .build();
        }
    }
}
