package com.audition.platform.application.i18n.content;

import com.audition.platform.application.i18n.translation.GoogleTranslationProperties;
import com.audition.platform.application.i18n.translation.ProviderUsage;
import com.audition.platform.application.i18n.translation.TranslationSettingsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/** 토큰 또는 문자 단가로 추정한다. 단가가 0이면 추정액은 0이다. 실청구가 아니다. */
@Component
public class TranslationCostEstimator {

    private final TranslationQueueProperties properties;
    private final TranslationSettingsService settings;

    public TranslationCostEstimator(TranslationQueueProperties properties) {
        this(properties, null);
    }

    @Autowired
    public TranslationCostEstimator(TranslationQueueProperties properties, TranslationSettingsService settings) {
        this.properties = properties;
        this.settings = settings;
    }

    public Long estimateMicroUsd(ProviderUsage usage) {
        if (usage == null) {
            return null;
        }
        if (usage.billedCharacters() != null) {
            long rate = settings == null
                    ? new GoogleTranslationProperties().getMicroUsdPerMillionCharacters()
                    : settings.effectiveGoogleCharacterRate();
            return usage.billedCharacters().longValue() * rate / 1_000_000L;
        }
        if (usage.promptTokens() == null && usage.completionTokens() == null) {
            return null;
        }
        long prompt = usage.promptTokens() == null ? 0L : usage.promptTokens();
        long completion = usage.completionTokens() == null ? 0L : usage.completionTokens();
        return (prompt * properties.getInputMicroUsdPerMillion()
                + completion * properties.getOutputMicroUsdPerMillion()) / 1_000_000L;
    }
}
