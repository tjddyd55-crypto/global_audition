package com.audition.platform.infra;

import jakarta.servlet.http.HttpServletRequest;

/** 리버스 프록시 뒤에서 실클라이언트 IP 추출. */
public final class ClientIpResolver {

    private ClientIpResolver() {}

    public static String resolve(HttpServletRequest request) {
        if (request == null) {
            return "";
        }
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            int comma = xff.indexOf(',');
            String first = comma > 0 ? xff.substring(0, comma) : xff;
            return first.trim();
        }
        String real = request.getHeader("X-Real-IP");
        if (real != null && !real.isBlank()) {
            return real.trim();
        }
        String ra = request.getRemoteAddr();
        return ra != null ? ra.trim() : "";
    }
}
