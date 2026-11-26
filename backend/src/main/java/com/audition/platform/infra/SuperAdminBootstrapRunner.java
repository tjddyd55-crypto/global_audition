package com.audition.platform.infra;

import com.audition.platform.domain.user.User;
import com.audition.platform.domain.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
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

/** Explicit, one-deploy credential configuration for Development and local instances. */
@Component
@ConditionalOnProperty(prefix = "app.super-admin", name = "bootstrap-enabled", havingValue = "true")
public class SuperAdminBootstrapRunner implements ApplicationListener<ApplicationReadyEvent> {
    private static final Logger log = LoggerFactory.getLogger(SuperAdminBootstrapRunner.class);
    private static final Pattern EMAIL = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    private static final String ADMIN_ROLE = "SUPER_ADMIN";

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
        if (!railway.isEmpty() && !"development".equalsIgnoreCase(railway)) {
            log.warn("[super-admin bootstrap] Credential changes are disabled in this Railway environment.");
            return;
        }
        String email = email(env, "BOOTSTRAP_SUPER_ADMIN_EMAIL");
        String previousEmail = email(env, "BOOTSTRAP_SUPER_ADMIN_PREVIOUS_EMAIL");
        String password = env.getProperty("BOOTSTRAP_SUPER_ADMIN_PASSWORD", "");
        boolean reset = Boolean.parseBoolean(env.getProperty("BOOTSTRAP_SUPER_ADMIN_RESET_PASSWORD", "false").strip());
        if (!validEmail(email) || (!previousEmail.isEmpty() && !validEmail(previousEmail)) || !validPassword(password)) {
            log.warn("[super-admin bootstrap] A valid email and a password of 16–72 UTF-8 bytes must be configured.");
            return;
        }
        if (!previousEmail.isEmpty() && !reset) {
            log.warn("[super-admin bootstrap] Renaming an existing login requires the explicit reset flag.");
            return;
        }

        // A rolling deployment can briefly start several replicas with the same configuration.
        jdbc.execute("SELECT pg_advisory_xact_lock(18679, 80)");
        User target = users.findByEmail(email).orElse(null);
        User current = previousEmail.isEmpty() || previousEmail.equals(email)
                ? target : users.findByEmail(previousEmail).orElse(null);
        if (current == null) {
            if (reset || !previousEmail.isEmpty()) {
                log.warn("[super-admin bootstrap] The requested existing administrator account was not found.");
                return;
            }
            create(email, password);
            return;
        }
        if (!ADMIN_ROLE.equals(current.getRole()) || !"ACTIVE".equals(current.getAccountStatus())) {
            log.warn("[super-admin bootstrap] The selected login does not belong to an active super administrator.");
            return;
        }
        if (target != null && !target.getId().equals(current.getId())) {
            log.warn("[super-admin bootstrap] The requested email already belongs to another account.");
            return;
        }
        if (!reset) return;
        boolean sameEmail = current.getEmail().equals(email);
        boolean samePassword = passwords.matches(password, current.getPasswordHash());
        if (sameEmail && samePassword) return;
        current.setEmail(email);
        current.setPasswordHash(passwords.encode(password));
        setNewVersion(current);
        users.save(current);
        log.info("[super-admin bootstrap] Existing administrator login updated. Prior sessions were revoked.");
    }

    private void create(String email, String password) {
        String suffix;
        do {
            suffix = UUID.randomUUID().toString().substring(0, 8);
        } while (users.existsByUsername("superadmin_" + suffix) || users.existsByNicknameIgnoreCase("SuperAdmin_" + suffix));
        User admin = new User();
        admin.setEmail(email);
        admin.setRole(ADMIN_ROLE);
        admin.setUsername("superadmin_" + suffix);
        admin.setNickname("SuperAdmin_" + suffix);
        admin.setPasswordHash(passwords.encode(password));
        setNewVersion(admin);
        users.save(admin);
        log.info("[super-admin bootstrap] Development administrator login created.");
    }

    private static void setNewVersion(User admin) {
        admin.setBootstrapCredentialVersion(UUID.randomUUID());
        admin.setUpdatedAt(Instant.now());
    }

    private static String email(Environment env, String key) {
        return env.getProperty(key, "").strip().toLowerCase(Locale.ROOT);
    }

    private static boolean validEmail(String value) {
        return value.length() <= 254 && EMAIL.matcher(value).matches();
    }

    private static boolean validPassword(String value) {
        int bytes = value.getBytes(StandardCharsets.UTF_8).length;
        return value.codePointCount(0, value.length()) >= 16 && bytes <= 72 && !value.isBlank();
    }
}
