package com.audition.platform.domain.credit;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface UserCreditRepository extends JpaRepository<UserCredit, UUID> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from UserCredit c where c.userId = :userId")
    Optional<UserCredit> findByUserIdForUpdate(@Param("userId") UUID userId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(
            value = "INSERT INTO user_credits (user_id, balance, updated_at) VALUES (:userId, 0, now()) "
                    + "ON CONFLICT (user_id) DO NOTHING",
            nativeQuery = true)
    int ensureWalletRow(@Param("userId") UUID userId);
}
