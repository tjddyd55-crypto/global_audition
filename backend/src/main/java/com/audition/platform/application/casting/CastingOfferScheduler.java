package com.audition.platform.application.casting;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** 기한 경과 제안 만료 + 마감 임박 알림. */
@Component
@ConditionalOnProperty(name = "app.casting.sweep.enabled", havingValue = "true", matchIfMissing = true)
public class CastingOfferScheduler {

    private static final Logger log = LoggerFactory.getLogger(CastingOfferScheduler.class);
    private final CastingService casting;

    public CastingOfferScheduler(CastingService casting) {
        this.casting = casting;
    }

    @Scheduled(fixedDelayString = "${app.casting.sweep.delay-ms:600000}", initialDelayString = "${app.casting.sweep.initial-ms:60000}")
    public void sweep() {
        try {
            int expired = casting.sweep();
            if (expired > 0) {
                log.info("casting offers expired: {}", expired);
            }
        } catch (RuntimeException e) {
            log.warn("casting sweep failed: {}", e.getMessage());
        }
    }
}
