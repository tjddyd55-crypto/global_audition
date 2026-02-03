package com.audition.platform.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ForgotPasswordResponse {
    private String resetToken; // 비밀번호 재설정 토큰 (실제 환경에서는 이메일로 전송)
    private String message; // 안내 메시지
}
