package com.audition.platform.domain.repository;

import com.audition.platform.domain.entity.UserPoints;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;
import java.util.Optional;

/**
 * 사용자 포인트 Repository
 * 작업: POINTS_02_backend_points
 */
@Repository
public interface UserPointsRepository extends JpaRepository<UserPoints, Long> {
    
    Optional<UserPoints> findByUserId(Long userId);
    
    // 트랜잭션 보호를 위한 비관적 락
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT up FROM UserPoints up WHERE up.userId = :userId")
    Optional<UserPoints> findByUserIdWithLock(@Param("userId") Long userId);
}
