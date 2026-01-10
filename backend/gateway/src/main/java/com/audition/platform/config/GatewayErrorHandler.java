package com.audition.platform.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.web.reactive.error.ErrorWebExceptionHandler;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

@Component
@Order(-2) // 높은 우선순위 (기본 에러 핸들러보다 먼저 실행)
public class GatewayErrorHandler implements ErrorWebExceptionHandler {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public Mono<Void> handle(ServerWebExchange exchange, Throwable ex) {
        System.err.println("========================================");
        System.err.println("=== GATEWAY ERROR HANDLER ===");
        System.err.println("========================================");
        System.err.println("Request Path: " + exchange.getRequest().getPath());
        System.err.println("Request Method: " + exchange.getRequest().getMethod());
        System.err.println("Request URI: " + exchange.getRequest().getURI());
        System.err.println("Exception Type: " + ex.getClass().getName());
        System.err.println("Exception Message: " + (ex.getMessage() != null ? ex.getMessage() : "null"));
        
        // Cause 체인 전체 출력 (최대 5단계)
        Throwable cause = ex.getCause();
        int depth = 0;
        while (cause != null && depth < 5) {
            System.err.println("Cause [" + depth + "] Type: " + cause.getClass().getName());
            System.err.println("Cause [" + depth + "] Message: " + (cause.getMessage() != null ? cause.getMessage() : "null"));
            cause = cause.getCause();
            depth++;
        }
        
        System.err.println("=== Full Stack Trace ===");
        ex.printStackTrace();
        System.err.println("========================================");

        // 에러 응답 생성
        DataBufferFactory bufferFactory = exchange.getResponse().bufferFactory();
        
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
        errorResponse.put("error", "Gateway Error");
        errorResponse.put("message", ex.getMessage() != null ? ex.getMessage() : "알 수 없는 에러");
        errorResponse.put("exceptionType", ex.getClass().getName());
        
        if (ex.getCause() != null) {
            errorResponse.put("causeType", ex.getCause().getClass().getName());
            errorResponse.put("causeMessage", ex.getCause().getMessage());
        }
        
        errorResponse.put("path", exchange.getRequest().getPath().value());
        errorResponse.put("method", exchange.getRequest().getMethod().name());
        
        try {
            byte[] errorBytes = objectMapper.writeValueAsBytes(errorResponse);
            DataBuffer buffer = bufferFactory.wrap(errorBytes);
            
            exchange.getResponse().setStatusCode(HttpStatus.INTERNAL_SERVER_ERROR);
            exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
            exchange.getResponse().getHeaders().setContentLength(errorBytes.length);
            
            return exchange.getResponse().writeWith(Mono.just(buffer));
        } catch (Exception e) {
            System.err.println("Failed to serialize error response: " + e.getMessage());
            e.printStackTrace();
            
            String errorMessage = "{\"status\":500,\"error\":\"Gateway Error\",\"message\":\"" + 
                (ex.getMessage() != null ? ex.getMessage().replace("\"", "\\\"") : "알 수 없는 에러") + "\"}";
            DataBuffer buffer = bufferFactory.wrap(errorMessage.getBytes(StandardCharsets.UTF_8));
            
            exchange.getResponse().setStatusCode(HttpStatus.INTERNAL_SERVER_ERROR);
            exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
            
            return exchange.getResponse().writeWith(Mono.just(buffer));
        }
    }
}
