package com.audition.platform.api.dto.payment;

public class PaymentConnectionTestResult {

    public static final String TEST_CONNECTED = "TEST CONNECTED";
    public static final String LIVE_CONNECTED = "LIVE CONNECTED";
    public static final String INVALID_KEY = "INVALID KEY";
    public static final String CONFIG_INCOMPLETE = "CONFIG INCOMPLETE";

    private String result;
    private String environment;
    private boolean connected;

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

    public boolean isConnected() {
        return connected;
    }

    public void setConnected(boolean connected) {
        this.connected = connected;
    }
}
