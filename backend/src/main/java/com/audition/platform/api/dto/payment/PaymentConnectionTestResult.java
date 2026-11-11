package com.audition.platform.api.dto.payment;

public class PaymentConnectionTestResult {

    public static final String TEST_CONNECTED = "TEST CONNECTED";
    public static final String LIVE_CONNECTED = "LIVE CONNECTED";
    public static final String INVALID_KEY = "INVALID KEY";
    public static final String CONFIG_INCOMPLETE = "CONFIG INCOMPLETE";
    public static final String UNREACHABLE = "UNREACHABLE";

    private String result;
    private String environment;
    private boolean connected;
    /** 토스 응답 원인(예: HTTP_404:NOT_FOUND_PAYMENT, HTTP_401:UNAUTHORIZED_KEY). 시크릿은 담지 않는다. */
    private String detail;

    public PaymentConnectionTestResult() {
    }

    public PaymentConnectionTestResult(String result, String environment, boolean connected) {
        this.result = result;
        this.environment = environment;
        this.connected = connected;
    }

    public String getResult() {
        return result;
    }

    public void setResult(String result) {
        this.result = result;
    }

    public String getEnvironment() {
        return environment;
    }

    public void setEnvironment(String environment) {
        this.environment = environment;
    }

    public PaymentConnectionTestResult(String result, String environment, boolean connected, String detail) {
        this(result, environment, connected);
        this.detail = detail;
    }

    public String getDetail() {
        return detail;
    }

    public void setDetail(String detail) {
        this.detail = detail;
    }

    public boolean isConnected() {
        return connected;
    }

    public void setConnected(boolean connected) {
        this.connected = connected;
    }
}
