package com.audition.platform.api;

import com.audition.platform.api.dto.ApiEnvelope;
import com.audition.platform.api.dto.channel.PublicChannelResponse;
import com.audition.platform.application.me.MyChannelService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/channels")
public class PublicChannelController {

    private final MyChannelService myChannelService;

    public PublicChannelController(MyChannelService myChannelService) {
        this.myChannelService = myChannelService;
    }

    @GetMapping("/{userId}")
    public ApiEnvelope<PublicChannelResponse> getPublicChannel(@PathVariable UUID userId) {
        return ApiEnvelope.ok(myChannelService.getPublicChannelByUserId(userId));
    }
}
