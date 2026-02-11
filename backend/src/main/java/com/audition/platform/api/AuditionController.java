package com.audition.platform.api;

import com.audition.platform.api.dto.AuditionResponse;
import com.audition.platform.api.dto.CreateAuditionRequest;
import com.audition.platform.application.AuditionService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/auditions")
public class AuditionController {

    private final AuditionService auditionService;

    public AuditionController(AuditionService auditionService) {
        this.auditionService = auditionService;
    }

    @PostMapping
    public AuditionResponse create(@Valid @RequestBody CreateAuditionRequest request) {
        return auditionService.create(request);
    }

    @GetMapping
    public List<AuditionResponse> list() {
        return auditionService.list();
    }

    @GetMapping("/mine")
    public List<AuditionResponse> listMine() {
        return auditionService.listMine();
    }

    @GetMapping("/{id}")
    public AuditionResponse getById(@PathVariable UUID id) {
        return auditionService.getById(id);
    }
}
