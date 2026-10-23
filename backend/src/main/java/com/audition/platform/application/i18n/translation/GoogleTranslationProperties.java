package com.audition.platform.application.i18n.translation;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * 글자 과금 추정 단가. 기본값은 공개된 NMT 리스트 가격을 옮긴 설정이며 청구서가 아니다.
 * 월 무료 크레딧은 여기서 빼지 않는다.
 */
@ConfigurationProperties(prefix = "app.translation.google")
public class GoogleTranslationProperties {

    private long microUsdPerMillionCharacters = 20_000_000L;

    public long getMicroUsdPerMillionCharacters() {
        return microUsdPerMillionCharacters;
    }

    public void setMicroUsdPerMillionCharacters(long microUsdPerMillionCharacters) {
        this.microUsdPerMillionCharacters = microUsdPerMillionCharacters;
    }
}
