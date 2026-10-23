package com.audition.platform.application.i18n;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * 오디션 오버레이용 콘텐츠 로케일. 명시적 {@code locale} 쿼리 또는 {@code X-Content-Locale} 만 사용한다.
 * 신호가 없으면 UI 와 같은 기본값(en)을 쓴다. 저장된 원문 로케일은 바꾸지 않는다.
 * Accept-Language 로 기존 API 응답을 바꾸지 않는다.
 */
@Component
public class ContentLocaleResolver {

    public static final String QUERY_PARAM = "locale";
    public static final String HEADER = "X-Content-Locale";

    private final LocaleRegistry localeRegistry;

    public ContentLocaleResolver(LocaleRegistry localeRegistry) {
        this.localeRegistry = localeRegistry;
    }

    public String resolve() {
        ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attrs == null) {
            return localeRegistry.viewingDefault();
        }
        return resolve(attrs.getRequest());
    }

    public String resolve(HttpServletRequest request) {
        if (request == null) {
            return localeRegistry.viewingDefault();
        }
        String query = request.getParameter(QUERY_PARAM);
        if (ContentLocales.isSupported(query)) {
            return ContentLocales.normalize(query);
        }
        String header = request.getHeader(HEADER);
        if (ContentLocales.isSupported(header)) {
            return ContentLocales.normalize(header);
        }
        return localeRegistry.viewingDefault();
    }
}
