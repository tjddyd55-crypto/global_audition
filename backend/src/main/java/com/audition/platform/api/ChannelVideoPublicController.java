package com.audition.platform.api;

import com.audition.platform.api.dto.ApiEnvelope;
import com.audition.platform.api.dto.channel.ChannelVideoCommentDto;
import com.audition.platform.api.dto.channel.ChannelVideoReactionResponse;
import com.audition.platform.api.dto.channel.ChannelVideoViewBumpResult;
import com.audition.platform.api.dto.channel.PostChannelVideoCommentRequest;
import com.audition.platform.api.dto.channel.PublicChannelVideoDetailDto;
import com.audition.platform.api.dto.channel.PublicChannelVideoSummaryDto;
import com.audition.platform.application.channel.ChannelVideoPublicService;
import com.audition.platform.infra.ClientIpResolver;
import com.audition.platform.infra.SecurityUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/videos")
public class ChannelVideoPublicController {

    private final ChannelVideoPublicService channelVideoPublicService;

    public ChannelVideoPublicController(ChannelVideoPublicService channelVideoPublicService) {
        this.channelVideoPublicService = channelVideoPublicService;
    }

    @GetMapping
    public ApiEnvelope<List<PublicChannelVideoSummaryDto>> listByCategory(
            @RequestParam String category,
            @RequestParam UUID exclude) {
        return ApiEnvelope.ok(channelVideoPublicService.listPublicByCategory(category, exclude));
    }

    @GetMapping("/{videoId}/public")
    public ApiEnvelope<PublicChannelVideoDetailDto> getPublic(@PathVariable UUID videoId) {
        return ApiEnvelope.ok(channelVideoPublicService.getPublicDetail(videoId, SecurityUtils.getCurrentUserId()));
    }

    @PostMapping("/{videoId}/view")
    public ApiEnvelope<ChannelVideoViewBumpResult> bumpView(
            @PathVariable UUID videoId,
            HttpServletRequest request) {
        return ApiEnvelope.ok(channelVideoPublicService.bumpView(
                videoId, SecurityUtils.getCurrentUserId(), ClientIpResolver.resolve(request)));
    }

    @GetMapping("/{videoId}/comments")
    public ApiEnvelope<List<ChannelVideoCommentDto>> listComments(@PathVariable UUID videoId) {
        return ApiEnvelope.ok(channelVideoPublicService.listComments(videoId, SecurityUtils.getCurrentUserId()));
    }

    @PostMapping("/{videoId}/comments")
    public ApiEnvelope<ChannelVideoCommentDto> postComment(
            @PathVariable UUID videoId,
            @Valid @RequestBody PostChannelVideoCommentRequest body) {
        return ApiEnvelope.ok(
                channelVideoPublicService.postComment(videoId, SecurityUtils.getCurrentUserId(), body.getContent()));
    }

    @PostMapping("/{videoId}/like")
    public ApiEnvelope<ChannelVideoReactionResponse> like(@PathVariable UUID videoId) {
        return ApiEnvelope.ok(channelVideoPublicService.toggleLike(videoId, SecurityUtils.getCurrentUserId()));
    }

    @PostMapping("/{videoId}/dislike")
    public ApiEnvelope<ChannelVideoReactionResponse> dislike(@PathVariable UUID videoId) {
        return ApiEnvelope.ok(channelVideoPublicService.toggleDislike(videoId, SecurityUtils.getCurrentUserId()));
    }
}
