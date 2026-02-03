package com.audition.platform.application.service;

import com.audition.platform.application.dto.CreateVideoFeedbackRequest;
import com.audition.platform.application.dto.VideoFeedbackDto;
import com.audition.platform.domain.entity.VideoContent;
import com.audition.platform.domain.entity.VideoFeedback;
import com.audition.platform.domain.repository.VideoContentRepository;
import com.audition.platform.domain.repository.VideoFeedbackRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 영상 피드백 서비스
 * 작업: 2026_13_video_feedback
 */
@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class VideoFeedbackService {

    private final VideoFeedbackRepository videoFeedbackRepository;
    private final VideoContentRepository videoContentRepository;

    /**
     * 피드백 생성
     */
    public VideoFeedbackDto createFeedback(Long userId, CreateVideoFeedbackRequest request) {
        // 비디오 존재 확인
        VideoContent video = videoContentRepository.findById(request.getVideoId())
                .orElseThrow(() -> new RuntimeException("Video not found: " + request.getVideoId()));

        // 타임코드 유효성 검증
        if (video.getDuration() != null && request.getTimestampSeconds() > video.getDuration()) {
            throw new IllegalArgumentException(
                    String.format("타임코드가 비디오 길이를 초과합니다. 비디오 길이: %d초, 요청 타임코드: %d초",
                            video.getDuration(), request.getTimestampSeconds()));
        }

        VideoFeedback feedback = VideoFeedback.builder()
                .video(video)
                .userId(userId)
                .timestampSeconds(request.getTimestampSeconds())
                .comment(request.getComment())
                .build();

        VideoFeedback saved = videoFeedbackRepository.save(feedback);
        log.info("피드백 생성 완료: feedbackId={}, videoId={}, timestamp={}초", 
                saved.getId(), request.getVideoId(), request.getTimestampSeconds());

        // 피드백 알림 생성 (작업: 2026_17_notification_system)
        // TODO: User Service 내부 API 호출 필요 (Media Service에서 User Service 호출 구조 추가 필요)
        // video.getUserId()에게 피드백 알림 전송

        return toDto(saved);
    }

    /**
     * 비디오별 피드백 목록 조회 (타임코드 순)
     */
    @Transactional(readOnly = true)
    public List<VideoFeedbackDto> getFeedbackByVideo(Long videoId) {
        List<VideoFeedback> feedbacks = videoFeedbackRepository.findByVideoIdOrderByTimestampSecondsAsc(videoId);
        return feedbacks.stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * 비디오별 피드백 목록 조회 (페이지네이션)
     */
    @Transactional(readOnly = true)
    public Page<VideoFeedbackDto> getFeedbackByVideo(Long videoId, Pageable pageable) {
        Page<VideoFeedback> feedbacks = videoFeedbackRepository.findByVideoId(videoId, pageable);
        return feedbacks.map(this::toDto);
    }

    /**
     * 특정 시간 범위의 피드백 조회
     */
    @Transactional(readOnly = true)
    public List<VideoFeedbackDto> getFeedbackByTimeRange(Long videoId, Integer startTime, Integer endTime) {
        List<VideoFeedback> feedbacks = videoFeedbackRepository.findByVideoIdAndTimeRange(
                videoId, startTime, endTime);
        return feedbacks.stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * 사용자별 피드백 히스토리 조회
     */
    @Transactional(readOnly = true)
    public Page<VideoFeedbackDto> getFeedbackHistory(Long userId, Pageable pageable) {
        Page<VideoFeedback> feedbacks = videoFeedbackRepository.findByUserId(userId, pageable);
        return feedbacks.map(this::toDto);
    }

    /**
     * 피드백 수정
     */
    public VideoFeedbackDto updateFeedback(Long feedbackId, Long userId, String comment) {
        VideoFeedback feedback = videoFeedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new RuntimeException("Feedback not found: " + feedbackId));

        if (!feedback.getUserId().equals(userId)) {
            throw new RuntimeException("Not authorized to update this feedback");
        }

        feedback.setComment(comment);
        VideoFeedback updated = videoFeedbackRepository.save(feedback);
        return toDto(updated);
    }

    /**
     * 피드백 삭제
     */
    public void deleteFeedback(Long feedbackId, Long userId) {
        VideoFeedback feedback = videoFeedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new RuntimeException("Feedback not found: " + feedbackId));

        if (!feedback.getUserId().equals(userId)) {
            throw new RuntimeException("Not authorized to delete this feedback");
        }

        videoFeedbackRepository.delete(feedback);
        log.info("피드백 삭제 완료: feedbackId={}, userId={}", feedbackId, userId);
    }

    private VideoFeedbackDto toDto(VideoFeedback feedback) {
        return VideoFeedbackDto.builder()
                .id(feedback.getId())
                .videoId(feedback.getVideo().getId())
                .userId(feedback.getUserId())
                .timestampSeconds(feedback.getTimestampSeconds())
                .comment(feedback.getComment())
                .createdAt(feedback.getCreatedAt())
                .updatedAt(feedback.getUpdatedAt())
                .build();
    }
}
