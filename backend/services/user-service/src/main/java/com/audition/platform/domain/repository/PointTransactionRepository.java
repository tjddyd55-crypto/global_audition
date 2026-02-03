package com.audition.platform.domain.repository;

import com.audition.platform.domain.entity.PointTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 포인트 거래 내역 Repository
 * 작업: POINTS_02_backend_points
 */
@Repository
public interface PointTransactionRepository extends JpaRepository<PointTransaction, Long> {
    
    Page<PointTransaction> findByUserId(Long userId, Pageable pageable);
    
    Page<PointTransaction> findByUserIdAndTransactionType(
            Long userId, PointTransaction.TransactionType type, Pageable pageable);
    
    Page<PointTransaction> findByUserIdAndEventType(
            Long userId, PointTransaction.EventType eventType, Pageable pageable);
    
    List<PointTransaction> findByUserIdAndStatusOrderByIdDesc(
            Long userId, PointTransaction.TransactionStatus status);
    
    Optional<PointTransaction> findByStripePaymentIntentId(String paymentIntentId);
}
