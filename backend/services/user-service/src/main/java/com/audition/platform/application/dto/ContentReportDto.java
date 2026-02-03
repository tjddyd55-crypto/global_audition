package com.audition.platform.application.dto;

import com.audition.platform.domain.entity.ContentReport;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 콘텐츠 신고 DTO
 * 작업: OPS_02_content_moderation
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContentReportDto {
    private Long id;
    private Long reporterId;
    private String reporterName; // 내부 API로 조회
    private ContentReport.ContentType contentType;
    private Long contentId;
    private String reason;
    private String description;
    private ContentReport.ReportStatus status;
    private Long reviewedBy;
    private LocalDateTime reviewedAt;
    private String resolution;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
