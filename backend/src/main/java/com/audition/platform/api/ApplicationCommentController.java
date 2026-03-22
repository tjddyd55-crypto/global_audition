package com.audition.platform.api;

import com.audition.platform.api.dto.ApiEnvelope;
import com.audition.platform.api.dto.ApplicationCommentDto;
import com.audition.platform.api.dto.CreateApplicationCommentRequest;
import com.audition.platform.application.publicmedia.ApplicationCommentService;
import com.audition.platform.infra.SecurityUtils;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class ApplicationCommentController {

    private final ApplicationCommentService applicationCommentService;

    public ApplicationCommentController(ApplicationCommentService applicationCommentService) {
        this.applicationCommentService = applicationCommentService;
    }

    @GetMapping("/comments")
    public ApiEnvelope<List<ApplicationCommentDto>> list(
            @RequestParam("applicationId") String applicationIdRaw) {
        UUID applicationId = parseUuid(applicationIdRaw, "applicationId");
        return ApiEnvelope.ok(applicationCommentService.listByApplication(applicationId));
    }

    @PostMapping("/comments")
    public ApiEnvelope<ApplicationCommentDto> create(@Valid @RequestBody CreateApplicationCommentRequest body) {
        UUID userId = requireUserId();
        UUID applicationId = parseUuid(body.getApplicationId(), "applicationId");
        return ApiEnvelope.ok(applicationCommentService.create(userId, applicationId, body.getContent()));
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
