package com.audition.platform.application.service;

import com.audition.platform.domain.entity.AuditionStage;
import com.audition.platform.domain.repository.AuditionStageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class AuditionStageService {

    private final AuditionStageRepository auditionStageRepository;

    public int getStageCountOrDefault(Long auditionId, int defaultValue) {
        long count = auditionStageRepository.countByAuditionId(auditionId);
        return count > 0 ? (int) count : defaultValue;
    }

    public boolean isStageEnabled(Long auditionId, int stageNumber) {
        return auditionStageRepository.existsByAuditionIdAndStageNumber(auditionId, stageNumber);
    }

    public void createDefaultStages(Long auditionId, int maxRounds) {
        if (auditionId == null || maxRounds <= 0) {
            return;
        }
        if (auditionStageRepository.countByAuditionId(auditionId) > 0) {
            return;
        }

        List<AuditionStage> stages = new ArrayList<>();
        int safeMaxRounds = Math.min(maxRounds, 3);
        for (int i = 1; i <= safeMaxRounds; i++) {
            stages.add(AuditionStage.builder()
                    .auditionId(auditionId)
                    .stageNumber(i)
                    .name("Round " + i)
                    .build());
        }
        auditionStageRepository.saveAll(stages);
    }
}

