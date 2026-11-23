package com.audition.platform.api;

import com.audition.platform.api.dto.ApiEnvelope;
import com.audition.platform.api.dto.me.NotificationSettingsResponse;
import com.audition.platform.application.notifications.NotificationSettings;
import com.audition.platform.application.notifications.NotificationSettingsService;
import com.audition.platform.infra.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@RestController
@RequestMapping("/api/me/notification-settings")
public class MeNotificationSettingsController {

    private final NotificationSettingsService settings;

    public MeNotificationSettingsController(NotificationSettingsService settings) {
        this.settings = settings;
    }

    @GetMapping
    public ApiEnvelope<NotificationSettingsResponse> get() {
        return ApiEnvelope.ok(toDto(settings.get(currentUserId())));
    }

    @PutMapping
    public ApiEnvelope<NotificationSettingsResponse> put(@RequestBody NotificationSettingsResponse body) {
        NotificationSettings saved = settings.upsert(currentUserId(),
                body == null ? NotificationSettings.defaults()
                        : new NotificationSettings(body.isSavedDeadline(), body.isNewMatch(), body.isResults(), body.isOffers()));
        return ApiEnvelope.ok(toDto(saved));
    }

    private static UUID currentUserId() {
        UUID userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        return userId;
    }

    private static NotificationSettingsResponse toDto(NotificationSettings settings) {
        NotificationSettingsResponse dto = new NotificationSettingsResponse();
        dto.setSavedDeadline(settings.savedDeadline());
        dto.setNewMatch(settings.newMatch());
        dto.setResults(settings.results());
        dto.setOffers(settings.offers());
        return dto;
    }
}
