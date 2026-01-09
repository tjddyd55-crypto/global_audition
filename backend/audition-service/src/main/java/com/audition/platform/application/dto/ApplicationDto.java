package com.audition.platform.application.dto;

import com.audition.platform.domain.entity.Application;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApplicationDto {
    private Long id;
    private Long auditionId;
    private String auditionTitle;
    private Long userId;
    private String userName;
    private Application.ApplicationStatus status;
    private Application.ScreeningResult result1;
    private Application.ScreeningResult result2;
    private Application.ScreeningResult result3;
    private Application.ScreeningResult finalResult;
    private Long videoId1;
    private Long videoId2;
    private List<String> photos;
    private String paymentTransactionId;
    private Double paymentAmount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
