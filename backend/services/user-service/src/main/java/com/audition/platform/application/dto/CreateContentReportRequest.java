package com.audition.platform.application.dto;

import com.audition.platform.domain.entity.ContentReport;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 콘텐츠 신고 요청
 * 작업: OPS_02_content_moderation
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateContentReportRequest {
    @NotNull(message = "콘텐츠 타입은 필수입니다")
    private ContentReport.ContentType contentType; // VIDEO, COMMENT, USER

    @NotNull(message = "콘텐츠 ID는 필수입니다")
    private Long contentId;

    @NotBlank(message = "신고 사유는 필수입니다")
    private String reason; // 예: "스팸", "부적절한 내용", "저작권 침해" 등

    private String description; // 상세 설명
}
