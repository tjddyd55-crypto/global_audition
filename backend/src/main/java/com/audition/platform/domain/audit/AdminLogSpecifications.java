package com.audition.platform.domain.audit;

import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public final class AdminLogSpecifications {

    private AdminLogSpecifications() {
    }

    public static Specification<AdminLog> filter(UUID adminId, String action, Instant fromInclusive, Instant toInclusive) {
        return (root, query, cb) -> {
            List<Predicate> preds = new ArrayList<>();
            if (adminId != null) {
                preds.add(cb.equal(root.get("adminId"), adminId));
            }
            if (action != null && !action.isBlank()) {
                preds.add(cb.equal(root.get("action"), action.trim()));
            }
            if (fromInclusive != null) {
                preds.add(cb.greaterThanOrEqualTo(root.get("createdAt"), fromInclusive));
            }
            if (toInclusive != null) {
                preds.add(cb.lessThanOrEqualTo(root.get("createdAt"), toInclusive));
            }
            if (preds.isEmpty()) {
                return cb.conjunction();
            }
            return cb.and(preds.toArray(Predicate[]::new));
        };
    }
}
