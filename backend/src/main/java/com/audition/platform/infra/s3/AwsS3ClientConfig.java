package com.audition.platform.infra.s3;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
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
 * {@code app.s3.bucket} 이 비어 있지 않을 때만 S3 클라이언트 등록.
 * <p>
 * 자격 증명: {@code AWS_ACCESS_KEY} + {@code AWS_SECRET_KEY} (또는 표준
 * {@code AWS_ACCESS_KEY_ID} + {@code AWS_SECRET_ACCESS_KEY})가 있으면 StaticCredentialsProvider,
 * 없으면 {@link DefaultCredentialsProvider} (IAM 역할, ~/.aws/credentials 등).
 * </p>
 * MinIO 등은 {@code app.s3.endpoint} + path-style.
 */
@Configuration
@ConditionalOnExpression("T(org.springframework.util.StringUtils).hasText('${app.s3.bucket:}')")
public class AwsS3ClientConfig {

    @Bean
    public S3Client s3Client(
            @Value("${app.s3.region:ap-northeast-2}") String region,
            @Value("${app.s3.endpoint:}") String endpoint,
            @Value("${AWS_ACCESS_KEY:}") String accessKeyLegacy,
            @Value("${AWS_SECRET_KEY:}") String secretKeyLegacy,
            @Value("${AWS_ACCESS_KEY_ID:}") String accessKeyId,
            @Value("${AWS_SECRET_ACCESS_KEY:}") String secretAccessKey
    ) {
        var builder = S3Client.builder().region(Region.of(region.trim()));

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
        return builder.build();
    }
}
