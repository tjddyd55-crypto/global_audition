package com.audition.platform.application.service;

import com.audition.platform.domain.entity.TranslationJob;
import com.audition.platform.domain.repository.TranslationJobRepository;
import com.audition.platform.infrastructure.translation.TranslationProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 번역 작업 처리 스케줄러
 * 작업: 2026_09_translation_system
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class TranslationProcessor {

    private final TranslationJobRepository translationJobRepository;
    private final TranslationProvider translationProvider;

    /**
     * PENDING 상태의 번역 작업을 주기적으로 처리
     * 30초마다 실행
     */
    @Scheduled(fixedDelay = 30000) // 30초마다 실행
    @Transactional
    public void processPendingJobs() {
        List<TranslationJob> pendingJobs = translationJobRepository.findByStatus(TranslationJob.TranslationStatus.PENDING);
        
        if (pendingJobs.isEmpty()) {
            return;
        }

        log.info("번역 작업 처리 시작: {}개 작업", pendingJobs.size());

        for (TranslationJob job : pendingJobs) {
            try {
                processJob(job);
            } catch (Exception e) {
                log.error("번역 작업 처리 실패: jobId={}", job.getId(), e);
                job.setStatus(TranslationJob.TranslationStatus.FAILED);
                translationJobRepository.save(job);
            }
        }
    }

    private void processJob(TranslationJob job) {
        log.info("번역 작업 처리: jobId={}, sourceLocale={}, targetLocale={}", 
                job.getId(), job.getSourceLocale(), job.getTargetLocale());

        // Provider를 사용하여 번역 수행
        if (!translationProvider.isAvailable()) {
            log.warn("번역 Provider 사용 불가: {}", translationProvider.getName());
            job.setStatus(TranslationJob.TranslationStatus.FAILED);
            translationJobRepository.save(job);
            return;
        }

        try {
            String translatedText = translationProvider.translate(
                    job.getSourceText(),
                    job.getSourceLocale(),
                    job.getTargetLocale()
            );

            // 번역 결과 저장
            job.setTranslatedText(translatedText);
            job.setStatus(TranslationJob.TranslationStatus.COMPLETED);
            job.setProvider(translationProvider.getName());
            translationJobRepository.save(job);

            log.info("번역 작업 완료: jobId={}", job.getId());
        } catch (Exception e) {
            log.error("번역 수행 실패: jobId={}", job.getId(), e);
            job.setStatus(TranslationJob.TranslationStatus.FAILED);
            translationJobRepository.save(job);
            throw e;
        }
    }
}
