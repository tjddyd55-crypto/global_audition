package com.audition.platform.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
public class GatewayController {

    @GetMapping("/")
    public ResponseEntity<Map<String, Object>> root() {
        Map<String, Object> response = new HashMap<>();
        response.put("message", "API Gateway is running");
        response.put("status", "UP");
        response.put("version", "1.0.0");
        
        Map<String, String> endpoints = new HashMap<>();
        endpoints.put("health", "/actuator/health");
        endpoints.put("userService", "/api/v1/auth/**");
        endpoints.put("auditionService", "/api/v1/auditions/**");
        endpoints.put("applicationService", "/api/v1/applications/**");
        endpoints.put("offerService", "/api/v1/offers/**");
        endpoints.put("mediaService", "/api/v1/videos/**");
        
        response.put("endpoints", endpoints);
        
        return ResponseEntity.ok(response);
    }
}
