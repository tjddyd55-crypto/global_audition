package com.audition.platform.infrastructure.translation;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * 더미 번역 Provider (테스트용)
 * 작업: 2026_09_translation_system
 */
@Component
@Slf4j
public class DummyTranslationProvider implements TranslationProvider {

    @Override
    public String translate(String sourceText, String sourceLocale, String targetLocale) {
        log.info("더미 번역 수행: {} -> {}, 텍스트 길이: {}", sourceLocale, targetLocale, sourceText.length());
        
        // 더미 번역: 원문 앞에 [TRANSLATED: {targetLocale}] 접두사 추가
        // 실제 환경에서는 외부 API를 호출하지만, 여기서는 더미 응답 반환
        return String.format("[TRANSLATED: %s] %s", targetLocale.toUpperCase(), sourceText);
    }

    @Override
    public String getName() {
        return "DUMMY";
    }

    @Override
    public boolean isAvailable() {
        return true; // 더미 Provider는 항상 사용 가능
    }
}
