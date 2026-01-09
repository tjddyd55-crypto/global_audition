package com.audition.platform.application.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class CreateApplicationRequest {
    @NotNull(message = "오디션 ID는 필수입니다")
    private Long auditionId;

    private Long videoId1;
    private Long videoId2;
    
    private List<String> photos;
    
    private String paymentMethod; // PAYPAL, STRIPE 등
}
