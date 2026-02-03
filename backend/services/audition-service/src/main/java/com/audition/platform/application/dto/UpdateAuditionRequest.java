package com.audition.platform.application.dto;

import com.audition.platform.domain.entity.Audition;
import lombok.Data;

import java.time.LocalDate;

@Data
public class UpdateAuditionRequest {
    private String title;
    private String titleEn;
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
    private String posterUrl;
    private String posterKey;
    private Audition.VideoType videoType;
    private String videoUrl;
    private String videoKey;
    private Integer maxRounds;
    private java.time.LocalDateTime deadlineAt;
    private Audition.AuditionStatus status;
}
