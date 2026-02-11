package com.audition.platform.api;

import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class HealthController {

    @GetMapping("/health")
    public Map<String, Object> health() {
        return Map.of("ok", true);
    }

    @Value("${app.version:1.0.0-SNAPSHOT}")
    private String version;

    @Value("${app.buildId:}")
    private String buildId;

    @GetMapping("/version")
    public Map<String, Object> version() {
        return Map.of(
            "version", version,
            "buildId", buildId != null && !buildId.isEmpty() ? buildId : "n/a"
        );
    }
}
