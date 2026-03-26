package com.audition.platform.application.storage;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.util.Locale;
import java.util.UUID;

/**
 * 이미지 저장: 브라우저 → 백엔드 API → R2(S3 호환 PutObject) 만 사용합니다.
 * 객체 key는 서버에서만 생성하고, 공개 URL은 {@code app.r2.public-url} + "/" + key 입니다(presigned 미사용).
 */
public class R2ImageUploadService {

    private static final Logger log = LoggerFactory.getLogger(R2ImageUploadService.class);

    private static final long MAX_BYTES = 5L * 1024 * 1024;

    private final S3Client r2Client;

    @Value("${app.r2.bucket}")
    private String bucket;

    @Value("${app.r2.public-url}")
    private String publicBaseUrl;

    public R2ImageUploadService(@Qualifier("r2S3Client") S3Client r2Client) {
        this.r2Client = r2Client;
    }

    public String upload(MultipartFile file, ImageUploadDirectory directory) {
        requireR2Configured();

        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "파일이 비어 있습니다.");
        }
        String contentType = ImageContentTypes.normalize(file.getContentType());
        if (contentType == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "이미지 파일만 업로드 가능합니다 (JPEG, PNG, WebP)."
            );
        }
        if (file.getSize() > MAX_BYTES) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "이미지는 최대 5MB까지 업로드할 수 있습니다.");
        }

        String safeOriginal = safeClientFilename(file.getOriginalFilename());
        String tail = safeOriginal.isEmpty() ? extensionFor(file, contentType) : "_" + safeOriginal;
        String key = directory.keyPrefix() + UUID.randomUUID() + tail;

        log.info("R2 업로드 실행 → bucket={} key={}", bucket.trim(), key);
        try {
            PutObjectRequest request = PutObjectRequest.builder()
                    .bucket(bucket.trim())
                    .key(key)
                    .contentType(contentType)
                    .contentLength(file.getSize())
                    .build();
            r2Client.putObject(
                    request,
                    RequestBody.fromInputStream(file.getInputStream(), file.getSize())
            );
        } catch (Exception e) {
            log.error("R2 업로드 실패 bucket={} key={}", bucket, key, e);
            throw new RuntimeException(
                    "R2 업로드 실패 - bucket=" + bucket.trim(),
                    e
            );
        }
        return publicUrlFor(key);
    }

    /**
     * 경로 구분자·{@code ..} 제거 후 안전한 파일명만 허용. 비정상이면 빈 문자열 → 확장자만 사용.
     */
    static String safeClientFilename(String original) {
        if (original == null || original.isBlank()) {
            return "";
        }
        String n = original.replace('\\', '/');
        int slash = n.lastIndexOf('/');
        if (slash >= 0) {
            n = n.substring(slash + 1);
        }
        n = n.trim();
        if (n.isEmpty() || n.contains("..")) {
            return "";
        }
        if (!n.matches("^[a-zA-Z0-9._-]{1,200}$")) {
            return "";
        }
        return n;
    }

    private void requireR2Configured() {
        if (bucket == null || bucket.isBlank()) {
            throw new RuntimeException("R2_BUCKET 없음");
        }
        if (publicBaseUrl == null || publicBaseUrl.isBlank()) {
            throw new RuntimeException("R2_PUBLIC_URL 없음");
        }
    }

    private String publicUrlFor(String key) {
        String base = publicBaseUrl.trim().replaceAll("/+$", "");
        return base + "/" + key;
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
