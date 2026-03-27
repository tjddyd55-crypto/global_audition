package com.audition.platform.api;

import com.audition.platform.api.dto.TagCreateRequest;
import com.audition.platform.api.dto.TagPatchRequest;
import com.audition.platform.api.dto.TagResponse;
import com.audition.platform.application.tag.AdminTagService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/tags")
public class AdminTagController {

    private final AdminTagService adminTagService;

    public AdminTagController(AdminTagService adminTagService) {
        this.adminTagService = adminTagService;
    }

    @GetMapping
    public List<TagResponse> list() {
        return adminTagService.listAll();
    }

    @PostMapping
    public TagResponse create(@Valid @RequestBody TagCreateRequest request) {
        return adminTagService.create(request);
    }

    @PatchMapping("/{id}")
    public TagResponse patch(@PathVariable UUID id, @Valid @RequestBody TagPatchRequest request) {
        return adminTagService.patch(id, request);
    }

    /**
     * 비활성화(소프트). 참조 중인 오디션은 FK 제약으로 물리 삭제 불가.
     */
    @DeleteMapping("/{id}")
    public void deactivate(@PathVariable UUID id) {
        adminTagService.deactivate(id);
    }
}
