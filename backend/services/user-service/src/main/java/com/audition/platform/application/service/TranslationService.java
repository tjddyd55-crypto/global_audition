package com.audition.platform.application.service;

import com.audition.platform.application.dto.CreateTranslationJobRequest;
import com.audition.platform.application.dto.TranslationJobDto;
import com.audition.platform.domain.entity.TranslationJob;
import com.audition.platform.domain.repository.TranslationJobRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class TranslationService {

    private final TranslationJobRepository translationJobRepository;
    private final UserRoleValidator userRoleValidator;

    public TranslationJobDto createJob(Long requesterId, CreateTranslationJobRequest request) {
        userRoleValidator.requireAdmin(requesterId);
        TranslationJob job = TranslationJob.builder()
                .resourceType(request.getResourceType())
                .resourceId(request.getResourceId())
                .sourceLocale(request.getSourceLocale())
                .targetLocale(request.getTargetLocale())
                .sourceText(request.getSourceText())
                .provider(request.getProvider())
                .status(TranslationJob.TranslationStatus.PENDING)
                .build();

        TranslationJob saved = translationJobRepository.save(job);
        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public TranslationJobDto getJob(Long requesterId, Long jobId) {
        userRoleValidator.requireAdmin(requesterId);
        TranslationJob job = translationJobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Translation job not found: " + jobId));
        return toDto(job);
    }

    private TranslationJobDto toDto(TranslationJob job) {
        return TranslationJobDto.builder()
                .id(job.getId())
                .resourceType(job.getResourceType())
                .resourceId(job.getResourceId())
                .sourceLocale(job.getSourceLocale())
                .targetLocale(job.getTargetLocale())
                .sourceText(job.getSourceText())
                .translatedText(job.getTranslatedText())
                .status(job.getStatus())
                .provider(job.getProvider())
                .createdAt(job.getCreatedAt())
                .updatedAt(job.getUpdatedAt())
                .build();
    }
}

