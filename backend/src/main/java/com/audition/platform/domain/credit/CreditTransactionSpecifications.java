package com.audition.platform.domain.credit;

import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public final class CreditTransactionSpecifications {

    private CreditTransactionSpecifications() {
    }

    public static Specification<CreditTransaction> filter(
            UUID userId,
            String type,
            String referenceId,
            Instant fromInclusive,
            Instant toInclusive) {
        return (root, query, cb) -> {
            List<Predicate> preds = new ArrayList<>();
            if (userId != null) {
                preds.add(cb.equal(root.get("userId"), userId));
            }
            if (type != null && !type.isBlank()) {
                preds.add(cb.equal(root.get("type"), type.trim()));
            }
            if (referenceId != null && !referenceId.isBlank()) {
                preds.add(cb.equal(root.get("referenceId"), referenceId.trim()));
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

    /** 내 거래 목록: userId 고정 + 선택 type */
    public static Specification<CreditTransaction> forUserWithOptionalType(UUID userId, String type) {
        return (root, query, cb) -> {
            List<Predicate> preds = new ArrayList<>();
            preds.add(cb.equal(root.get("userId"), userId));
            if (type != null && !type.isBlank()) {
                preds.add(cb.equal(root.get("type"), type.trim()));
            }
            return cb.and(preds.toArray(Predicate[]::new));
        };
    }
}
