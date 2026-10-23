package com.audition.platform.application.i18n.translation;

public class TranslationProviderException extends RuntimeException {

    private final String errorCode;

    public TranslationProviderException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public String getErrorCode() {
        return errorCode;
    }
}
