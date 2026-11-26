package com.audition.platform.infra;

import com.audition.platform.domain.user.User;
import com.audition.platform.domain.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class SuperAdminBootstrapRunnerTest {
    private final UserRepository users = mock(UserRepository.class);
    private final JdbcTemplate database = mock(JdbcTemplate.class);
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(4);
    private final SuperAdminBootstrapRunner runner = new SuperAdminBootstrapRunner(users, encoder, database);

    @Test
    void incompleteCredentialsOrProductionNeverWrite() {
        runner.applyConfiguration(new MockEnvironment());
        runner.applyConfiguration(new MockEnvironment().withProperty("RAILWAY_ENVIRONMENT_NAME", "development"));
        runner.applyConfiguration(config("dev-admin@example.test").withProperty("RAILWAY_ENVIRONMENT_NAME", "production"));
        runner.applyConfiguration(config("dev-admin@example.test").withProperty("BOOTSTRAP_SUPER_ADMIN_PASSWORD", ""));
        runner.applyConfiguration(config("dev-admin@example.test").withProperty("BOOTSTRAP_SUPER_ADMIN_PASSWORD", "short"));
        verifyNoInteractions(users, database);
    }

    @Test
    void createsOnlyWithAnExplicitEmailAndPreparesCredentialVersion() {
        String password = "abc123";
        runner.applyConfiguration(config(" DEV-ADMIN@example.test ")
                .withProperty("BOOTSTRAP_SUPER_ADMIN_PASSWORD", password));
        var user = ArgumentCaptor.forClass(User.class);
        verify(users).save(user.capture());
        var saved = user.getValue();
        assertEquals("dev-admin@example.test", saved.getEmail());
        assertEquals("SUPER_ADMIN", saved.getRole());
        assertNotNull(saved.getBootstrapCredentialVersion());
        assertTrue(encoder.matches(password, saved.getPasswordHash()));
        verify(database).update(anyString(), (Object) isNull());
    }

    @Test
    void renamePreservesUserIdentityAndRoleAndRotatesSessionVersion() {
        User existing = account("old@example.test", "SUPER_ADMIN");
        UUID version = existing.getBootstrapCredentialVersion();
        UUID id = existing.getId();
        when(users.findByBootstrapCredentialVersionIsNotNull()).thenReturn(Optional.of(existing));
        runner.applyConfiguration(config("new@example.test"));
        verify(users).save(existing);
        assertEquals(id, existing.getId());
        assertEquals("SUPER_ADMIN", existing.getRole());
        assertEquals("new@example.test", existing.getEmail());
        assertNotEquals(version, existing.getBootstrapCredentialVersion());
        assertTrue(encoder.matches(testPassword(), existing.getPasswordHash()));
    }

    @Test
    void unchangedCredentialsKeepSessionVersionAndStillRemoveOtherAdmins() {
        User existing = account("managed@example.test", "SUPER_ADMIN");
        existing.setPasswordHash(encoder.encode(testPassword()));
        UUID version = existing.getBootstrapCredentialVersion();
        when(users.findByEmail(existing.getEmail())).thenReturn(Optional.of(existing));
        runner.applyConfiguration(config(existing.getEmail()));

        verify(database).update(anyString(), eq(existing.getId()));
        verify(users, never()).save(any());
        assertEquals(version, existing.getBootstrapCredentialVersion());
    }

    @Test
    void configuredExistingAccountIsPromotedAfterRemovingOtherPrivilegedAssignments() {
        User target = account("member@example.test", "APPLICANT");
        target.setBootstrapCredentialVersion(null);
        target.setRecoveryCodeLookup("old-lookup");
        target.setRecoveryCodeHash("old-hash");
        when(users.findByEmail(target.getEmail())).thenReturn(Optional.of(target));
        runner.applyConfiguration(config(target.getEmail()));

        var order = inOrder(database, users);
        order.verify(database).update(anyString(), eq(target.getId()));
        order.verify(users).save(target);
        assertEquals("SUPER_ADMIN", target.getRole());
        assertNotNull(target.getBootstrapCredentialVersion());
        assertNull(target.getRecoveryCodeLookup());
        assertNull(target.getRecoveryCodeHash());
        assertTrue(encoder.matches(testPassword(), target.getPasswordHash()));
    }

    @Test
    void inactiveConfiguredAccountLeavesExistingRolesAlone() {
        User existing = account("member@example.test", "APPLICANT");
        existing.setAccountStatus("SUSPENDED");
        when(users.findByEmail(existing.getEmail())).thenReturn(Optional.of(existing));
        runner.applyConfiguration(config(existing.getEmail()));
        verify(database, never()).update(anyString(), (Object) any());
        verify(users, never()).save(any());
    }

    private static MockEnvironment config(String email) {
        return new MockEnvironment()
                .withProperty("RAILWAY_ENVIRONMENT_NAME", "development")
                .withProperty("BOOTSTRAP_SUPER_ADMIN_EMAIL", email)
                .withProperty("BOOTSTRAP_SUPER_ADMIN_PASSWORD", testPassword());
    }

    private static String testPassword() {
        return "temporary-string-for-unit-test";
    }

    private User account(String email, String role) {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail(email);
        user.setRole(role);
        user.setBootstrapCredentialVersion(UUID.randomUUID());
        user.setPasswordHash(encoder.encode("different-test-value"));
        return user;
    }
}
