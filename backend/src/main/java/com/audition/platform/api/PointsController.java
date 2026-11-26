package com.audition.platform.api;

import com.audition.platform.application.credit.SuperAdminAuthHelper;
import com.audition.platform.application.points.PointPolicies;
import com.audition.platform.application.points.PointRewards;
import com.audition.platform.application.points.PointWallet;
import com.audition.platform.application.points.PointsService;
import com.audition.platform.infra.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class PointsController {
    private final PointsService points;
    private final PointPolicies policies;
    private final PointRewards rewards;
    private final PointWallet wallets;

    public PointsController(PointsService points, PointPolicies policies, PointRewards rewards, PointWallet wallets) {
        this.points=points;
        this.policies=policies;
        this.rewards=rewards;
        this.wallets=wallets;
    }

    @GetMapping("/me/points")
    public PointsService.Dashboard dashboard() { return points.dashboard(member()); }

    @GetMapping("/me/points/application-quote")
    public PointsService.Quote quote() { return points.quote(member()); }

    @GetMapping("/me/points/entries")
    public List<PointWallet.Entry> meEntries(@RequestParam(defaultValue="0") int page) {
        return wallets.entries(member(),page);
    }

    @PostMapping("/me/points/check-in")
    public PointsService.Dashboard checkIn() {
        UUID member=member();
        rewards.checkIn(member);
        points.confirmReferral(member);
        return points.dashboard(member);
    }

    @PostMapping("/me/points/invite-code")
    public Map<String,UUID> inviteCode() { return Map.of("code",points.inviteCode(member())); }

    @PostMapping("/me/points/confirm-invitation")
    public PointsService.Dashboard confirmInvitation() {
        UUID member=member();
        points.confirmReferral(member);
        return points.dashboard(member);
    }

    @GetMapping("/admin/points/settings")
    public PointPolicies.Settings settings() {
        SuperAdminAuthHelper.requireSuperAdmin();
        return policies.settings();
    }

    @PutMapping("/admin/points/settings")
    public PointPolicies.Settings settings(@RequestBody PointPolicies.Settings change) {
        return policies.updateSettings(change);
    }

    @GetMapping("/admin/points/policies")
    public List<PointPolicies.Rule> policies() { return policies.rules(); }

    @PutMapping("/admin/points/policies")
    public PointPolicies.Rule savePolicy(@RequestBody PointPolicies.Rule change) { return policies.updateRule(change); }

    @GetMapping("/admin/points/history")
    public List<PointPolicies.Change> history(@RequestParam(defaultValue="0") int page) { return policies.history(page); }

    @GetMapping("/admin/points/members/{id}")
    public PointsService.Member member(@PathVariable UUID id) { return points.member(id); }

    @GetMapping("/admin/points/entries")
    public List<PointWallet.Entry> adminEntries(@RequestParam(required=false) UUID userId,
                                               @RequestParam(defaultValue="0") int page) {
        SuperAdminAuthHelper.requireSuperAdmin();
        return wallets.entries(userId,page);
    }

    @PostMapping("/admin/points/adjustments")
    public PointsService.Member adjust(@RequestBody PointsService.Adjustment adjustment) {
        return points.adjust(adjustment);
    }

    @GetMapping("/admin/points/statistics")
    public Map<String,Object> stats() { return points.stats(); }

    private static UUID member() {
        UUID id=SecurityUtils.getCurrentUserId();
        if (id==null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        return id;
    }
}
