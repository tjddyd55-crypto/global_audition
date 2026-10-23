package com.audition.platform.application.payment;

public class TossPaymentsException extends RuntimeException {

    private final int httpStatus;
    private final String tossCode;

    public TossPaymentsException(int httpStatus, String tossCode, String message) {
        super(message);
        this.httpStatus = httpStatus;
        this.tossCode = tossCode;
    }

    public int getHttpStatus() {
        return httpStatus;
    }

    public String getTossCode() {
        return tossCode;
    }
}
