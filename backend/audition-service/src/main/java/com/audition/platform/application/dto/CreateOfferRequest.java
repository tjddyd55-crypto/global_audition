package com.audition.platform.application.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateOfferRequest {
    @NotNull(message = "오디션 ID는 필수입니다")
    private Long auditionId;

    @NotNull(message = "비디오 콘텐츠 ID는 필수입니다")
    private Long videoContentId;

    private String message; // 제안 메시지 (선택)
}
