package com.audition.platform.application.storage;

import org.junit.jupiter.api.Test;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * 파생 파이프라인 스모크 테스트 — JPEG/PNG는 CI에서 항상 성공해야 함.
 * WebP·EXIF 실사진은 환경·픽스처에 의존하므로 문서화된 수동 검증을 병행한다.
 */
class ImageVariantGeneratorTest {

    @Test
    void resizeFromOriginalBytes_jpeg_nonEmpty() throws Exception {
        BufferedImage img = new BufferedImage(80, 40, BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        ImageIO.write(img, "jpg", bos);
        byte[] jpg = bos.toByteArray();
        byte[] out = ImageVariantGenerator.resizeFromOriginalBytes(jpg, 32, false);
        assertNotNull(out);
        assertTrue(out.length > 50, "리사이즈 JPEG가 비어 있지 않아야 함");
    }

    @Test
    void resizeFromOriginalBytes_png_derivativePng() throws Exception {
        BufferedImage img = new BufferedImage(60, 60, BufferedImage.TYPE_INT_ARGB);
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        ImageIO.write(img, "png", bos);
        byte[] png = bos.toByteArray();
        byte[] out = ImageVariantGenerator.resizeFromOriginalBytes(png, 30, true);
        assertNotNull(out);
        assertTrue(out.length > 0);
    }
}
