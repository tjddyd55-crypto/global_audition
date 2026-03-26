package com.audition.platform.infra.s3;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;

import java.net.URI;

/**
 * AWS S3 본연 엔드포인트(또는 호환 스토리지)용 클라이언트.
 * 이미지는 R2 전용 {@code r2S3Client} 사용 — 영상·대용량 파일 등 향후 업로드에만 켭니다.
 * {@code app.s3.client-enabled=true} 일 때만 등록됩니다.
 */
@Configuration
@ConditionalOnProperty(prefix = "app.s3", name = "client-enabled", havingValue = "true")
public class AwsS3ClientConfig {

    private static final Logger log = LoggerFactory.getLogger(AwsS3ClientConfig.class);

    @Bean(name = "awsS3Client")
    public S3Client awsS3Client(
            @Value("${app.s3.bucket}") String bucket,
            @Value("${app.s3.region}") String region,
            @Value("${app.s3.endpoint:}") String endpoint,
            @Value("${AWS_ACCESS_KEY:}") String accessKeyLegacy,
            @Value("${AWS_SECRET_KEY:}") String secretKeyLegacy,
            @Value("${AWS_ACCESS_KEY_ID:}") String accessKeyId,
            @Value("${AWS_SECRET_ACCESS_KEY:}") String secretAccessKey
    ) {
        if (bucket == null) {
            log.error("S3Client 미생성: app.s3.bucket 이 null 입니다. AWS_BUCKET 환경변수를 설정하세요.");
            return null;
        }
        if (region == null) {
            log.error("S3Client 미생성: app.s3.region 이 null 입니다. AWS_REGION 환경변수를 설정하세요.");
            return null;
        }

        String b = bucket.trim();
        String r = region.trim();
        if (!StringUtils.hasText(b)) {
            log.error("S3Client 미생성: bucket 이 비어 있습니다. AWS_BUCKET 을 비우지 마세요.");
            return null;
        }
        if (!StringUtils.hasText(r)) {
            log.error("S3Client 미생성: region 이 비어 있습니다. AWS_REGION 을 비우지 마세요.");
            return null;
        }

        var builder = S3Client.builder().region(Region.of(r));

        String ak = StringUtils.hasText(accessKeyLegacy) ? accessKeyLegacy.trim() : null;
        String sk = StringUtils.hasText(secretKeyLegacy) ? secretKeyLegacy.trim() : null;
        if (!StringUtils.hasText(ak) && StringUtils.hasText(accessKeyId)) {
            ak = accessKeyId.trim();
        }
        if (!StringUtils.hasText(sk) && StringUtils.hasText(secretAccessKey)) {
            sk = secretAccessKey.trim();
        }
        if (StringUtils.hasText(ak) && StringUtils.hasText(sk)) {
            builder.credentialsProvider(
                    StaticCredentialsProvider.create(AwsBasicCredentials.create(ak, sk))
            );
        } else {
            builder.credentialsProvider(DefaultCredentialsProvider.create());
        }

        if (endpoint != null && !endpoint.isBlank()) {
            builder = builder
                    .endpointOverride(URI.create(endpoint.trim()))
                    .serviceConfiguration(S3Configuration.builder().pathStyleAccessEnabled(true).build());
        }

        S3Client client = builder.build();
        log.info("AWS S3 file client created → bucket={}, region={}", b, r);
        return client;
    }
}
