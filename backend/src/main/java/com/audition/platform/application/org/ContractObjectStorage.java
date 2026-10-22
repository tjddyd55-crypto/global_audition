package com.audition.platform.application.org;

import java.time.Duration;

/**
 * 계약서 비공개 객체 저장. 공개 URL 은 만들지 않는다.
 */
public interface ContractObjectStorage {

    Duration DOWNLOAD_TTL = Duration.ofMinutes(5);

    boolean ready();

    void put(String key, byte[] body, String mime);

    byte[] get(String key);

    String presignGet(String key, Duration ttl);
}
