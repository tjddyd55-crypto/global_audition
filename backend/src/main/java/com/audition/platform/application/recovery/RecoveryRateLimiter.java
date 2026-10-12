package com.audition.platform.application.recovery;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 복구 추측/스팸 제한. ImageUploadRateLimiter와 같은 인메모리 패턴.
 */
@Component
public class RecoveryRateLimiter {

    private static final int IDENTIFY_PER_15M = 8;
    private static final int RESET_PER_15M = 5;
    private static final int REQUEST_PER_HOUR = 3;

    private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();

    public void checkIdentify(String clientKey) {
        check(clientKey + ":identify", 15 * 60, IDENTIFY_PER_15M, "복구 코드 확인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.");
    }

    public void checkReset(String clientKey) {
        check(clientKey + ":reset", 15 * 60, RESET_PER_15M, "비밀번호 재설정 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.");
    }

    public void checkRequest(String clientKey) {
        check(clientKey + ":request", 3600, REQUEST_PER_HOUR, "복구 요청이 너무 많습니다. 한 시간 뒤 다시 시도해 주세요.");
    }

    private void check(String key, int windowSeconds, int max, String message) {
        Window w = windows.computeIfAbsent(key, k -> new Window());
        synchronized (w) {
            long bucket = Instant.now().getEpochSecond() / windowSeconds;
            if (w.bucket != bucket) {
                w.bucket = bucket;
                w.count = 0;
            }
            if (w.count >= max) {
                throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, message);
            }
            w.count++;
        }
    }

    private static final class Window {
        private long bucket = -1;
        private int count;
    }
}
