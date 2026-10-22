package com.audition.platform.application.i18n.translation;

/**
 * 공급자 응답의 사용량. 호출하지 않은 시도에는 null 을 둔다.
 * billedCharacters 는 글자 과금 공급자에만 채운다. 토큰 공급자는 null 이다.
 */
public record ProviderUsage(
        Integer promptTokens,
        Integer completionTokens,
        Integer totalTokens,
        Integer billedCharacters) {

    public ProviderUsage(Integer promptTokens, Integer completionTokens, Integer totalTokens) {
        this(promptTokens, completionTokens, totalTokens, null);
    }
}
