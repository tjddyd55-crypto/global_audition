package com.audition.platform.infra.s3;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;

import java.net.URI;

/**
 * Cloudflare R2 (S3 호환 API). <strong>백엔드에서만</strong> 사용 — 브라우저는 R2와 통신하지 않으므로
 * R2 버킷 CORS는 업로드 경로상 필요하지 않다.
 * <p>
 * 필수: {@code app.r2.endpoint}, bucket, access-key, secret-key.
 * 운영 호환: {@code R2_*} 우선, 비어 있으면 {@code AWS_*}/{@code AWS_S3_*} 로 폴백한다.
 * 미충족 시 빈 미등록(null 반환).
 */
@Configuration
public class R2S3ClientConfig {

    private static final Logger log = LoggerFactory.getLogger(R2S3ClientConfig.class);

    @Bean(name = "r2S3Client")
    public S3Client r2S3Client(
            @Value("${app.r2.endpoint:}") String endpoint,
            @Value("${app.r2.bucket:}") String bucket,
            @Value("${app.r2.access-key:}") String accessKey,
            @Value("${app.r2.secret-key:}") String secretKey,
            @Value("${app.r2.region:auto}") String region
    ) {
        if (!StringUtils.hasText(endpoint)) {
            log.warn("r2S3Client 미등록: app.r2.endpoint(R2_ENDPOINT 또는 AWS_S3_ENDPOINT) 비어 있음");
            return null;
        }
        if (!StringUtils.hasText(bucket)) {
            log.warn("r2S3Client 미등록: app.r2.bucket(R2_BUCKET 또는 AWS_BUCKET) 비어 있음");
            return null;
        }
        if (!StringUtils.hasText(accessKey) || !StringUtils.hasText(secretKey)) {
            log.warn("r2S3Client 미등록: R2_ACCESS_KEY/R2_SECRET_KEY 또는 AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY 비어 있음");
            return null;
        }

        String signingRegion = StringUtils.hasText(region) ? region.trim() : "auto";

        S3Client client = S3Client.builder()
                .endpointOverride(URI.create(endpoint.trim()))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(accessKey.trim(), secretKey.trim())
                ))
                .region(Region.of(signingRegion))
                .serviceConfiguration(S3Configuration.builder()
                        .pathStyleAccessEnabled(true)
                        .build())
                .build();

        log.info("R2 S3-compatible client created → bucket={}, endpoint set", bucket.trim());
        return client;
    }
}
