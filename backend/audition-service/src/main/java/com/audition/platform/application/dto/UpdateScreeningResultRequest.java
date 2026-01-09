package com.audition.platform.application.dto;

import com.audition.platform.domain.entity.Application;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateScreeningResultRequest {
    @NotNull(message = "심사 결과는 필수입니다")
    private Application.ScreeningResult result;
    
    private String comment; // 심사 코멘트 (선택)
}
