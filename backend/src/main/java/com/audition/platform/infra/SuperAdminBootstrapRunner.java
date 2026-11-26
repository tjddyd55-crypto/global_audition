package com.audition.platform.infra;

import com.audition.platform.application.org.OrgRoles;
import com.audition.platform.domain.user.User;
import com.audition.platform.domain.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.lang.NonNull;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Pattern;

/** Keeps the configured Railway Development login as the sole super administrator. */
@Component
public class SuperAdminBootstrapRunner implements ApplicationListener<ApplicationReadyEvent> {
    private static final Logger log = LoggerFactory.getLogger(SuperAdminBootstrapRunner.class);
    private static final Pattern EMAIL = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

    private final UserRepository users;
    private final PasswordEncoder passwords;
    private final JdbcTemplate jdbc;

    public SuperAdminBootstrapRunner(UserRepository users, PasswordEncoder passwords, JdbcTemplate jdbc) {
        this.users = users;
        this.passwords = passwords;
        this.jdbc = jdbc;
    }

    @Override
    @Transactional
    public void onApplicationEvent(@NonNull ApplicationReadyEvent event) {
        applyConfiguration(event.getApplicationContext().getEnvironment());
    }

    void applyConfiguration(Environment env) {
        String railway = env.getProperty("RAILWAY_ENVIRONMENT_NAME", "").strip();
        if (!"development".equalsIgnoreCase(railway)) return;
        String email = env.getProperty("BOOTSTRAP_SUPER_ADMIN_EMAIL", "").strip().toLowerCase(Locale.ROOT);
        String password = env.getProperty("BOOTSTRAP_SUPER_ADMIN_PASSWORD", "");
        if (email.isEmpty() && password.isEmpty()) return;
        if (!validEmail(email) || !validPassword(password)) {
            log.warn("[super-admin bootstrap] Configure a valid email and a password with at least 6 characters and at most 72 UTF-8 bytes.");
            return;
        }

        // A rolling deployment can briefly start several replicas with the same configuration.
        jdbc.execute("SELECT pg_advisory_xact_lock(18679, 80)");
        User target = users.findByEmail(email)
                .or(() -> users.findByBootstrapCredentialVersionIsNotNull()
                        .filter(user -> OrgRoles.hq(user.getRole())))
                .orElse(null);
        if (target != null && !"ACTIVE".equals(target.getAccountStatus())) {
            log.warn("[super-admin bootstrap] The configured administrator account is inactive. No roles were changed.");
            return;
        }

        int revoked = revokeOtherSuperAdmins(target == null ? null : target.getId());
        if (target == null) {
            create(email, password);
        } else {
            update(target, email, password);
        }
        log.info("[super-admin bootstrap] Exclusive Development administrator configured. Other privileged assignments removed: {}.", revoked);
    }

    private int revokeOtherSuperAdmins(UUID targetId) {
        // Clear the previous managed account's marker before assigning it to another account.
        return jdbc.update("""
                UPDATE users
                   SET role = CASE WHEN role IN ('SUPER_ADMIN', 'GLOBAL_SUPER_ADMIN') THEN 'APPLICANT' ELSE role END,
                       bootstrap_credential_version = NULL,
                       updated_at = NOW()
                 WHERE id IS DISTINCT FROM CAST(? AS uuid)
                   AND (role IN ('SUPER_ADMIN', 'GLOBAL_SUPER_ADMIN') OR bootstrap_credential_version IS NOT NULL)
                """, targetId);
    }

    private void update(User target, String email, String password) {
        boolean samePassword = target.getPasswordHash() != null && passwords.matches(password, target.getPasswordHash());
        if (OrgRoles.SUPER_ADMIN.equals(target.getRole()) && target.getBootstrapCredentialVersion() != null
                && email.equals(target.getEmail()) && samePassword) {
            return;
        }
        target.setRole(OrgRoles.SUPER_ADMIN);
        target.setEmail(email);
        if (!samePassword) target.setPasswordHash(passwords.encode(password));
        target.setRecoveryCodeHash(null);
        target.setRecoveryCodeLookup(null);
        target.setRecoveryCodeIssuedAt(null);
        target.setRecoveryFailedAttempts(0);
        target.setRecoveryLockedUntil(null);
        setNewVersion(target);
        users.save(target);
    }

    private void create(String email, String password) {
        String suffix;
        do {
            suffix = UUID.randomUUID().toString().substring(0, 8);
        } while (users.existsByUsername("superadmin_" + suffix) || users.existsByNicknameIgnoreCase("SuperAdmin_" + suffix));
        User admin = new User();
        admin.setEmail(email);
        admin.setRole(OrgRoles.SUPER_ADMIN);
        admin.setUsername("superadmin_" + suffix);
        admin.setNickname("SuperAdmin_" + suffix);
        admin.setPasswordHash(passwords.encode(password));
        setNewVersion(admin);
        users.save(admin);
    }

    private static void setNewVersion(User admin) {
        admin.setBootstrapCredentialVersion(UUID.randomUUID());
        admin.setUpdatedAt(Instant.now());
    }

    private static boolean validEmail(String value) {
        return value.length() <= 254 && EMAIL.matcher(value).matches();
    }

    private static boolean validPassword(String value) {
        int bytes = value.getBytes(StandardCharsets.UTF_8).length;
        return value.codePointCount(0, value.length()) >= 6 && bytes <= 72 && !value.isBlank();
    }
}
