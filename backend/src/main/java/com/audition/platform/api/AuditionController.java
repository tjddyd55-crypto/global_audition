package com.audition.platform.api;

import com.audition.platform.api.dto.AuditionResponse;
import com.audition.platform.api.dto.CreateAuditionRequest;
import com.audition.platform.api.dto.UpdateAuditionRequest;
import com.audition.platform.application.AuditionService;
import com.audition.platform.infra.SecurityUtils;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

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
    public List<AuditionResponse> list(@RequestParam(value = "status", required = false) String status) {
        if (status == null || status.isBlank() || "OPEN".equals(status)) {
            return auditionService.listOpen();
        }
        if (!SecurityUtils.hasRole("AGENCY") && !SecurityUtils.hasRole("ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only AGENCY or ADMIN can query non-open auditions");
        }
        return auditionService.listByStatus(status);
    }

    @GetMapping("/my")
    public List<AuditionResponse> listMy() {
        return auditionService.listMine();
    }

    @GetMapping("/mine")
    public List<AuditionResponse> listMineLegacy() {
        return auditionService.listMine();
    }

    @GetMapping("/{id}")
    public AuditionResponse getById(@PathVariable UUID id) {
        return auditionService.getById(id);
    }

    @PatchMapping("/{id}")
    public AuditionResponse update(@PathVariable UUID id, @Valid @RequestBody UpdateAuditionRequest request) {
        return auditionService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        auditionService.delete(id);
    }
}
