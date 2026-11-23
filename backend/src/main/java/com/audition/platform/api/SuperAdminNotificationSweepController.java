package com.audition.platform.api;

import com.audition.platform.api.dto.ApiEnvelope;
import com.audition.platform.application.credit.SuperAdminAuthHelper;
import com.audition.platform.application.notifications.InAppNotificationFanout;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/** Development/운영 점검용. 앱 내부 알림 스윕을 즉시 한 번 실행한다. 푸시는 보내지 않는다. */
@RestController
@RequestMapping("/api/admin/notifications")
public class SuperAdminNotificationSweepController {

    private final InAppNotificationFanout fanout;

    public SuperAdminNotificationSweepController(InAppNotificationFanout fanout) {
        this.fanout = fanout;
    }

    @PostMapping("/sweep")
    public ApiEnvelope<Map<String, Integer>> sweep() {
        SuperAdminAuthHelper.requireSuperAdmin();
        int attempted = fanout.sweep();
        return ApiEnvelope.ok(Map.of("attempted", attempted));
    }
}
