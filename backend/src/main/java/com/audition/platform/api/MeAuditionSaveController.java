package com.audition.platform.api;

import com.audition.platform.api.dto.ApiEnvelope;
import com.audition.platform.api.dto.saves.AuditionSaveIdsResponse;
import com.audition.platform.api.dto.saves.AuditionSaveItemResponse;
import com.audition.platform.application.saves.AuditionSaveService;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/me/audition-saves")
public class MeAuditionSaveController {

    private final AuditionSaveService saves;

    public MeAuditionSaveController(AuditionSaveService saves) {
        this.saves = saves;
    }

    @GetMapping
    public ApiEnvelope<List<AuditionSaveItemResponse>> list() {
        return ApiEnvelope.ok(saves.list());
    }

    @GetMapping("/ids")
    public ApiEnvelope<AuditionSaveIdsResponse> ids() {
        return ApiEnvelope.ok(saves.ids());
    }

    @PutMapping("/{auditionId}")
    public ApiEnvelope<AuditionSaveItemResponse> save(@PathVariable UUID auditionId) {
        return ApiEnvelope.ok(saves.save(auditionId));
    }

    @DeleteMapping("/{auditionId}")
    public ApiEnvelope<Boolean> unsave(@PathVariable UUID auditionId) {
        saves.unsave(auditionId);
        return ApiEnvelope.ok(true);
    }
}
