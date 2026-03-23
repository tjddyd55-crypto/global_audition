package com.audition.platform.infra.s3;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * S3 빈 미등록(버킷 비움) 시에도 기동 후 한 번 출력 — 업로드 503 원인 진단용.
 */
@Component
public class S3StartupDiagnostics {

    private static final Logger log = LoggerFactory.getLogger(S3StartupDiagnostics.class);

    @EventListener(ApplicationReadyEvent.class)
    public void onReady(ApplicationReadyEvent event) {
        Environment env = event.getApplicationContext().getEnvironment();
        String bucket = env.getProperty("app.s3.bucket", "");
        String region = env.getProperty("app.s3.region", "");
        log.info("S3 config (resolved) — bucket: [{}], region: [{}]", bucket, region);
        if (!StringUtils.hasText(bucket)) {
            log.warn(
                    "S3 upload API disabled: app.s3.bucket is empty. Set Railway env AWS_BUCKET (and AWS_REGION, credentials)."
            );
        }
    }
}
