package com.audition.platform.application.storage;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.util.Locale;
import java.util.Set;
import java.util.UUID;

/**
 * 이미지 바이너리는 S3(또는 S3 호환)에만 저장하고, DB에는 반환된 공개 URL만 남깁니다.
 * Object ACL 미설정 — 버킷 &quot;Bucket owner enforced&quot; 및 퍼블릭 정책만 사용.
 */
@Service
@ConditionalOnBean(S3Client.class)
public class S3ImageUploadService {

    private static final Logger log = LoggerFactory.getLogger(S3ImageUploadService.class);

    private static final long MAX_BYTES = 5L * 1024 * 1024;

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp"
    );

    private final S3Client s3Client;

    @Value("${app.s3.bucket}")
    private String bucket;

    @Value("${app.s3.region}")
    private String region;

    /**
     * 비우면 {@code https://{bucket}.s3.{region}.amazonaws.com/{key}} 형식으로 조합합니다.
     * CloudFront·커스텀 도메인는 이 값으로 지정하세요.
     */
    @Value("${app.s3.public-base-url:}")
    private String publicBaseUrl;

    public S3ImageUploadService(S3Client s3Client) {
        this.s3Client = s3Client;
    }

    public String upload(MultipartFile file, ImageUploadDirectory directory) {
        requireBucketAndRegionConfigured();

        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "파일이 비어 있습니다.");
        }
        String contentType = normalizeImageContentType(file.getContentType());
        if (contentType == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNPROCESSABLE_ENTITY,
                    "허용 형식은 JPEG, PNG, WebP만 가능합니다."
            );
        }
        if (file.getSize() > MAX_BYTES) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "이미지는 최대 5MB까지 업로드할 수 있습니다.");
        }
        String ext = extensionFor(file, contentType);
        String key = directory.keyPrefix() + UUID.randomUUID() + ext;
        try {
            PutObjectRequest request = PutObjectRequest.builder()
                    .bucket(bucket.trim())
                    .key(key)
                    .contentType(contentType)
                    .contentLength(file.getSize())
                    .build();
            s3Client.putObject(
                    request,
                    RequestBody.fromInputStream(file.getInputStream(), file.getSize())
            );
        } catch (Exception e) {
            log.error("S3 업로드 실패 bucket={} region={} key={}", bucket, region, key, e);
            throw new RuntimeException(
                    "S3 업로드 실패 - bucket=" + bucket.trim() + ", region=" + region.trim(),
                    e
            );
        }
        return publicUrlFor(key);
    }

    private void requireBucketAndRegionConfigured() {
        if (bucket == null || bucket.isBlank()) {
            throw new IllegalStateException("AWS_BUCKET 설정 안됨");
        }
        if (region == null || region.isBlank()) {
            throw new IllegalStateException("AWS_REGION 설정 안됨");
        }
    }

    private String publicUrlFor(String key) {
        if (publicBaseUrl != null && !publicBaseUrl.isBlank()) {
            String base = publicBaseUrl.trim().replaceAll("/+$", "");
            return base + "/" + key;
        }
        String b = bucket.trim();
        String r = region.trim();
        return "https://" + b + ".s3." + r + ".amazonaws.com/" + key;
    }

    /**
     * @return 정규 MIME 또는 null (비허용)
     */
    private static String normalizeImageContentType(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String ct = raw.toLowerCase(Locale.ROOT).trim();
        if ("image/jpg".equals(ct) || "image/pjpeg".equals(ct)) {
            ct = "image/jpeg";
        }
        if (!ALLOWED_CONTENT_TYPES.contains(ct)) {
            return null;
        }
        return ct;
    }

    private static String extensionFor(MultipartFile file, String normalizedContentType) {
        String name = file.getOriginalFilename();
        if (name != null && name.contains(".")) {
            String ext = name.substring(name.lastIndexOf('.')).toLowerCase(Locale.ROOT);
            if (ext.matches("\\.(jpe?g|png|webp)")) {
                return ext.equals(".jpeg") ? ".jpg" : ext;
            }
        }
        return switch (normalizedContentType) {
            case "image/jpeg" -> ".jpg";
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            default -> ".jpg";
        };
    }
}
