package com.audition.platform.application.dto;

import com.audition.platform.domain.entity.ColumnPost;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ColumnDto {
    private Long id;
    private Long authorId;
    private String title;
    private String content;
    private ColumnPost.ColumnStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

