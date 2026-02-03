package com.audition.platform.application.service;

import com.audition.platform.application.dto.CreateFeedbackRequest;
import com.audition.platform.application.dto.FeedbackSessionDto;
import com.audition.platform.application.dto.UpdateFeedbackStatusRequest;
import com.audition.platform.domain.entity.FeedbackSession;
import com.audition.platform.domain.repository.FeedbackSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class FeedbackService {

    private final FeedbackSessionRepository feedbackSessionRepository;
    private final UserRoleValidator userRoleValidator;

    public FeedbackSessionDto requestFeedback(Long applicantId, CreateFeedbackRequest request) {
        userRoleValidator.requireApplicant(applicantId);
        userRoleValidator.requireInstructor(request.getInstructorId());

        FeedbackSession session = FeedbackSession.builder()
                .applicantId(applicantId)
                .instructorId(request.getInstructorId())
                .requestMessage(request.getRequestMessage())
                .status(FeedbackSession.FeedbackStatus.REQUESTED)
                .build();

        FeedbackSession saved = feedbackSessionRepository.save(session);
        return toDto(saved);
    }

    public FeedbackSessionDto updateFeedbackStatus(Long instructorId, Long sessionId, UpdateFeedbackStatusRequest request) {
        userRoleValidator.requireInstructor(instructorId);

        FeedbackSession session = feedbackSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Feedback session not found: " + sessionId));
        if (!session.getInstructorId().equals(instructorId)) {
            throw new RuntimeException("해당 피드백 세션의 담당자가 아닙니다");
        }

        FeedbackSession.FeedbackStatus next = request.getStatus();
        if (next == FeedbackSession.FeedbackStatus.ACCEPTED
                && session.getStatus() != FeedbackSession.FeedbackStatus.REQUESTED) {
            throw new RuntimeException("요청 상태에서만 수락할 수 있습니다");
        }
        if (next == FeedbackSession.FeedbackStatus.REJECTED
                && session.getStatus() != FeedbackSession.FeedbackStatus.REQUESTED) {
            throw new RuntimeException("요청 상태에서만 거절할 수 있습니다");
        }
        if (next == FeedbackSession.FeedbackStatus.COMPLETED
                && session.getStatus() != FeedbackSession.FeedbackStatus.ACCEPTED) {
            throw new RuntimeException("수락 상태에서만 완료할 수 있습니다");
        }

        session.setStatus(next);
        if (request.getResponseMessage() != null) {
            session.setResponseMessage(request.getResponseMessage());
        }
        FeedbackSession saved = feedbackSessionRepository.save(session);
        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public Page<FeedbackSessionDto> getMyFeedbackRequests(Long applicantId, Pageable pageable) {
        return feedbackSessionRepository.findByApplicantId(applicantId, pageable)
                .map(this::toDto);
    }

    @Transactional(readOnly = true)
    public Page<FeedbackSessionDto> getInstructorSessions(Long instructorId, Pageable pageable) {
        return feedbackSessionRepository.findByInstructorId(instructorId, pageable)
                .map(this::toDto);
    }

    private FeedbackSessionDto toDto(FeedbackSession session) {
        return FeedbackSessionDto.builder()
                .id(session.getId())
                .applicantId(session.getApplicantId())
                .instructorId(session.getInstructorId())
                .requestMessage(session.getRequestMessage())
                .responseMessage(session.getResponseMessage())
                .status(session.getStatus())
                .createdAt(session.getCreatedAt())
                .updatedAt(session.getUpdatedAt())
                .build();
    }
}

