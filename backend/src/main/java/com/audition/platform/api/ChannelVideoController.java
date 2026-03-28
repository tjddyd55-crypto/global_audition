package com.audition.platform.api;

import com.audition.platform.api.dto.ApiEnvelope;
import com.audition.platform.api.dto.channel.PatchVideoVisibilityRequest;
import com.audition.platform.api.dto.me.MyChannelVideoDto;
import com.audition.platform.api.dto.me.PatchMyChannelVideoRequest;
import com.audition.platform.application.me.MyChannelService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/videos")
public class ChannelVideoController {

    private final MyChannelService myChannelService;

    public ChannelVideoController(MyChannelService myChannelService) {
        this.myChannelService = myChannelService;
    }

    @PatchMapping("/{videoId}")
    public ApiEnvelope<MyChannelVideoDto> patchVisibility(
            @PathVariable UUID videoId,
            @Valid @RequestBody PatchVideoVisibilityRequest body) {
        PatchMyChannelVideoRequest req = new PatchMyChannelVideoRequest();
        req.setVisibility(body.getVisibility());
        return ApiEnvelope.ok(myChannelService.patchVideo(videoId, req));
    }
}
