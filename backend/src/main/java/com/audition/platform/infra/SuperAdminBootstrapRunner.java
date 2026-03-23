package com.audition.platform.infra;

import com.audition.platform.domain.user.User;
import com.audition.platform.domain.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.lang.NonNull;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Locale;
import java.util.UUID;

/**
 * Flyway 시드(V17)가 적용되지 않은 환경(예: 이미 마이그레이션된 DB)에서도 슈퍼관리자를 만들 수 있게 한다.
 * <p>
 * Railway 등: {@code BOOTSTRAP_SUPER_ADMIN=true} 를 한 번 설정 후 재기동 → 로그인 확인 후 반드시 false 로 되돌릴 것.
 * 비밀번호만 다시 맞추려면 {@code BOOTSTRAP_SUPER_ADMIN_RESET_PASSWORD=true} (동시에 bootstrap 활성화).
 */
@Component
@ConditionalOnProperty(prefix = "app.super-admin", name = "bootstrap-enabled", havingValue = "true")
public class SuperAdminBootstrapRunner implements ApplicationListener<ApplicationReadyEvent> {

    private static final Logger log = LoggerFactory.getLogger(SuperAdminBootstrapRunner.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public SuperAdminBootstrapRunner(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void onApplicationEvent(@NonNull ApplicationReadyEvent event) {
        var env = event.getApplicationContext().getEnvironment();
        String email = env.getProperty("BOOTSTRAP_SUPER_ADMIN_EMAIL", "superadmin@audition.local")
                .trim()
                .toLowerCase(Locale.ROOT);
        String rawPassword = env.getProperty("BOOTSTRAP_SUPER_ADMIN_PASSWORD", "SuperAdmin!ChangeMe");
        boolean resetPassword = Boolean.parseBoolean(env.getProperty("BOOTSTRAP_SUPER_ADMIN_RESET_PASSWORD", "false"));

        userRepository.findByEmail(email).ifPresentOrElse(
                user -> {
                    if (resetPassword) {
                        user.setPasswordHash(passwordEncoder.encode(rawPassword));
                        user.setUpdatedAt(Instant.now());
                        userRepository.save(user);
                        log.warn(
                                "[bootstrap] Super admin 비밀번호를 갱신했습니다. email={} — BOOTSTRAP_SUPER_ADMIN 관련 환경 변수를 즉시 비활성화하세요.",
                                email);
                    } else {
                        log.info("[bootstrap] Super admin 이미 존재함. 건너뜀. email={}", email);
                    }
                },
                () -> {
                    User user = new User();
                    user.setEmail(email);
                    user.setPasswordHash(passwordEncoder.encode(rawPassword));
                    user.setRole("SUPER_ADMIN");
                    user.setUsername(uniqueUsername("superadmin_bootstrap"));
                    user.setDisplayName("Super Admin");
                    user.setUpdatedAt(Instant.now());
                    userRepository.save(user);
                    log.warn(
                            "[bootstrap] Super admin 계정을 생성했습니다. email={} — BOOTSTRAP_SUPER_ADMIN 을 false 로 두고 재배포하세요.",
                            email);
                });
    }

    private String uniqueUsername(String base) {
        String candidate = base + "_" + UUID.randomUUID().toString().replace("-", "").substring(0, 10);
        while (userRepository.existsByUsername(candidate)) {
            candidate = base + "_" + UUID.randomUUID().toString().replace("-", "").substring(0, 10);
        }
        return candidate;
    }
}
