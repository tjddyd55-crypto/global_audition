package com.audition.platform.api;

import com.audition.platform.application.casting.CastingAdminService;
import com.audition.platform.application.casting.CastingSafetyStore;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/** 본사(슈퍼) 관리자: 채널·캐스팅 운영. 모든 변경은 감사 로그. */
@RestController
@RequestMapping("/api/admin/casting")
public class SuperAdminCastingController {

    private final CastingAdminService admin;

    public SuperAdminCastingController(CastingAdminService admin) {
        this.admin = admin;
    }

    @GetMapping("/stats")
    public CastingAdminService.Stats stats() {
        return admin.stats();
    }

    @GetMapping("/reports")
    public List<CastingAdminService.ReportView> reports(@RequestParam(required = false) String status) {
        return admin.reports(status);
    }

    public record ResolveBody(String status, String note, Boolean restrictAgency) {
    }

    @PostMapping("/reports/{id}/resolve")
    public Map<String, Boolean> resolve(@PathVariable UUID id, @RequestBody ResolveBody body) {
        admin.resolveReport(id, body.status(), body.note(), Boolean.TRUE.equals(body.restrictAgency()));
        return Map.of("ok", true);
    }

    @GetMapping("/agencies")
    public List<CastingAdminService.AgencyControlView> agencies() {
        return admin.agencies();
    }

    public record ControlBody(Boolean restricted, String reason, Integer dailyLimit) {
    }

    @PutMapping("/agencies/{agencyUserId}/control")
    public CastingSafetyStore.Control control(@PathVariable UUID agencyUserId, @RequestBody ControlBody body) {
        return admin.setControl(agencyUserId, Boolean.TRUE.equals(body.restricted()), body.reason(), body.dailyLimit());
    }

    @GetMapping("/channels")
    public List<CastingAdminService.ModerationChannel> channels(@RequestParam(required = false) String q) {
        return admin.channels(q);
    }

    @GetMapping("/channels/{userId}/videos")
    public List<CastingAdminService.ModerationVideo> videos(@PathVariable UUID userId) {
        return admin.channelVideos(userId);
    }

    public record HideBody(Boolean hidden, String reason) {
    }

    @PostMapping("/channels/{userId}/moderation")
    public Map<String, Boolean> moderateChannel(@PathVariable UUID userId, @RequestBody HideBody body) {
        admin.moderateChannel(userId, Boolean.TRUE.equals(body.hidden()), body.reason());
        return Map.of("ok", true);
    }

    @PostMapping("/videos/{videoId}/moderation")
    public Map<String, Boolean> moderateVideo(@PathVariable UUID videoId, @RequestBody HideBody body) {
        admin.moderateVideo(videoId, Boolean.TRUE.equals(body.hidden()), body.reason());
        return Map.of("ok", true);
    }
}
