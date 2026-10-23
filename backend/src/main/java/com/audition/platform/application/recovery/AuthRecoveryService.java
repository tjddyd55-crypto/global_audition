package com.audition.platform.application.recovery;

import com.audition.platform.api.dto.recovery.RecoverIdentifyResponse;
import com.audition.platform.domain.recovery.RecoveryCodeFormatter;
import com.audition.platform.domain.user.User;
import com.audition.platform.domain.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Locale;

@Service
public class AuthRecoveryService {

    private static final int MAX_FAILED = 5;
    private static final int LOCK_MINUTES = 15;
    private static final String GENERIC_FAIL = "복구 코드를 확인할 수 없습니다.";

    private final UserRepository userRepository;
    private final RecoveryCodeCrypto crypto;
    private final PasswordEncoder passwordEncoder;

    public AuthRecoveryService(
            UserRepository userRepository,
            RecoveryCodeCrypto crypto,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.crypto = crypto;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public String issueNewCode(User user) {
        String display;
        String normalized;
        String lookup;
        int guard = 0;
        do {
            display = RecoveryCodeFormatter.generateDisplayCode();
            normalized = crypto.normalize(display);
            lookup = crypto.lookupKey(normalized);
            guard++;
        } while (userRepository.findByRecoveryCodeLookup(lookup).filter(found -> !found.getId().equals(user.getId())).isPresent()
                && guard < 8);

        user.setRecoveryCodeHash(crypto.hash(normalized));
        user.setRecoveryCodeLookup(lookup);
        user.setRecoveryCodeIssuedAt(Instant.now());
        user.setRecoveryFailedAttempts(0);
        user.setRecoveryLockedUntil(null);
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);
        return display;
    }

    @Transactional
    public RecoverIdentifyResponse identify(String rawCode) {
        User user = requireUserByCode(rawCode);
        return new RecoverIdentifyResponse(user.getEmail());
    }

    @Transactional
    public void resetPassword(String rawCode, String newPassword) {
        User user = requireUserByCode(rawCode);
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setRecoveryFailedAttempts(0);
        user.setRecoveryLockedUntil(null);
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);
    }

    public User findOptionalByEmail(String rawEmail) {
        if (rawEmail == null || rawEmail.isBlank()) {
            return null;
        }
        return userRepository.findByEmail(rawEmail.trim().toLowerCase(Locale.ROOT)).orElse(null);
    }

    private User requireUserByCode(String rawCode) {
        String normalized = crypto.normalize(rawCode);
        if (!RecoveryCodeFormatter.hasValidShape(normalized)) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, GENERIC_FAIL);
        }
        User user = userRepository.findByRecoveryCodeLookup(crypto.lookupKey(normalized))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, GENERIC_FAIL));
        assertUnlocked(user);
        if (!crypto.matches(normalized, user.getRecoveryCodeHash())) {
            registerFailure(user);
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, GENERIC_FAIL);
        }
        return user;
    }

    private void assertUnlocked(User user) {
        Instant until = user.getRecoveryLockedUntil();
        if (until != null && until.isAfter(Instant.now())) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "복구 시도가 잠겼습니다. 잠시 후 다시 시도해 주세요.");
        }
    }

    private void registerFailure(User user) {
        int next = user.getRecoveryFailedAttempts() + 1;
        user.setRecoveryFailedAttempts(next);
        if (next >= MAX_FAILED) {
            user.setRecoveryLockedUntil(Instant.now().plus(LOCK_MINUTES, ChronoUnit.MINUTES));
        }
        userRepository.save(user);
    }
}
