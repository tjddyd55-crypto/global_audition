package com.audition.platform.api;

import com.audition.platform.api.dto.ApiEnvelope;
import com.audition.platform.api.dto.channel.ChannelSubscribeRequest;
import com.audition.platform.api.dto.channel.ChannelSubscribeStateDto;
import com.audition.platform.application.channel.ChannelSubscriptionService;
import com.audition.platform.infra.SecurityUtils;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/subscribe")
public class ChannelSubscribeController {

    private final ChannelSubscriptionService channelSubscriptionService;

    public ChannelSubscribeController(ChannelSubscriptionService channelSubscriptionService) {
        this.channelSubscriptionService = channelSubscriptionService;
    }

    @PostMapping
    public ApiEnvelope<ChannelSubscribeStateDto> subscribe(@Valid @RequestBody ChannelSubscribeRequest body) {
        return ApiEnvelope.ok(
                channelSubscriptionService.subscribe(SecurityUtils.getCurrentUserId(), body.getChannelOwnerId()));
    }

    @DeleteMapping
    public ApiEnvelope<ChannelSubscribeStateDto> unsubscribe(@Valid @RequestBody ChannelSubscribeRequest body) {
        return ApiEnvelope.ok(
                channelSubscriptionService.unsubscribe(SecurityUtils.getCurrentUserId(), body.getChannelOwnerId()));
    }
}
