package com.audition.platform.application.credit;

import com.audition.platform.api.dto.CreditPolicyPublicDto;
import org.springframework.stereotype.Component;

import java.util.concurrent.ConcurrentHashMap;

/**
 * 공개 정책 API 빈도 완화용 짧은 TTL 캐시. 관리자 정책 수정 시 {@link #invalidate(String)} 로 즉시 무효화.
 */
@Component
public class CreditPolicyPublicSnapshotCache {

    private static final long TTL_MS = 20_000;

    private record Entry(CreditPolicyPublicDto dto, long expiresAtEpochMs) {
    }

    private final ConcurrentHashMap<String, Entry> map = new ConcurrentHashMap<>();

    public CreditPolicyPublicDto getOrLoad(String policyKey, java.util.function.Supplier<CreditPolicyPublicDto> loader) {
        String key = policyKey != null ? policyKey.trim() : "";
        long now = System.currentTimeMillis();
        Entry cached = map.get(key);
        if (cached != null && cached.expiresAtEpochMs > now) {
            return cached.dto();
        }
        CreditPolicyPublicDto fresh = loader.get();
        map.put(key, new Entry(fresh, now + TTL_MS));
        return fresh;
    }

    public void invalidate(String policyKey) {
        if (policyKey != null && !policyKey.isBlank()) {
            map.remove(policyKey.trim());
        }
    }
}
