package com.audition.platform.infrastructure.email;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * 이메일 발송 서비스
 * 작업: 2026_05_email_reset_password
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.from:no-reply@audition-platform.com}")
    private String fromEmail;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    /**
     * 비밀번호 재설정 이메일 발송
     * 
     * @param toEmail 수신자 이메일
     * @param resetToken 재설정 토큰
     * @param userName 사용자 이름
     */
    public void sendPasswordResetEmail(String toEmail, String resetToken, String userName) {
        try {
            String resetUrl = frontendUrl + "/reset-password?token=" + resetToken;
            
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("[Global Audition Platform] 비밀번호 재설정");
            message.setText(buildPasswordResetEmailBody(userName, resetUrl, resetToken));
            
            mailSender.send(message);
            log.info("비밀번호 재설정 이메일 발송 완료: {}", toEmail);
        } catch (Exception e) {
            log.error("비밀번호 재설정 이메일 발송 실패: {}", toEmail, e);
            throw new RuntimeException("이메일 발송 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }

    /**
     * 비밀번호 재설정 이메일 본문 생성
     */
    private String buildPasswordResetEmailBody(String userName, String resetUrl, String resetToken) {
        return String.format(
            "안녕하세요 %s님,\n\n" +
            "비밀번호 재설정을 요청하셨습니다.\n\n" +
            "아래 링크를 클릭하여 비밀번호를 재설정해주세요:\n" +
            "%s\n\n" +
            "링크는 1시간 동안 유효합니다.\n\n" +
            "만약 비밀번호 재설정을 요청하지 않으셨다면, 이 이메일을 무시하셔도 됩니다.\n\n" +
            "감사합니다.\n" +
            "Global Audition Platform",
            userName != null ? userName : "고객",
            resetUrl
        );
    }
}
