package com.audition.platform.application.notifications;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "app.notifications.sweep.enabled", havingValue = "true", matchIfMissing = true)
public class InAppNotificationScheduler {

    private static final Logger log = LoggerFactory.getLogger(InAppNotificationScheduler.class);
    private final InAppNotificationFanout fanout;

    public InAppNotificationScheduler(InAppNotificationFanout fanout) {
        this.fanout = fanout;
    }

    @Scheduled(fixedDelayString = "${app.notifications.sweep.delay-ms:600000}", initialDelayString = "${app.notifications.sweep.initial-ms:60000}")
    public void sweep() {
        try {
            fanout.sweep();
        } catch (RuntimeException e) {
            log.warn("in-app notification sweep failed: {}", e.getMessage());
        }
    }
}
