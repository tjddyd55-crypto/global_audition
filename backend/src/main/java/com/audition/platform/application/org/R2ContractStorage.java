package com.audition.platform.application.org;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

import java.net.URI;
import java.time.Duration;

/**
 * 기존 R2 S3 클라이언트 설정을 재사용한다. 자격 증명이 없으면 준비되지 않은 상태로 둔다.
 */
@Component
public class R2ContractStorage implements ContractObjectStorage {

    private final S3Client client;
    private final S3Presigner presigner;
    private final String bucket;

    @Autowired
    public R2ContractStorage(
            @Qualifier("r2S3Client") ObjectProvider<S3Client> clients,
            @Value("${app.r2.endpoint:}") String endpoint,
            @Value("${app.r2.bucket:}") String bucket,
            @Value("${app.r2.access-key:}") String accessKey,
            @Value("${app.r2.secret-key:}") String secretKey,
            @Value("${app.r2.region:auto}") String region) {
        S3Client existing = clients.getIfAvailable();
        if (existing == null || !StringUtils.hasText(endpoint) || !StringUtils.hasText(bucket)
                || !StringUtils.hasText(accessKey) || !StringUtils.hasText(secretKey)) {
            this.client = null;
            this.presigner = null;
            this.bucket = null;
            return;
        }
        String signingRegion = StringUtils.hasText(region) ? region.trim() : "auto";
        this.client = existing;
        this.bucket = bucket.trim();
        this.presigner = S3Presigner.builder()
                .endpointOverride(URI.create(endpoint.trim()))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(accessKey.trim(), secretKey.trim())))
                .region(Region.of(signingRegion))
                .serviceConfiguration(S3Configuration.builder().pathStyleAccessEnabled(true).build())
                .build();
    }

    public R2ContractStorage(S3Client client, S3Presigner presigner, String bucket) {
        this.client = client;
        this.presigner = presigner;
        this.bucket = bucket;
    }

    @Override
    public boolean ready() {
        return client != null && presigner != null && StringUtils.hasText(bucket);
    }

    @Override
    public void put(String key, byte[] body, String mime) {
        client.putObject(PutObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .contentType(mime)
                .build(), RequestBody.fromBytes(body));
    }

    @Override
    public byte[] get(String key) {
        return client.getObjectAsBytes(GetObjectRequest.builder().bucket(bucket).key(key).build()).asByteArray();
    }

    @Override
    public String presignGet(String key, Duration ttl) {
        GetObjectPresignRequest request = GetObjectPresignRequest.builder()
                .signatureDuration(ttl)
                .getObjectRequest(GetObjectRequest.builder().bucket(bucket).key(key).build())
                .build();
        return presigner.presignGetObject(request).url().toString();
    }
}
