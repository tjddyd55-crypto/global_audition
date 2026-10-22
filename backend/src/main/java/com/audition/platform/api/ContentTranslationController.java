package com.audition.platform.api;

import com.audition.platform.application.i18n.content.ContentTranslationLimitException;
import com.audition.platform.application.i18n.content.ContentTranslationService;
import com.audition.platform.application.i18n.content.ContentTranslationView;
import com.audition.platform.infra.SecurityUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/content-translations")
public class ContentTranslationController {

    private final ContentTranslationService service;

    public ContentTranslationController(ContentTranslationService service) {
        this.service = service;
    }

    @GetMapping("/{contentType}/{contentId}")
    public ContentTranslationView read(
            @PathVariable String contentType,
            @PathVariable UUID contentId,
            @RequestParam(value = "locale", required = false) String locale,
            @RequestParam(value = "original", defaultValue = "false") boolean original) {
        return service.read(contentType, contentId, locale, original, SecurityUtils.getCurrentUserId());
    }

    @PostMapping("/{contentType}/{contentId}/jobs")
    public ContentTranslationView retry(
            @PathVariable String contentType,
            @PathVariable UUID contentId,
            @RequestBody(required = false) Map<String, Object> body) {
        String locale = body == null || body.get("locale") == null ? null : String.valueOf(body.get("locale"));
        boolean force = body != null && Boolean.TRUE.equals(body.get("force"));
        return service.retry(contentType, contentId, locale, force, SecurityUtils.getCurrentUserId());
    }

    @PutMapping("/{contentType}/{contentId}/{locale}")
    public ContentTranslationView saveManual(
            @PathVariable String contentType,
            @PathVariable UUID contentId,
            @PathVariable String locale,
            @RequestBody Map<String, String> fields) {
        return service.saveManual(contentType, contentId, locale, fields, SecurityUtils.getCurrentUserId());
    }

    @ExceptionHandler(ContentTranslationLimitException.class)
    public ResponseEntity<Map<String, String>> limit(ContentTranslationLimitException ex) {
        return ResponseEntity.status(ex.getStatus()).body(Map.of("code", ex.getCode()));
    }
}
