package com.audition.platform.application.service;

import com.audition.platform.application.dto.CreateExpertFeedbackRequest;
import com.audition.platform.application.dto.ExpertFeedbackDto;
import com.audition.platform.application.dto.UserSummaryDto;
import com.audition.platform.domain.entity.ExpertFeedback;
import com.audition.platform.domain.repository.ExpertFeedbackRepository;
import com.audition.platform.infrastructure.client.UserServiceClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 전문가 평가 서비스
 * 작업: GA_20260202_CREATIVE_REGISTRY_EXTENSION
 */
@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class ExpertFeedbackService {

    private final ExpertFeedbackRepository expertFeedbackRepository;
    private final UserServiceClient userServiceClient;

    /**
     * 전문가 평가 작성
     * 기획사 또는 인증 평가자만 가능
     */
    public ExpertFeedbackDto createFeedback(
            Long evaluatorId,
            ExpertFeedback.EvaluatorType evaluatorType,
            CreateExpertFeedbackRequest request
    ) {
        // 권한 확인: 기획사 또는 인증 평가자만 가능
        if (evaluatorType != ExpertFeedback.EvaluatorType.AGENCY &&
            evaluatorType != ExpertFeedback.EvaluatorType.CERTIFIED_EVALUATOR) {
            throw new RuntimeException("기획사 또는 인증 평가자만 평가를 작성할 수 있습니다");
        }

        ExpertFeedback feedback = ExpertFeedback.builder()
                .assetId(request.getAssetId())
                .evaluatorId(evaluatorId)
                .evaluatorType(evaluatorType)
                .rating(request.getRating())
                .comment(request.getComment())
                .evidenceLink(request.getEvidenceLink())
                .isPublic(request.getIsPublic() != null ? request.getIsPublic() : true)
                .build();

        ExpertFeedback saved = expertFeedbackRepository.save(feedback);
        log.info("전문가 평가 작성 완료: feedbackId={}, assetId={}, evaluatorId={}", 
                saved.getId(), request.getAssetId(), evaluatorId);

        return enrichFeedbackDto(toDto(saved));
    }

    /**
     * 자산별 평가 목록 조회 (창작자도 열람 가능)
     */
    @Transactional(readOnly = true)
    public Page<ExpertFeedbackDto> getFeedbackByAsset(Long assetId, Pageable pageable) {
        Page<ExpertFeedback> feedbacks = expertFeedbackRepository.findByAssetId(assetId, pageable);
        return feedbacks.map(feedback -> enrichFeedbackDto(toDto(feedback)));
    }

    /**
     * 평가자별 평가 목록 조회
     */
    @Transactional(readOnly = true)
    public Page<ExpertFeedbackDto> getFeedbackByEvaluator(Long evaluatorId, Pageable pageable) {
        Page<ExpertFeedback> feedbacks = expertFeedbackRepository.findByEvaluatorId(evaluatorId, pageable);
        return feedbacks.map(feedback -> enrichFeedbackDto(toDto(feedback)));
    }

    private ExpertFeedbackDto toDto(ExpertFeedback feedback) {
        return ExpertFeedbackDto.builder()
                .id(feedback.getId())
                .assetId(feedback.getAssetId())
                .evaluatorId(feedback.getEvaluatorId())
                .evaluatorType(feedback.getEvaluatorType())
                .rating(feedback.getRating())
                .comment(feedback.getComment())
                .evidenceLink(feedback.getEvidenceLink())
                .isPublic(feedback.getIsPublic())
                .createdAt(feedback.getCreatedAt())
                .updatedAt(feedback.getUpdatedAt())
                .build();
    }

    private ExpertFeedbackDto enrichFeedbackDto(ExpertFeedbackDto dto) {
        // 평가자 이름 조회 (내부 API)
        UserSummaryDto evaluatorSummary = userServiceClient.getUserSummary(dto.getEvaluatorId());
        if (evaluatorSummary != null) {
            dto.setEvaluatorName(evaluatorSummary.getUserName());
        }
        return dto;
    }
}
