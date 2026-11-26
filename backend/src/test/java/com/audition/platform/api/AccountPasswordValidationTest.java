package com.audition.platform.api;

import com.audition.platform.api.dto.LoginRequest;
import com.audition.platform.api.dto.SignupRequest;
import com.audition.platform.api.dto.me.PatchMePasswordRequest;
import com.audition.platform.api.dto.recovery.RecoverResetRequest;
import jakarta.validation.Validation;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AccountPasswordValidationTest {
    @Test
    void signupRecoveryAndPasswordChangeUseSixCharactersWithoutBlockingLegacyLogin() {
        try (var factory = Validation.buildDefaultValidatorFactory()) {
            var validator = factory.getValidator();
            assertFalse(validator.validateValue(SignupRequest.class, "password", "abc12").isEmpty());
            assertFalse(validator.validateValue(RecoverResetRequest.class, "newPassword", "abc12").isEmpty());
            assertFalse(validator.validateValue(PatchMePasswordRequest.class, "newPassword", "abc12").isEmpty());

            assertTrue(validator.validateValue(SignupRequest.class, "password", "abc123").isEmpty());
            assertTrue(validator.validateValue(RecoverResetRequest.class, "newPassword", "abc123").isEmpty());
            assertTrue(validator.validateValue(PatchMePasswordRequest.class, "newPassword", "abc123").isEmpty());
            assertTrue(validator.validateValue(LoginRequest.class, "password", "abc12").isEmpty());
        }
    }
}
