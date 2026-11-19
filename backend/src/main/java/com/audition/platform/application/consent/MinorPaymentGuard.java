package com.audition.platform.application.consent;

import com.audition.platform.domain.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

/**
 * 미성년자 유료 결제(크레딧 구매) 보호. 가입 동의와 별개로 보호자 확인이 있어야 결제 주문을 만들 수 있다.
 * 금액·크레딧 정책은 바꾸지 않는다. 생년월일을 모르는 기존 회원은 막지 않는다(성인 여부 미확인 → 기존 동작 유지).
 */
@Component
public class MinorPaymentGuard {

    public static final String CODE = "MINOR_PAYMENT_GUARDIAN_REQUIRED";

    private final UserRepository users;
    private final MinorPolicyService policies;

    public MinorPaymentGuard(UserRepository users, MinorPolicyService policies) {
        this.users = users;
        this.policies = policies;
    }

    public void require(UUID userId) {
        if (userId == null) {
            return;
        }
        users.findById(userId).ifPresent(u -> {
            if (!policies.status(u).paymentAllowed()) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, CODE);
            }
        });
    }
}
