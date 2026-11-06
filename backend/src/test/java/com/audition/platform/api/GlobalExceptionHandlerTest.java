package com.audition.platform.api;

import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class GlobalExceptionHandlerTest {

    @Test
    void invalidUuidIs400AndUnexpectedFailureStays500() {
        GlobalExceptionHandler handler = new GlobalExceptionHandler();
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/me/notifications/not-a-uuid/read");
        MethodArgumentTypeMismatchException mismatch = mock(MethodArgumentTypeMismatchException.class);
        when(mismatch.getRequiredType()).thenReturn((Class) UUID.class);

        ResponseEntity<?> badRequest = handler.handleTypeMismatch(mismatch, request);
        ResponseEntity<?> failure = handler.handleException(new IllegalStateException("boom"), request);

        assertEquals(400, badRequest.getStatusCode().value());
        assertEquals(500, failure.getStatusCode().value());
    }
}
