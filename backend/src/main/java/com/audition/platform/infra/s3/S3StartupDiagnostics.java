package com.audition.platform.infra.s3;

import com.audition.platform.application.storage.R2ImageUploadService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * R2(이미지) 및 향후 AWS S3(파일) 설정 요약 — 업로드 API 미동작 시 원인 파악용.
 */
@Component
public class S3StartupDiagnostics {

    private static final Logger log = LoggerFactory.getLogger(S3StartupDiagnostics.class);

    @EventListener(ApplicationReadyEvent.class)
    public void onReady(ApplicationReadyEvent event) {
        Environment env = event.getApplicationContext().getEnvironment();

        String r2Bucket = env.getProperty("app.r2.bucket", "");
        String r2Public = env.getProperty("app.r2.public-url", "");
        String r2Endpoint = env.getProperty("app.r2.endpoint", "");
        boolean r2ServiceUp =
                event.getApplicationContext().getBeanNamesForType(R2ImageUploadService.class).length > 0;

        log.info(
                "R2 CONFIG → bucket={}, publicUrlConfigured={}, endpointConfigured={}, imageUploadReady={}",
                r2Bucket.isBlank() ? "(empty)" : r2Bucket,
                StringUtils.hasText(r2Public),
                StringUtils.hasText(r2Endpoint),
                r2ServiceUp
        );
        if (!r2ServiceUp) {
            log.warn(
                    "R2 image upload disabled: set R2_ENDPOINT, R2_BUCKET, R2_ACCESS_KEY, R2_SECRET_KEY, R2_PUBLIC_URL "
                            + "(and AWS_REGION for signing, e.g. auto)."
            );
        }

        boolean s3ClientOn = env.getProperty("app.s3.client-enabled", "false").equalsIgnoreCase("true");
        if (s3ClientOn) {
            String s3Bucket = env.getProperty("app.s3.bucket", "");
            String s3Region = env.getProperty("app.s3.region", "");
            log.info("AWS S3 file client enabled → bucket={}, region={}", s3Bucket, s3Region);
        }
    }
}
