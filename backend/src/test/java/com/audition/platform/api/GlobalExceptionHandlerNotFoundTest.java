package com.audition.platform.api;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import static org.junit.jupiter.api.Assertions.assertEquals;

class GlobalExceptionHandlerNotFoundTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void unmappedPathIs404() {
        MockHttpServletRequest req = new MockHttpServletRequest("GET", "/api/no-such-endpoint");
        var res = handler.handleNotFound(new NoResourceFoundException(HttpMethod.GET, "api/no-such-endpoint"), req);
        assertEquals(404, res.getStatusCode().value());
    }

    @Test
    void realServerErrorStays500() {
        MockHttpServletRequest req = new MockHttpServletRequest("GET", "/api/auditions");
        var res = handler.handleException(new IllegalStateException("boom"), req);
        assertEquals(500, res.getStatusCode().value());
    }
}
