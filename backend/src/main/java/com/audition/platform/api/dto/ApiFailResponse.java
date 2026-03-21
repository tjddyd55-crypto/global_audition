package com.audition.platform.api.dto;

/**
 * SSOT 실패 응답: { "success": false, "message": "..." }
 */
public class ApiFailResponse {

    private final boolean success = false;
    private final String message;

    public ApiFailResponse(String message) {
        this.message = message;
    }

    public boolean isSuccess() {
        return success;
    }

    public String getMessage() {
        return message;
    }
}
