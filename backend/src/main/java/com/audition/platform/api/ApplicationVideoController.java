package com.audition.platform.api;

import com.audition.platform.api.dto.ApplicationVideoResponse;
import com.audition.platform.api.dto.CreateApplicationVideoRequest;
import com.audition.platform.application.ApplicationVideoService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class ApplicationVideoController {
    private final ApplicationVideoService applicationVideoService;

    public ApplicationVideoController(ApplicationVideoService applicationVideoService) {
        this.applicationVideoService = applicationVideoService;
    }

    @PostMapping("/applications/{id}/videos")
    public ApplicationVideoResponse create(@PathVariable UUID id, @Valid @RequestBody CreateApplicationVideoRequest request) {
        return applicationVideoService.create(id, request);
    }

    @GetMapping("/applications/{id}/videos")
    public List<ApplicationVideoResponse> list(@PathVariable UUID id) {
        return applicationVideoService.list(id);
    }

    @DeleteMapping("/application-videos/{videoId}")
    public void delete(@PathVariable UUID videoId) {
        applicationVideoService.delete(videoId);
    }
}
