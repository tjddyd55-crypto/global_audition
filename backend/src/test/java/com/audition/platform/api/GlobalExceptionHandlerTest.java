package com.audition.platform.api;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class GlobalExceptionHandlerTest {

    @Test
    void accessDeniedIsOneLineWithoutStack() {
        GlobalExceptionHandler handler = new GlobalExceptionHandler();
        Logger logger = (Logger) LoggerFactory.getLogger(GlobalExceptionHandler.class);
        ListAppender<ILoggingEvent> appender = new ListAppender<>();
        appender.start();
        logger.addAppender(appender);
        try {
            MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/admin/agencies");
            ResponseStatusException denied = new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "ACCESS_DENIED", new IllegalStateException("jwt-secret-value"));

            ResponseEntity<?> response = handler.handleResponseStatus(denied, request);

            assertEquals(403, response.getStatusCode().value());
            assertEquals(1, appender.list.size());
            ILoggingEvent event = appender.list.get(0);
            assertTrue(event.getLevel() == Level.WARN || event.getLevel() == Level.DEBUG);
            assertNull(event.getThrowableProxy());
            assertFalse(event.getFormattedMessage().contains("\n"));
            assertTrue(event.getFormattedMessage().contains("AccessDenied"));
            assertTrue(event.getFormattedMessage().contains("ACCESS_DENIED"));
            assertFalse(event.getFormattedMessage().contains("jwt-secret-value"));
        } finally {
            logger.detachAppender(appender);
        }
    }

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
