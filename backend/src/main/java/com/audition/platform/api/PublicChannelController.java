package com.audition.platform.api;

import com.audition.platform.api.dto.ApiEnvelope;
import com.audition.platform.api.dto.channel.PublicChannelListItemResponse;
import com.audition.platform.api.dto.channel.PublicChannelResponse;
import com.audition.platform.application.me.MyChannelService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/channels")
public class PublicChannelController {

    private final MyChannelService myChannelService;

    public PublicChannelController(MyChannelService myChannelService) {
        this.myChannelService = myChannelService;
    }

    @GetMapping("/public")
    public ApiEnvelope<List<PublicChannelListItemResponse>> listPublicChannels(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String country,
            @RequestParam(required = false) String category) {
        return ApiEnvelope.ok(myChannelService.listPublicChannelsForDiscovery(q, country, category));
    }

    @GetMapping("/{userId}")
    public ApiEnvelope<PublicChannelResponse> getPublicChannel(@PathVariable UUID userId) {
        return ApiEnvelope.ok(myChannelService.getPublicChannelByUserId(userId));
    }
}
