package com.audition.platform.application.dto;

import com.audition.platform.domain.entity.VideoContent;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VideoContentDto {
    private Long id;
    private Long userId;
    private String userName;
    private String title;
    private String description;
    private String videoUrl;
    private String embedUrl; // YouTube 임베드 URL
    private String thumbnailUrl;
    private Integer duration;
    private Long viewCount;
    private Long likeCount;
    private Long commentCount;
    private VideoContent.VideoCategory category;
    private VideoContent.VideoStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
