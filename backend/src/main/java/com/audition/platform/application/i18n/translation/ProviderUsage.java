package com.audition.platform.application.i18n.translation;

/** 공급자 응답의 usage. 없으면 null. 호출하지 않은 시도에 숫자를 만들지 않는다. */
public record ProviderUsage(Integer promptTokens, Integer completionTokens, Integer totalTokens) {
}
