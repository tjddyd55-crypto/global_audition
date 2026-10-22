package com.audition.platform.application.i18n.content;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class ContentTranslationScheduler {

    private final ContentTranslationWorker worker;
    private final TranslationQueueProperties properties;

    public ContentTranslationScheduler(ContentTranslationWorker worker, TranslationQueueProperties properties) {
        this.worker = worker;
        this.properties = properties;
    }

    @Scheduled(fixedDelayString = "${app.translation.queue.poll-ms:5000}")
    public void poll() {
        if (!properties.isEnabled()) {
            return;
        }
        worker.drain();
    }
}
