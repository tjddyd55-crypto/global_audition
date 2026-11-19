package com.audition.platform.api;

import com.audition.platform.application.consent.GuardianService;
import com.audition.platform.infra.ClientIpResolver;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 보호자 확인 페이지 API(비로그인 허용: /api/auth/**). 토큰이 곧 접근 권한이다.
 * 미성년자 본인 세션으로 호출하면 서비스에서 403.
 */
@RestController
@RequestMapping("/api/auth/guardian")
public class GuardianPublicController {

    private final GuardianService guardians;

    public GuardianPublicController(GuardianService guardians) {
        this.guardians = guardians;
    }

    @GetMapping("/{token}")
    public GuardianService.PublicView view(@PathVariable String token) {
        return guardians.view(token);
    }

    @PostMapping("/{token}/confirm")
    public GuardianService.PublicView confirm(@PathVariable String token, @RequestBody GuardianService.ConfirmInput body,
                                              HttpServletRequest request) {
        return guardians.confirm(token, body, ClientIpResolver.resolve(request));
    }

    @PostMapping("/{token}/revoke")
    public GuardianService.PublicView revoke(@PathVariable String token) {
        return guardians.revoke(token);
    }
}
