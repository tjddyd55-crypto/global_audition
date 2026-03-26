package com.audition.platform.application.storage;

import net.coobird.thumbnailator.Thumbnails;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;

/**
 * 원본 바이트에서 썸네일·중간 해상도 파생 이미지 생성.
 * {@link Thumbnails}{@code .of(InputStream).useExifOrientation(true)} 로 JPEG EXIF 회전 반영(iPhone 등).
 * PNG 파생은 PNG 유지, 그 외(JPEG/WebP 등) 파생은 JPEG.
 */
public final class ImageVariantGenerator {

    private static final Logger log = LoggerFactory.getLogger(ImageVariantGenerator.class);

    private ImageVariantGenerator() {
    }

    /**
     * 원본 바이트 스트림에서 리사이즈. WebP 등은 ImageIO SPI(예: twelvemonkeys)에 의존 — 환경별로 실패할 수 있음.
     */
    public static byte[] resizeFromOriginalBytes(byte[] data, int maxEdge, boolean pngOutput) throws IOException {
        if (data == null || data.length == 0) {
            throw new IOException("empty image bytes");
        }
        try (InputStream in = new ByteArrayInputStream(data)) {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            var builder = Thumbnails.of(in)
                    .size(maxEdge, maxEdge)
                    .keepAspectRatio(true)
                    .useExifOrientation(true);
            if (pngOutput) {
                builder.outputFormat("png").toOutputStream(baos);
            } else {
                builder.outputFormat("jpg").outputQuality(0.88f).toOutputStream(baos);
            }
            return baos.toByteArray();
        } catch (IOException e) {
            log.debug("resizeFromOriginalBytes 실패 maxEdge={} pngOut={}", maxEdge, pngOutput, e);
            throw e;
        }
    }

    public static String derivativeMime(boolean pngOutput) {
        return pngOutput ? "image/png" : "image/jpeg";
    }

    public static String derivativeExtension(boolean pngOutput) {
        return pngOutput ? ".png" : ".jpg";
    }

    public static boolean usePngDerivatives(String normalizedContentType) {
        return "image/png".equals(normalizedContentType);
    }
}
