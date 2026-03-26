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
 * 원본 1건 + medium(800)·thumb(300) 파생, CDN 장기 캐시 헤더 부여.
 */
public class R2ImageUploadService {

    private static final Logger log = LoggerFactory.getLogger(R2ImageUploadService.class);

    /** R2·CDN 앞단 캐시 (객체 키에 UUID 포함으로 immutable 안전) */
    public static final String CDN_CACHE_CONTROL = "public, max-age=31536000, immutable";

    /** 로그/알림에서 필터링하기 위한 고정 토큰 */
    public static final String LOG_VARIANT_FAILED = "image_upload_variant_failed";

    private final S3Client r2Client;
    private final UploadProperties uploadProperties;

    @Value("${app.r2.bucket}")
    private String bucket;

    @Value("${app.r2.public-url}")
    private String publicBaseUrl;

    public R2ImageUploadService(@Qualifier("r2S3Client") S3Client r2Client, UploadProperties uploadProperties) {
        this.r2Client = r2Client;
        this.uploadProperties = uploadProperties;
    }

    public ImageUploadResult upload(MultipartFile file, ImageUploadDirectory directory) {
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
        long maxBytes = uploadProperties.getMaxImageBytes();
        if (file.getSize() > maxBytes) {
            long mbRounded = Math.max(1, (maxBytes + 1024 * 1024 - 1) / (1024 * 1024));
            throw new ResponseStatusException(
                    HttpStatus.PAYLOAD_TOO_LARGE,
                    "이미지는 최대 " + mbRounded + "MB까지 업로드할 수 있습니다."
            );
        }

        byte[] originalBytes;
        try {
            originalBytes = file.getBytes();
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "파일을 읽을 수 없습니다.");
        }

        String safeOriginal = safeClientFilename(file.getOriginalFilename());
        String tail = safeOriginal.isEmpty() ? extensionFor(file, contentType) : "_" + safeOriginal;
        String id = UUID.randomUUID().toString();
        String origKey = directory.keyPrefix() + id + tail;

        log.info("R2 업로드 실행 → bucket={} key={}", bucket.trim(), origKey);
        try {
            putObject(origKey, originalBytes, contentType);

            String origUrl = publicUrlFor(origKey);
            boolean pngDeriv = ImageVariantGenerator.usePngDerivatives(contentType);
            String derivExt = ImageVariantGenerator.derivativeExtension(pngDeriv);
            String derivMime = ImageVariantGenerator.derivativeMime(pngDeriv);
            String medKey = directory.keyPrefix() + "m/" + id + replaceExtension(tail, derivExt);
            String thumbKey = directory.keyPrefix() + "t/" + id + replaceExtension(tail, derivExt);

            try {
                int medEdge = uploadProperties.getMediumMaxEdgePx();
                int thumbEdge = uploadProperties.getThumbMaxEdgePx();
                byte[] mediumBytes = ImageVariantGenerator.resizeFromOriginalBytes(originalBytes, medEdge, pngDeriv);
                byte[] thumbBytes = ImageVariantGenerator.resizeFromOriginalBytes(originalBytes, thumbEdge, pngDeriv);
                putObject(medKey, mediumBytes, derivMime);
                putObject(thumbKey, thumbBytes, derivMime);
                return new ImageUploadResult(origUrl, publicUrlFor(medKey), publicUrlFor(thumbKey));
            } catch (Exception e) {
                log.warn(
                        "{} reason=resize_or_put bucket={} origKey={} contentType={} medKey={} thumbKey={}",
                        LOG_VARIANT_FAILED,
                        bucket.trim(),
                        origKey,
                        contentType,
                        medKey,
                        thumbKey,
                        e
                );
                return new ImageUploadResult(origUrl, origUrl, origUrl);
            }
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("R2 업로드 실패 bucket={} key={}", bucket, origKey, e);
            throw new RuntimeException("R2 업로드 실패 - bucket=" + bucket.trim(), e);
        }
    }

    private void putObject(String key, byte[] body, String contentType) {
        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(bucket.trim())
                .key(key)
                .contentType(contentType)
                .contentLength((long) body.length)
                .cacheControl(CDN_CACHE_CONTROL)
                .build();
        r2Client.putObject(request, RequestBody.fromBytes(body));
    }

    static String replaceExtension(String tail, String newExt) {
        if (tail == null || tail.isBlank()) {
            return newExt.startsWith(".") ? newExt : "." + newExt;
        }
        int d = tail.lastIndexOf('.');
        String ext = newExt.startsWith(".") ? newExt : "." + newExt;
        if (d < 0) {
            return tail + ext;
        }
        return tail.substring(0, d) + ext;
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
