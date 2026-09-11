package com.audition.platform.application.i18n;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * 콘텐츠 로케일: 명시적 {@code locale} 쿼리 또는 {@code X-Content-Locale} 만 사용.
 * Accept-Language 로 기존 API 응답을 바꾸지 않는다.
 */
@Component
public class ContentLocaleResolver {

    public static final String QUERY_PARAM = "locale";
    public static final String HEADER = "X-Content-Locale";

    public String resolve() {
        ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attrs == null) {
            return ContentLocales.DEFAULT;
        }
        return resolve(attrs.getRequest());
    }

    public String resolve(HttpServletRequest request) {
        if (request == null) {
            return ContentLocales.DEFAULT;
        }
        String query = request.getParameter(QUERY_PARAM);
        if (ContentLocales.isSupported(query)) {
            return ContentLocales.normalize(query);
        }
        String header = request.getHeader(HEADER);
        if (ContentLocales.isSupported(header)) {
            return ContentLocales.normalize(header);
        }
        return ContentLocales.DEFAULT;
    }
}
