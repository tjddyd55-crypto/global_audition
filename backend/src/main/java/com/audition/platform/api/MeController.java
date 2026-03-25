package com.audition.platform.api;

import com.audition.platform.api.dto.ApiEnvelope;
import com.audition.platform.api.dto.me.*;
import com.audition.platform.application.me.MeApplicationRoundService;
import com.audition.platform.application.me.MeApplicationService;
import com.audition.platform.application.me.MeDashboardService;
import com.audition.platform.application.me.MeProfileService;
import com.audition.platform.application.me.MeVaultService;
import com.audition.platform.application.me.MyChannelService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api/me")
public class MeController {

    private final MeProfileService meProfileService;
    private final MeDashboardService meDashboardService;
    private final MeApplicationService meApplicationService;
    private final MyChannelService myChannelService;
    private final MeVaultService meVaultService;
    private final MeApplicationRoundService meApplicationRoundService;

    public MeController(MeProfileService meProfileService,
                        MeDashboardService meDashboardService,
                        MeApplicationService meApplicationService,
                        MyChannelService myChannelService,
                        MeVaultService meVaultService,
                        MeApplicationRoundService meApplicationRoundService) {
        this.meProfileService = meProfileService;
        this.meDashboardService = meDashboardService;
        this.meApplicationService = meApplicationService;
        this.myChannelService = myChannelService;
        this.meVaultService = meVaultService;
        this.meApplicationRoundService = meApplicationRoundService;
    }

    @GetMapping("/profile")
    public ApiEnvelope<MeProfileResponse> profile() {
        return ApiEnvelope.ok(meProfileService.getProfile());
    }

    @PatchMapping("/profile")
    public ApiEnvelope<MeProfileResponse> patchProfile(@Valid @RequestBody PatchMeProfileRequest req) {
        return ApiEnvelope.ok(meProfileService.patchProfile(req));
    }

    @GetMapping("/dashboard")
    public ApiEnvelope<MeDashboardResponse> dashboard() {
        return ApiEnvelope.ok(meDashboardService.getDashboard());
    }

    @GetMapping("/applications")
    public ApiEnvelope<MyApplicationsPageDto> applications() {
        return ApiEnvelope.ok(meApplicationService.listApplications());
    }

    @GetMapping("/applications/{applicationId}")
    public ApiEnvelope<MyApplicationDetailDto> applicationDetail(@PathVariable UUID applicationId) {
        return ApiEnvelope.ok(meApplicationService.getApplication(applicationId));
    }

    @GetMapping("/applications/{applicationId}/rounds/{roundId}/eligibility")
    public ApiEnvelope<MeRoundEligibilityDto> roundEligibility(
            @PathVariable UUID applicationId,
            @PathVariable UUID roundId) {
        return ApiEnvelope.ok(meApplicationRoundService.getEligibility(applicationId, roundId));
    }

    @PostMapping("/applications/{applicationId}/rounds/{roundId}/submit")
    public ApiEnvelope<MeRoundSubmitResponseDto> roundSubmit(
            @PathVariable UUID applicationId,
            @PathVariable UUID roundId,
            @Valid @RequestBody MeRoundSubmitRequest req) {
        return ApiEnvelope.ok(meApplicationRoundService.submit(applicationId, roundId, req));
    }

    @PostMapping("/applications/{applicationId}/videos")
    public ApiEnvelope<ApplicationVideoDto> addApplicationVideo(
            @PathVariable UUID applicationId,
            @Valid @RequestBody CreateMeApplicationVideoRequest req) {
        return ApiEnvelope.ok(meApplicationService.addVideo(applicationId, req));
    }

    @DeleteMapping("/applications/{applicationId}/videos/{videoId}")
    public ApiEnvelope<Boolean> deleteApplicationVideo(
            @PathVariable UUID applicationId,
            @PathVariable UUID videoId) {
        return ApiEnvelope.ok(meApplicationService.deleteVideo(applicationId, videoId));
    }

    @GetMapping("/channel")
    public ApiEnvelope<MyChannelResponse> channel() {
        return ApiEnvelope.ok(myChannelService.getChannel());
    }

    @PatchMapping("/channel")
    public ApiEnvelope<MyChannelResponse> patchChannel(@Valid @RequestBody PatchMyChannelRequest req) {
        return ApiEnvelope.ok(myChannelService.patchChannel(req));
    }

    @GetMapping("/channel/videos")
    public ApiEnvelope<MyChannelVideosPageDto> channelVideos() {
        return ApiEnvelope.ok(myChannelService.listVideos());
    }

    @PostMapping("/channel/videos")
    public ApiEnvelope<MyChannelVideoDto> createChannelVideo(@Valid @RequestBody CreateMyChannelVideoRequest req) {
        return ApiEnvelope.ok(myChannelService.createVideo(req));
    }

    @PatchMapping("/channel/videos/{videoId}")
    public ApiEnvelope<MyChannelVideoDto> patchChannelVideo(
            @PathVariable UUID videoId,
            @Valid @RequestBody PatchMyChannelVideoRequest req) {
        return ApiEnvelope.ok(myChannelService.patchVideo(videoId, req));
    }

    @DeleteMapping("/channel/videos/{videoId}")
    public ApiEnvelope<Boolean> deleteChannelVideo(@PathVariable UUID videoId) {
        myChannelService.deleteVideo(videoId);
        return ApiEnvelope.ok(true);
    }

    @GetMapping("/vault")
    public ApiEnvelope<VaultItemsPageDto> vaultList() {
        return ApiEnvelope.ok(meVaultService.list());
    }

    @GetMapping("/vault/{vaultItemId}")
    public ApiEnvelope<VaultItemDetailDto> vaultDetail(@PathVariable UUID vaultItemId) {
        return ApiEnvelope.ok(meVaultService.getDetail(vaultItemId));
    }

    @PostMapping(value = "/vault", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiEnvelope<VaultItemDetailDto> vaultCreateMultipart(
            @RequestParam("title") String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam("assetType") String assetType,
            @RequestParam(value = "declaredCreationType", required = false) String declaredCreationType,
            @RequestParam("accessControl") String accessControl,
            @RequestPart(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "textContent", required = false) String textContent) {
        return ApiEnvelope.ok(meVaultService.createMultipart(
                title, description, assetType, declaredCreationType, accessControl, file, textContent));
    }

    @PatchMapping("/vault/{vaultItemId}")
    public ApiEnvelope<VaultItemDetailDto> vaultPatch(
            @PathVariable UUID vaultItemId,
            @Valid @RequestBody PatchVaultItemRequest req) {
        return ApiEnvelope.ok(meVaultService.patch(vaultItemId, req));
    }

    @DeleteMapping("/vault/{vaultItemId}")
    public ApiEnvelope<Boolean> vaultDelete(@PathVariable UUID vaultItemId) {
        meVaultService.delete(vaultItemId);
        return ApiEnvelope.ok(true);
    }
}
