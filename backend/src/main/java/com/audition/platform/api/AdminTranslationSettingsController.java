package com.audition.platform.api;

import com.audition.platform.api.dto.TranslationSettingsPatchRequest;
import com.audition.platform.api.dto.TranslationSettingsView;
import com.audition.platform.application.i18n.translation.TranslationSettingsService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/translation-settings")
public class AdminTranslationSettingsController {

    private final TranslationSettingsService translationSettingsService;

    public AdminTranslationSettingsController(TranslationSettingsService translationSettingsService) {
        this.translationSettingsService = translationSettingsService;
    }

    @GetMapping
    public TranslationSettingsView get() {
        return translationSettingsService.view();
    }

    @PatchMapping
    public TranslationSettingsView patch(@RequestBody TranslationSettingsPatchRequest request) {
        return translationSettingsService.update(request);
    }
}
