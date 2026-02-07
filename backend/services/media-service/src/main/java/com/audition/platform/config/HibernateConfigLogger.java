package com.audition.platform.config;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * 기동 시 실제 적용된 Hibernate ddl-auto 값을 로그로 노출.
 * 크래시 시 설정 문제(validate 등) 여부를 즉시 판별하기 위함.
 */
@Component
@Slf4j
public class HibernateConfigLogger {

    @Value("${spring.jpa.hibernate.ddl-auto}")
    private String ddlAuto;

    @PostConstruct
    public void logDdlAuto() {
        log.warn("🔥 Hibernate ddl-auto in EFFECT = {}", ddlAuto);
    }
}
