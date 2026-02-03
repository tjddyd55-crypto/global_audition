package com.audition.platform.application.service;

import com.audition.platform.application.dto.CreateCommentRequest;
import com.audition.platform.application.dto.VideoCommentDto;
import com.audition.platform.domain.entity.CommentLike;
import com.audition.platform.domain.entity.VideoComment;
import com.audition.platform.domain.entity.VideoContent;
import com.audition.platform.domain.repository.CommentLikeRepository;
import com.audition.platform.domain.repository.VideoCommentRepository;
import com.audition.platform.domain.repository.VideoContentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 영상 댓글 서비스
 * 작업: 2026_21_community_features
 */
@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class VideoCommentService {

    private final VideoCommentRepository videoCommentRepository;
    private final CommentLikeRepository commentLikeRepository;
    private final VideoContentRepository videoContentRepository;

    /**
     * 댓글 생성
     */
    public VideoCommentDto createComment(Long userId, CreateCommentRequest request) {
        // 비디오 존재 확인
        VideoContent video = videoContentRepository.findById(request.getVideoId())
                .orElseThrow(() -> new RuntimeException("Video not found: " + request.getVideoId()));

        VideoComment parentComment = null;
        if (request.getParentCommentId() != null) {
            parentComment = videoCommentRepository.findById(request.getParentCommentId())
                    .orElseThrow(() -> new RuntimeException("Parent comment not found: " + request.getParentCommentId()));
        }

        VideoComment comment = VideoComment.builder()
                .video(video)
                .userId(userId)
                .parentComment(parentComment)
                .content(request.getContent())
                .likeCount(0L)
                .build();

        VideoComment saved = videoCommentRepository.save(comment);
        
        // 댓글 수 업데이트
        video.setCommentCount(video.getCommentCount() + 1);
        videoContentRepository.save(video);

        log.info("댓글 생성 완료: commentId={}, videoId={}, userId={}", saved.getId(), request.getVideoId(), userId);
        return toDto(saved, null);
    }

    /**
     * 댓글 목록 조회
     */
    @Transactional(readOnly = true)
    public Page<VideoCommentDto> getComments(Long videoId, Long requesterId, Pageable pageable) {
        Page<VideoComment> comments = videoCommentRepository.findByVideoIdAndParentCommentIsNull(videoId, pageable);
        
        return comments.map(comment -> {
            // 대댓글 조회
            List<VideoComment> replies = videoCommentRepository.findByParentCommentId(comment.getId());
            List<VideoCommentDto> replyDtos = replies.stream()
                    .map(reply -> toDto(reply, requesterId))
                    .collect(Collectors.toList());

            VideoCommentDto dto = toDto(comment, requesterId);
            dto.setReplies(replyDtos);
            return dto;
        });
    }

    /**
     * 댓글 삭제 (soft delete)
     */
    public void deleteComment(Long commentId, Long userId) {
        VideoComment comment = videoCommentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found: " + commentId));

        if (!comment.getUserId().equals(userId)) {
            throw new RuntimeException("본인의 댓글만 삭제할 수 있습니다");
        }

        comment.setDeletedAt(LocalDateTime.now());
        videoCommentRepository.save(comment);

        // 댓글 수 업데이트
        VideoContent video = comment.getVideo();
        video.setCommentCount(Math.max(0, video.getCommentCount() - 1));
        videoContentRepository.save(video);
    }

    /**
     * 댓글 좋아요
     */
    public VideoCommentDto likeComment(Long commentId, Long userId) {
        VideoComment comment = videoCommentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found: " + commentId));

        // 이미 좋아요 했는지 확인
        if (commentLikeRepository.existsByCommentIdAndUserId(commentId, userId)) {
            throw new RuntimeException("이미 좋아요한 댓글입니다");
        }

        CommentLike like = CommentLike.builder()
                .commentId(commentId)
                .userId(userId)
                .build();
        commentLikeRepository.save(like);

        // 좋아요 수 업데이트
        comment.setLikeCount(comment.getLikeCount() + 1);
        VideoComment saved = videoCommentRepository.save(comment);

        return toDto(saved, userId);
    }

    /**
     * 댓글 좋아요 취소
     */
    public VideoCommentDto unlikeComment(Long commentId, Long userId) {
        CommentLike like = commentLikeRepository.findByCommentIdAndUserId(commentId, userId)
                .orElseThrow(() -> new RuntimeException("좋아요를 찾을 수 없습니다"));

        commentLikeRepository.delete(like);

        VideoComment comment = videoCommentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found: " + commentId));
        comment.setLikeCount(Math.max(0, comment.getLikeCount() - 1));
        VideoComment saved = videoCommentRepository.save(comment);

        return toDto(saved, userId);
    }

    private VideoCommentDto toDto(VideoComment comment, Long requesterId) {
        boolean isLiked = requesterId != null && 
                commentLikeRepository.existsByCommentIdAndUserId(comment.getId(), requesterId);

        return VideoCommentDto.builder()
                .id(comment.getId())
                .videoId(comment.getVideo().getId())
                .userId(comment.getUserId())
                .parentCommentId(comment.getParentComment() != null ? comment.getParentComment().getId() : null)
                .content(comment.getContent())
                .likeCount(comment.getLikeCount())
                .isLiked(isLiked)
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .build();
    }
}
