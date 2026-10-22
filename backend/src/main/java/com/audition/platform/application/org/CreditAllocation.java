package com.audition.platform.application.org;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * 유료와 무료 버킷이 동시에 남아 있고 소비 순서가 확정되지 않았으면 그 사용은 배분하지 않는다.
 * FIFO/LIFO 는 구현하지 않는다. 버킷이 하나일 때만 그 버킷으로 확정한다.
 */
public final class CreditAllocation {

    public static final String POLICY_UNCONFIRMED = "UNCONFIRMED";
    public static final String ALLOCATED = "ALLOCATED";
    public static final String PENDING = "ALLOCATION_POLICY_PENDING";
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
                outcomes.add(consume(open, event.use(), applied));
            }
        }
        List<StoredLot> remaining = created.stream().map(MutableLot::snapshot).toList();
        return new Replay(remaining, outcomes);
    }

    private static Outcome consume(Map<String, List<MutableLot>> open, Use use, String policy) {
        List<String> buckets = open.entrySet().stream()
                .filter(entry -> remaining(entry.getValue()) > 0)
                .map(Map.Entry::getKey)
                .toList();
        if (!POLICY_UNCONFIRMED.equals(policy) || buckets.size() != 1) {
            return pending(use, policy);
        }
        String bucket = buckets.get(0);
        List<MutableLot> lots = open.get(bucket);
        if (remaining(lots) < use.credits()) {
            return pending(use, policy);
        }
        long left = use.credits();
        MutableLot first = null;
        boolean parity = true;
        for (MutableLot lot : lots) {
            if (left == 0) {
                break;
            }
            if (lot.remaining <= 0) {
                continue;
            }
            long take = Math.min(lot.remaining, left);
            lot.remaining -= take;
            left -= take;
            parity = parity && lot.source.parityOk();
            if (first == null) {
                first = lot;
            }
        }
        Long payable = null;
        if (PAID.equals(bucket) && parity) {
            payable = use.credits();
        } else if (FREE.equals(bucket)) {
            payable = 0L;
        }
        return new Outcome(use.id(), first == null ? null : first.source.id(), bucket, use.credits(), payable, ALLOCATED, use.occurredAt());
    }

    private static Outcome pending(Use use, String policy) {
        return new Outcome(use.id(), null, null, use.credits(), null, PENDING, use.occurredAt());
    }

    private static long remaining(List<MutableLot> lots) {
        long total = 0;
        for (MutableLot lot : lots) {
            total += lot.remaining;
        }
        return total;
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
