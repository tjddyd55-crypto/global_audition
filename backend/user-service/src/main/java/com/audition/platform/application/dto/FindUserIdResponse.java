package com.audition.platform.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FindUserIdResponse {
    private String maskedEmail; // 마스킹된 이메일 (예: abc***@example.com)
}
