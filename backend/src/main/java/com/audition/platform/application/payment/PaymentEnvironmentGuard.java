package com.audition.platform.application.payment;

import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

/**
 * MOCK 크레딧은 개발·테스트에서만 지급한다. LIVE 결제는 이 단계에서 실행하지 않는다.
 */
@Component
public class PaymentEnvironmentGuard {

    private final Environment environment;

    public PaymentEnvironmentGuard(Environment environment) {
        this.environment = environment;
    }

    public boolean mockAllowed() {
        for (String profile : environment.getActiveProfiles()) {
            if (profile != null && (profile.equalsIgnoreCase("prod") || profile.equalsIgnoreCase("production"))) {
                return false;
            }
        }
        return true;
    }

    public boolean liveExecutionAllowed() {
        return false;
    }
}
