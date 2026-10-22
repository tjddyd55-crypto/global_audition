package com.audition.platform.application.i18n.content;

import com.audition.platform.application.i18n.translation.ProviderUsage;
import org.springframework.stereotype.Component;

/** 설정된 백만 토큰당 가격으로 추정한다. 가격이 0이면 추정액은 0이다. 실청구가 아니다. */
@Component
public class TranslationCostEstimator {

    private final TranslationQueueProperties properties;

    public TranslationCostEstimator(TranslationQueueProperties properties) {
        this.properties = properties;
    }

    public Long estimateMicroUsd(ProviderUsage usage) {
        if (usage == null || (usage.promptTokens() == null && usage.completionTokens() == null)) {
            return null;
        }
        long prompt = usage.promptTokens() == null ? 0L : usage.promptTokens();
        long completion = usage.completionTokens() == null ? 0L : usage.completionTokens();
        return (prompt * properties.getInputMicroUsdPerMillion()
                + completion * properties.getOutputMicroUsdPerMillion()) / 1_000_000L;
    }
}
