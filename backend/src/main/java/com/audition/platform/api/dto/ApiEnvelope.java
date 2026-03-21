package com.audition.platform.api.dto;

/**
 * SSOT 성공 응답: { "success": true, "data": ... }
 */
public class ApiEnvelope<T> {

    private final boolean success = true;
    private final T data;

    private ApiEnvelope(T data) {
        this.data = data;
    }

    public static <T> ApiEnvelope<T> ok(T data) {
        return new ApiEnvelope<>(data);
    }

    public boolean isSuccess() {
        return success;
    }

    public T getData() {
        return data;
    }
}
