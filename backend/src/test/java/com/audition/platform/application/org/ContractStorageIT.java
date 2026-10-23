package com.audition.platform.application.org;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Assumptions;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.CreateBucketRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * 로컬 S3 호환 저장소가 떠 있을 때만 실행한다. 실 R2 자격 증명은 사용하지 않는다.
 */
class ContractStorageIT {

    @Test
    void presignedDownloadExpiresAndMatchesBytes() throws Exception {
        String endpoint = System.getenv("CONTRACT_S3_ENDPOINT");
        Assumptions.assumeTrue(endpoint != null && !endpoint.isBlank(), "local S3 endpoint is not running");
        String bucket = "contract-files-test";
        String access = "minio";
        String secret = "minio12345";
        S3Configuration pathStyle = S3Configuration.builder().pathStyleAccessEnabled(true).build();
        try (S3Client client = S3Client.builder()
                .endpointOverride(URI.create(endpoint))
                .credentialsProvider(StaticCredentialsProvider.create(AwsBasicCredentials.create(access, secret)))
                .region(Region.US_EAST_1)
                .serviceConfiguration(pathStyle)
                .build();
             S3Presigner presigner = S3Presigner.builder()
                     .endpointOverride(URI.create(endpoint))
                     .credentialsProvider(StaticCredentialsProvider.create(AwsBasicCredentials.create(access, secret)))
                     .region(Region.US_EAST_1)
                     .serviceConfiguration(pathStyle)
                     .build()) {
            try {
                client.createBucket(CreateBucketRequest.builder().bucket(bucket).build());
            } catch (Exception ignored) {
                // bucket already exists
            }
            R2ContractStorage storage = new R2ContractStorage(client, presigner, bucket);
            assertTrue(storage.ready());
            String key = "contracts/" + UUID.randomUUID() + "/file";
            byte[] body = "private-contract".getBytes(StandardCharsets.UTF_8);
            storage.put(key, body, "text/plain");
            assertEquals("private-contract", new String(storage.get(key), StandardCharsets.UTF_8));
            String url = storage.presignGet(key, ContractObjectStorage.DOWNLOAD_TTL);
            assertTrue(url.contains("X-Amz-Expires=300"));
            assertFalse(url.contains("public-read"));
            HttpResponse<String> response = HttpClient.newHttpClient().send(
                    HttpRequest.newBuilder(URI.create(url)).GET().build(),
                    HttpResponse.BodyHandlers.ofString());
            assertEquals(200, response.statusCode());
            assertEquals("private-contract", response.body());
        }
    }
}
