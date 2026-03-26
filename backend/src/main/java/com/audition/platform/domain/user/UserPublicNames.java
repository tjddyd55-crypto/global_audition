package com.audition.platform.domain.user;

/**
 * 공개 표시명: 닉네임만 사용. 레거시/비상 시 이메일 로컬파트 폴백(전체 이메일 비노출).
 * 실명({@code legalName})은 일반 공개 UI에 넣지 않는다.
 */
public final class UserPublicNames {

    private UserPublicNames() {
    }

    public static String computePublicDisplay(String nickname, @SuppressWarnings("unused") String legalName, String email) {
        if (nickname != null && !nickname.isBlank()) {
            return nickname.trim();
        }
        if (email != null && !email.isBlank()) {
            int at = email.indexOf('@');
            if (at > 0) {
                return email.substring(0, at).trim();
            }
            return email.trim();
        }
        return "사용자";
    }
}
