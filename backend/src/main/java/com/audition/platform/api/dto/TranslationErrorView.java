package com.audition.platform.api.dto;

import java.time.Instant;

/** 실패·차단 시도의 코드만. 본문, 자격 증명, 개인정보는 포함하지 않는다. */
public class TranslationErrorView {

    private String contentType;
    private String locale;
    private String status;
    private String errorCode;
    private Instant startedAt;

    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }
    public String getLocale() { return locale; }
    public void setLocale(String locale) { this.locale = locale; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getErrorCode() { return errorCode; }
    public void setErrorCode(String errorCode) { this.errorCode = errorCode; }
    public Instant getStartedAt() { return startedAt; }
    public void setStartedAt(Instant startedAt) { this.startedAt = startedAt; }
}
