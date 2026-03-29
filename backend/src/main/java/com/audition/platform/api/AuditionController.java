package com.audition.platform.api;

import com.audition.platform.api.dto.ApiFailResponse;
import com.audition.platform.api.dto.AuditionResponse;
import com.audition.platform.api.dto.CreateAuditionRequest;
import com.audition.platform.api.dto.UpdateAuditionRequest;
import com.audition.platform.application.AuditionService;
import com.audition.platform.infra.SecurityUtils;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/auditions")
public class AuditionController {

    private static final Logger log = LoggerFactory.getLogger(AuditionController.class);

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
    public ResponseEntity<?> getById(@PathVariable UUID id) {
        try {
            return ResponseEntity.ok(auditionService.getById(id));
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("AUDITION DETAIL ERROR:", ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiFailResponse("오디션 상세 조회 실패"));
        }
    }

    @PatchMapping("/{id}")
    public AuditionResponse update(@PathVariable UUID id, @Valid @RequestBody UpdateAuditionRequest request) {
        return auditionService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        auditionService.delete(id);
    }

    /** 기획사·관리자: 동일 group_id 로 다음 시리즈 차수 공고 생성(DRAFT). */
    @PostMapping("/{id}/series/next-round")
    public AuditionResponse createNextSeriesRound(@PathVariable UUID id) {
        return auditionService.createNextSeriesRound(id);
    }
}
