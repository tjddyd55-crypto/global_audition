package com.audition.platform.application.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class AgencyBookmarkDto {
    private Long id;
    private Long ownerId;
    private Long applicantId;
    private String memo;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

