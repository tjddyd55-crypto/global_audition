package com.audition.platform.api;

import com.audition.platform.api.dto.TranslationProbeView;
import com.audition.platform.api.dto.TranslationSettingsPatchRequest;
import com.audition.platform.api.dto.TranslationSettingsView;
import com.audition.platform.api.dto.TranslationUsageView;
import com.audition.platform.application.i18n.translation.GoogleCloudTranslationProvider;
import com.audition.platform.application.i18n.translation.TranslationSettingsService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/translation-settings")
public class AdminTranslationSettingsController {

    private final TranslationSettingsService translationSettingsService;
    private final GoogleCloudTranslationProvider google;

    public AdminTranslationSettingsController(
            TranslationSettingsService translationSettingsService,
            GoogleCloudTranslationProvider google) {
        this.translationSettingsService = translationSettingsService;
        this.google = google;
    }

    @GetMapping
    public TranslationSettingsView get() {
        return translationSettingsService.view();
    }

    @PatchMapping
    public TranslationSettingsView patch(@RequestBody TranslationSettingsPatchRequest request) {
        return translationSettingsService.update(request);
    }

    @PostMapping("/google/connection-test")
    public TranslationProbeView testGoogle() {
        return google.testConnection();
    }

    @GetMapping("/google/languages")
    public TranslationProbeView googleLanguages() {
        return google.supportedLanguages();
    }

    @GetMapping("/usage")
    public TranslationUsageView usage(@RequestParam(required = false) String month) {
        return translationSettingsService.monthlyUsage(month);
    }
}
