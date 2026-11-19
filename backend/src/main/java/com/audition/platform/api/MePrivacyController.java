package com.audition.platform.api;

import com.audition.platform.application.consent.GuardianService;
import com.audition.platform.application.consent.PrivacySettingsService;
import com.audition.platform.infra.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.UUID;

/** 마이프로필 '개인정보 및 공개 설정' + 동의 + 보호자 확인 링크(회원 본인). */
@RestController
@RequestMapping("/api/me")
public class MePrivacyController {

    private final PrivacySettingsService privacy;
    private final GuardianService guardians;

    public MePrivacyController(PrivacySettingsService privacy, GuardianService guardians) {
        this.privacy = privacy;
        this.guardians = guardians;
    }

    @GetMapping("/privacy")
    public PrivacySettingsService.Settings get() {
        return privacy.get();
    }

    @PutMapping("/privacy")
    public PrivacySettingsService.Settings put(@RequestBody PrivacySettingsService.Patch body) {
        return privacy.patch(body);
    }

    public record ConsentBody(String type, Boolean agree) {
    }

    @PostMapping("/consents")
    public PrivacySettingsService.Settings consent(@RequestBody ConsentBody body) {
        return privacy.setConsent(body.type(), Boolean.TRUE.equals(body.agree()));
    }

    public record GuardianBody(String guardianName, String relationship, String guardianEmail) {
    }

    /** 보호자에게 전달할 일회용 링크 토큰. 원문은 이 응답에서만 돌려준다. */
    @PostMapping("/guardian/request")
    public GuardianService.Issued requestGuardian(@RequestBody(required = false) GuardianBody body) {
        UUID me = requireMe();
        GuardianBody b = body == null ? new GuardianBody(null, null, null) : body;
        return guardians.request(me, b.guardianName(), b.relationship(), b.guardianEmail());
    }

    @DeleteMapping("/guardian/request")
    public Map<String, Boolean> cancelGuardian() {
        guardians.cancelPending(requireMe());
        return Map.of("ok", true);
    }

    private static UUID requireMe() {
        UUID me = SecurityUtils.getCurrentUserId();
        if (me == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "LOGIN_REQUIRED");
        }
        return me;
    }
}
