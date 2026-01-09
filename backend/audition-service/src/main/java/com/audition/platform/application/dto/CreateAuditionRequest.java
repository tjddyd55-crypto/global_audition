package com.audition.platform.application.dto;

import com.audition.platform.domain.entity.Audition;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CreateAuditionRequest {
    @NotBlank(message = "제목은 필수입니다")
    private String title;

    private String titleEn;

    @NotNull(message = "카테고리는 필수입니다")
    private Audition.AuditionCategory category;

    private String description;
    private String requirements;

    @NotNull(message = "시작일은 필수입니다")
    private LocalDate startDate;

    @NotNull(message = "종료일은 필수입니다")
    private LocalDate endDate;

    private LocalDate screeningDate1;
    private LocalDate screeningDate2;
    private LocalDate screeningDate3;

    private String bannerUrl;
}
