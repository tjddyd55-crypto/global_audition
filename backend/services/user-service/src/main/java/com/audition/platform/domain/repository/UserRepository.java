package com.audition.platform.domain.repository;

import com.audition.platform.domain.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findByEmailAndDeletedAtIsNull(String email);

    boolean existsByEmail(String email);

    Optional<User> findByProviderAndProviderId(User.Provider provider, String providerId);

    // 아이디 찾기: 이름과 이메일로 찾기
    Optional<User> findByNameAndEmailAndDeletedAtIsNull(String name, String email);

    // 비밀번호 재설정 토큰으로 찾기
    Optional<User> findByPasswordResetTokenAndPasswordResetTokenExpiresAtAfter(String token, LocalDateTime now);
}
