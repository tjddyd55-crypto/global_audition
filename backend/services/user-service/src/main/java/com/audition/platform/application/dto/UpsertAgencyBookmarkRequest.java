package com.audition.platform.application.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpsertAgencyBookmarkRequest {
    @NotNull(message = "지원자 ID는 필수입니다")
    private Long applicantId;

    private String memo;
}

