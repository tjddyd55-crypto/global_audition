package com.audition.platform.infra;

import org.flywaydb.core.Flyway;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Component
public class StartupLoggingListener implements ApplicationListener<ApplicationReadyEvent> {

    private static final Logger log = LoggerFactory.getLogger(StartupLoggingListener.class);

    private final Environment env;
    private final Flyway flyway;

    public StartupLoggingListener(Environment env, Flyway flyway) {
        this.env = env;
        this.flyway = flyway;
    }

    @Override
    public void onApplicationEvent(ApplicationReadyEvent event) {
        String[] activeProfiles = env.getActiveProfiles();
        if (activeProfiles.length == 0) {
            activeProfiles = env.getDefaultProfiles();
        }
        log.info("[Startup] Active profile(s): {}", Arrays.toString(activeProfiles));

        String ddlAuto = env.getProperty("spring.jpa.hibernate.ddl-auto", "not set");
        String hbm2ddl = env.getProperty("spring.jpa.properties.hibernate.hbm2ddl.auto", "not set");
        log.info("[Startup] Effective JPA ddl-auto: {}, hbm2ddl.auto: {} (production must be 'none')", ddlAuto, hbm2ddl);

        var info = flyway.info();
        int pending = info.pending().length;
        int applied = info.applied().length;
        log.info("[Startup] Flyway migrations: {} applied, {} pending (migration success: {})",
            applied, pending, pending == 0 ? "yes" : "pending");
    }
}
