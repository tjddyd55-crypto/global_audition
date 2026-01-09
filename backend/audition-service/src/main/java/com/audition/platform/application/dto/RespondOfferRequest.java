package com.audition.platform.application.dto;

import com.audition.platform.domain.entity.AuditionOffer;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RespondOfferRequest {
    @NotNull(message = "응답은 필수입니다")
    private String response; // "ACCEPT" 또는 "REJECT"
}
