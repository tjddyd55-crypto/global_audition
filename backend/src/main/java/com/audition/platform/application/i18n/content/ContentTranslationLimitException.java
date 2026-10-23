package com.audition.platform.application.i18n.content;

import org.springframework.http.HttpStatus;

public class ContentTranslationLimitException extends RuntimeException {

    private final String code;
    private final HttpStatus status;

    public ContentTranslationLimitException(String code, HttpStatus status) {
        super(code);
        this.code = code;
        this.status = status;
    }

    public String getCode() {
        return code;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
