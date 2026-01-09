package com.audition.platform.application.dto;

import com.audition.platform.domain.entity.Audition;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditionDto {
    private Long id;
    private String title;
    private String titleEn;
    private Audition.AuditionStatus status;
    private Audition.AuditionCategory category;
    private String description;
    private String requirements;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDate screeningDate1;
    private LocalDate announcementDate1;
    private LocalDate screeningDate2;
    private LocalDate announcementDate2;
    private LocalDate screeningDate3;
    private LocalDate announcementDate3;
    private String bannerUrl;
    private Long businessId;
    private String businessName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
