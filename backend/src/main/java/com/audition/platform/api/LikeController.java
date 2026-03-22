package com.audition.platform.api;

import com.audition.platform.api.dto.ApiEnvelope;
import com.audition.platform.api.dto.LikeApplicationRequest;
import com.audition.platform.api.dto.LikeToggleResultDto;
import com.audition.platform.application.publicmedia.ApplicationLikeService;
import com.audition.platform.infra.SecurityUtils;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@RestController
@RequestMapping("/api")
public class LikeController {

    private final ApplicationLikeService applicationLikeService;

    public LikeController(ApplicationLikeService applicationLikeService) {
        this.applicationLikeService = applicationLikeService;
    }

    @PostMapping("/likes")
    public ApiEnvelope<LikeToggleResultDto> addLike(@Valid @RequestBody LikeApplicationRequest body) {
        UUID userId = requireUserId();
        UUID applicationId = parseUuid(body.getApplicationId(), "applicationId");
        return ApiEnvelope.ok(applicationLikeService.addLike(userId, applicationId));
    }

    @DeleteMapping("/likes/{applicationId}")
    public ApiEnvelope<LikeToggleResultDto> removeLike(@PathVariable UUID applicationId) {
        UUID userId = requireUserId();
        return ApiEnvelope.ok(applicationLikeService.removeLike(userId, applicationId));
    }

    private static UUID requireUserId() {
        UUID id = SecurityUtils.getCurrentUserId();
        if (id == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        return id;
    }

    private static UUID parseUuid(String raw, String field) {
        try {
            return UUID.fromString(raw.trim());
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "유효하지 않은 " + field + "입니다.");
        }
    }
}
