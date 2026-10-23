package com.audition.platform.application.org;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * 확정 정책은 무료 로트를 먼저 쓰고 부족분만 유료 로트에서 쓴다.
 * 무료와 유료 패리티 잔량으로 사용을 메울 수 없으면 차감하지 않고 REVIEW_REQUIRED 로 남긴다.
 * 미분류 크레딧으로 구멍을 메우지 않는다.
 */
public final class CreditAllocation {

    public static final String POLICY_UNCONFIRMED = "UNCONFIRMED";
    public static final String POLICY_FREE_FIRST = "FREE_FIRST";
    public static final String ALLOCATED = "ALLOCATED";
    public static final String PENDING = "ALLOCATION_POLICY_PENDING";
    public static final String REVIEW = "REVIEW_REQUIRED";
    public static final String PAID = "PAID";
    public static final String FREE = "FREE";
    public static final String UNCLASSIFIED = "UNCLASSIFIED";

    private CreditAllocation() {
    }

    public record Lot(
            UUID id,
            UUID userId,
            UUID paymentOrderId,
            String bucket,
            long credits,
            long cashUsd,
            boolean parityOk,
            Instant occurredAt) {
    }

    public record Use(UUID id, UUID userId, long credits, Instant occurredAt) {
    }

    public record Outcome(
            UUID useId,
            UUID lotId,
            String bucket,
            long credits,
            Long payableUsd,
            String status,
            Instant occurredAt) {
    }

    public record StoredLot(
            UUID id,
            UUID userId,
            UUID paymentOrderId,
            String bucket,
            long originalCredits,
            long remainingCredits,
            long cashUsd,
            boolean parityOk,
            Instant occurredAt) {
    }

    public record Replay(List<StoredLot> lots, List<Outcome> outcomes) {
    }

    public static Replay replay(List<Lot> lots, List<Use> uses, String policy) {
        String applied = policy == null || policy.isBlank() ? POLICY_UNCONFIRMED : policy.trim();
        Map<UUID, List<Event>> byUser = new LinkedHashMap<>();
        List<MutableLot> created = new ArrayList<>();
        for (Lot lot : lots) {
            MutableLot mutable = new MutableLot(lot);
            created.add(mutable);
            byUser.computeIfAbsent(lot.userId(), ignored -> new ArrayList<>()).add(new Event(lot.occurredAt(), 1, mutable, null));
        }
        for (Use use : uses) {
            byUser.computeIfAbsent(use.userId(), ignored -> new ArrayList<>()).add(new Event(use.occurredAt(), 0, null, use));
        }
        List<Outcome> outcomes = new ArrayList<>();
        for (List<Event> events : byUser.values()) {
            events.sort(Comparator.comparing(Event::at).thenComparingInt(Event::rank));
            Map<String, List<MutableLot>> open = new LinkedHashMap<>();
            for (Event event : events) {
                if (event.lot() != null) {
                    open.computeIfAbsent(event.lot().source.bucket(), ignored -> new ArrayList<>()).add(event.lot());
                    continue;
                }
                outcomes.addAll(consume(open, event.use(), applied));
            }
        }
        List<StoredLot> remaining = created.stream().map(MutableLot::snapshot).toList();
        return new Replay(remaining, outcomes);
    }

    private static List<Outcome> consume(Map<String, List<MutableLot>> open, Use use, String policy) {
        if (!POLICY_FREE_FIRST.equals(policy)) {
            return List.of(review(use));
        }
        long freeRemaining = coverable(open.get(FREE));
        long paidRemaining = coverable(open.get(PAID));
        if (freeRemaining + paidRemaining < use.credits()) {
            return List.of(review(use));
        }
        long left = use.credits();
        List<Outcome> rows = new ArrayList<>();
        left = take(open.get(FREE), use, left, rows, true);
        left = take(open.get(PAID), use, left, rows, false);
        if (left != 0) {
            return List.of(review(use));
        }
        return rows;
    }

    private static long take(List<MutableLot> lots, Use use, long left, List<Outcome> rows, boolean free) {
        if (lots == null || left == 0) {
            return left;
        }
        for (MutableLot lot : lots) {
            if (left == 0) {
                break;
            }
            if (lot.remaining <= 0 || !lot.source.parityOk()) {
                continue;
            }
            long take = Math.min(lot.remaining, left);
            lot.remaining -= take;
            left -= take;
            rows.add(new Outcome(
                    use.id(),
                    lot.source.id(),
                    free ? FREE : PAID,
                    take,
                    free ? 0L : take,
                    ALLOCATED,
                    use.occurredAt()));
        }
        return left;
    }

    private static long coverable(List<MutableLot> lots) {
        if (lots == null) {
            return 0;
        }
        long total = 0;
        for (MutableLot lot : lots) {
            if (lot.remaining > 0 && lot.source.parityOk()) {
                total += lot.remaining;
            }
        }
        return total;
    }

    private static Outcome review(Use use) {
        return new Outcome(use.id(), null, null, use.credits(), null, REVIEW, use.occurredAt());
    }

    private record Event(Instant at, int rank, MutableLot lot, Use use) {
    }

    private static final class MutableLot {
        private final Lot source;
        private long remaining;

        private MutableLot(Lot source) {
            this.source = source;
            this.remaining = source.credits();
        }

        private StoredLot snapshot() {
            return new StoredLot(
                    source.id(), source.userId(), source.paymentOrderId(), source.bucket(),
                    source.credits(), remaining, source.cashUsd(), source.parityOk(), source.occurredAt());
        }
    }
}
