package com.audition.platform.presentation.controller;

import com.audition.platform.application.dto.AuditionOfferDto;
import com.audition.platform.application.dto.CreateOfferRequest;
import com.audition.platform.application.dto.RespondOfferRequest;
import com.audition.platform.application.service.AuditionOfferService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/offers")
@RequiredArgsConstructor
@Tag(name = "Audition Offers", description = "오디션 제안 관리 API")
public class AuditionOfferController {

    private final AuditionOfferService offerService;

    @GetMapping("/users/{userId}")
    @Operation(summary = "지망생이 받은 제안 목록")
    public ResponseEntity<Page<AuditionOfferDto>> getUserOffers(
            @PathVariable Long userId,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Page<AuditionOfferDto> offers = offerService.getUserOffers(userId, pageable);
        return ResponseEntity.ok(offers);
    }

    @GetMapping("/business/{businessId}")
    @Operation(summary = "기획사가 보낸 제안 목록")
    public ResponseEntity<Page<AuditionOfferDto>> getBusinessOffers(
            @PathVariable Long businessId,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Page<AuditionOfferDto> offers = offerService.getBusinessOffers(businessId, pageable);
        return ResponseEntity.ok(offers);
    }

    @GetMapping("/{id}")
    @Operation(summary = "제안 상세 조회")
    public ResponseEntity<AuditionOfferDto> getOffer(@PathVariable Long id) {
        AuditionOfferDto offer = offerService.getOffer(id);
        return ResponseEntity.ok(offer);
    }

    @PostMapping
    @Operation(summary = "오디션 제안 생성", description = "기획사가 지망생의 영상을 보고 오디션 제안")
    public ResponseEntity<AuditionOfferDto> createOffer(
            @RequestBody @Valid CreateOfferRequest request
    ) {
        Long businessId = 1L; // TODO: 실제 기획사 ID로 변경 (인증에서 가져오기)
        AuditionOfferDto created = offerService.createOffer(businessId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}/respond")
    @Operation(summary = "제안 응답", description = "지망생이 제안을 수락/거절")
    public ResponseEntity<AuditionOfferDto> respondToOffer(
            @PathVariable Long id,
            @RequestBody @Valid RespondOfferRequest request
    ) {
        Long userId = 1L; // TODO: 실제 사용자 ID로 변경
        AuditionOfferDto updated = offerService.respondToOffer(id, userId, request);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/{id}/read")
    @Operation(summary = "제안 읽음 처리")
    public ResponseEntity<AuditionOfferDto> markAsRead(@PathVariable Long id) {
        Long userId = 1L; // TODO: 실제 사용자 ID로 변경
        AuditionOfferDto updated = offerService.markAsRead(id, userId);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/users/{userId}/pending-count")
    @Operation(summary = "대기 중인 제안 개수")
    public ResponseEntity<Map<String, Long>> getPendingCount(@PathVariable Long userId) {
        Long count = offerService.countPendingOffers(userId);
        return ResponseEntity.ok(Map.of("count", count));
    }
}
