package com.audition.platform.application.dto;

import com.audition.platform.domain.entity.AuditionOffer;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditionOfferDto {
    private Long id;
    private Long auditionId;
    private String auditionTitle;
    private Long businessId;
    private String businessName;
    private Long userId;
    private String userName;
    private Long videoContentId;
    private AuditionOffer.OfferStatus status;
    private String message;
    private LocalDateTime readAt;
    private LocalDateTime respondedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
