package com.audition.platform.domain.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface UserSnsLinkRepository extends JpaRepository<UserSnsLink, UUID> {

    List<UserSnsLink> findByUserIdOrderByCreatedAtAsc(UUID userId);

    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM UserSnsLink u WHERE u.userId = :userId")
    void deleteByUserId(@Param("userId") UUID userId);
}
