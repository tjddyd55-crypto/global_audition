package com.audition.platform.application.i18n.content;

import java.util.Map;
import java.util.UUID;

public record ContentTranslationView(
        String contentType,
        UUID contentId,
        String sourceLocale,
        String requestedLocale,
        String resolvedLocale,
        boolean fallback,
        boolean showingOriginal,
        boolean stale,
        String status,
        String origin,
        String errorCode,
        Map<String, String> fields,
        UUID jobId) {
}
