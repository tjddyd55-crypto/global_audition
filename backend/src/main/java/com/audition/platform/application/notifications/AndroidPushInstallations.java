package com.audition.platform.application.notifications;

import com.audition.platform.application.i18n.ContentLocales;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;
import java.util.regex.Pattern;

@Service
public class AndroidPushInstallations {
    private static final Pattern EXPO_TOKEN = Pattern.compile("(Expo|Exponent)PushToken\\[[A-Za-z0-9_-]{10,120}\\]");
    private final JdbcTemplate jdbc;

    public AndroidPushInstallations(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void attach(UUID userId, UUID id, String token, String rawLocale) {
        if (token == null || !EXPO_TOKEN.matcher(token).matches()) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "INVALID_ANDROID_PUSH_TOKEN");
        }
        String locale = ContentLocales.normalize(rawLocale);
        try {
            jdbc.update("""
                    INSERT INTO android_push_installations (id, user_id, expo_token, locale)
                    VALUES (?, ?, ?, ?)
                    ON CONFLICT (id) DO UPDATE SET
                        registered_at = CASE
                            WHEN android_push_installations.user_id = EXCLUDED.user_id AND android_push_installations.active
                            THEN android_push_installations.registered_at ELSE NOW() END,
                        user_id = EXCLUDED.user_id, expo_token = EXCLUDED.expo_token,
                        locale = EXCLUDED.locale, refreshed_at = NOW(), active = TRUE
                    """, id, userId, token, locale);
        } catch (DuplicateKeyException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "ANDROID_PUSH_TOKEN_IN_USE");
        }
    }

    public void detach(UUID userId, UUID id) {
        jdbc.update("UPDATE android_push_installations SET active=FALSE WHERE id=? AND user_id=?", id, userId);
    }
}
