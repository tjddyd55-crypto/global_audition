package com.audition.platform.domain.user;

import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public final class UserSpecifications {

    private UserSpecifications() {
    }

    /**
     * 대량 지급 대상. country·createdAfter 중 최소 하나는 호출부에서 보장.
     */
    public static Specification<User> forBulkCreditGrant(String countryCode, Instant createdAfterInclusive) {
        return (root, query, cb) -> {
            List<Predicate> preds = new ArrayList<>();
            if (countryCode != null && !countryCode.isBlank()) {
                preds.add(cb.equal(root.get("countryCode"), countryCode.trim()));
            }
            if (createdAfterInclusive != null) {
                preds.add(cb.greaterThanOrEqualTo(root.get("createdAt"), createdAfterInclusive));
            }
            if (preds.isEmpty()) {
                return cb.disjunction();
            }
            return cb.and(preds.toArray(Predicate[]::new));
        };
    }
}
