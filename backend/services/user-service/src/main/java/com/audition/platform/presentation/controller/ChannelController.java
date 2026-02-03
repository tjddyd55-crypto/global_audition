package com.audition.platform.presentation.controller;

import com.audition.platform.application.dto.ChannelProfileDto;
import com.audition.platform.application.dto.UpdateChannelProfileRequest;
import com.audition.platform.application.service.ChannelService;
import com.audition.platform.infrastructure.security.AuthHeaderUserResolver;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/channels")
@RequiredArgsConstructor
@Tag(name = "Channels", description = "지원자 채널 API")
public class ChannelController {

    private final ChannelService channelService;
    private final AuthHeaderUserResolver authHeaderUserResolver;

    @GetMapping("/{userId}")
    @Operation(summary = "채널 프로필 조회", description = "지원자 채널 프로필 공개 조회")
    public ResponseEntity<ChannelProfileDto> getChannel(
            @PathVariable Long userId,
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        Long requesterId = authHeaderUserResolver.getUserIdFromAuthHeader(authHeader);
        ChannelProfileDto profile = channelService.getChannelProfile(userId, requesterId);
        return ResponseEntity.ok(profile);
    }

    @PutMapping("/me")
    @Operation(summary = "내 채널 프로필 수정", description = "지원자 채널 프로필 수정")
    public ResponseEntity<ChannelProfileDto> updateMyChannel(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody @Valid UpdateChannelProfileRequest request
    ) {
        Long userId = authHeaderUserResolver.getUserIdFromAuthHeaderOrThrow(authHeader);
        ChannelProfileDto updated = channelService.updateMyChannelProfile(userId, request);
        return ResponseEntity.ok(updated);
    }
}

