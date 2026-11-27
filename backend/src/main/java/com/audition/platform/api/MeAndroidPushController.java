package com.audition.platform.api;

import com.audition.platform.application.notifications.AndroidPushInstallations;
import com.audition.platform.infra.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@RestController
@RequestMapping("/api/me/android-push/installations")
public class MeAndroidPushController {
    private final AndroidPushInstallations installations;

    public MeAndroidPushController(AndroidPushInstallations installations) {
        this.installations = installations;
    }

    @PutMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void attach(@PathVariable UUID id, @RequestBody Registration registration) {
        installations.attach(userId(), id, registration.token(), registration.locale());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void detach(@PathVariable UUID id) {
        installations.detach(userId(), id);
    }

    private static UUID userId() {
        UUID id = SecurityUtils.getCurrentUserId();
        if (id == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        return id;
    }

    public record Registration(String token, String locale) {}
}
