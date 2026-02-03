package com.audition.platform.infrastructure.translation;

/**
 * 번역 Provider 인터페이스
 * 작업: 2026_09_translation_system
 */
public interface TranslationProvider {
    
    /**
     * 번역 수행
     * 
     * @param sourceText 원문
     * @param sourceLocale 원문 언어 코드 (예: "ko", "en")
     * @param targetLocale 대상 언어 코드 (예: "en", "ja")
     * @return 번역된 텍스트
     */
    String translate(String sourceText, String sourceLocale, String targetLocale);
    
    /**
     * Provider 이름
     */
    String getName();
    
    /**
     * Provider가 사용 가능한지 확인
     */
    boolean isAvailable();
}
