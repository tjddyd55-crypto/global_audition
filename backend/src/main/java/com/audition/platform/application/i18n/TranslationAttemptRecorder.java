package com.audition.platform.application.i18n;

import com.audition.platform.application.i18n.content.ContentTranslationRows.AttemptFinish;
import com.audition.platform.application.i18n.content.ContentTranslationRows.NewAttempt;
import com.audition.platform.application.i18n.content.ContentTranslationStore;
import com.audition.platform.domain.audition.AuditionTranslation;
import com.audition.platform.domain.audition.AuditionTranslationAttempt;
import com.audition.platform.domain.audition.AuditionTranslationAttemptRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class TranslationAttemptRecorder {

    private final AuditionTranslationAttemptRepository repository;
    private final ContentTranslationStore contentStore;

    public TranslationAttemptRecorder(
            AuditionTranslationAttemptRepository repository,
            ContentTranslationStore contentStore) {
        this.repository = repository;
        this.contentStore = contentStore;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public UUID start(UUID auditionId, String locale, String provider) {
        AuditionTranslationAttempt row = new AuditionTranslationAttempt();
        row.setId(UUID.randomUUID());
        row.setAuditionId(auditionId);
        row.setLocale(locale);
        row.setStatus(AuditionTranslation.STATUS_PENDING);
        row.setProvider(provider);
        row.setStartedAt(Instant.now());
        return repository.saveAndFlush(row).getId();
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public AuditionTranslationAttempt finish(UUID id, String status, String errorCode, String errorMessage) {
        AuditionTranslationAttempt row = repository.findById(id).orElseThrow();
        row.setStatus(status);
        row.setErrorCode(errorCode);
        row.setErrorMessage(errorMessage);
        row.setFinishedAt(Instant.now());
        return repository.saveAndFlush(row);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public UUID startContent(NewAttempt attempt) {
        return contentStore.insertAttempt(attempt);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void finishContent(AttemptFinish finish) {
        contentStore.finishAttempt(finish);
    }
}
