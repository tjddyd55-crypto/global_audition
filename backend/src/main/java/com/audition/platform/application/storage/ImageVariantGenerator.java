package com.audition.platform.application.storage;

import net.coobird.thumbnailator.Thumbnails;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Optional;

/**
 * 원본 바이트에서 썸네일·중간 해상도 파생 이미지 생성 (PNG는 투명도 보존 위해 파생도 PNG).
 */
public final class ImageVariantGenerator {

    private ImageVariantGenerator() {
    }

    public static Optional<BufferedImage> read(byte[] data) {
        try (ByteArrayInputStream in = new ByteArrayInputStream(data)) {
            BufferedImage img = ImageIO.read(in);
            if (img == null) {
                return Optional.empty();
            }
            return Optional.of(img);
        } catch (IOException e) {
            return Optional.empty();
        }
    }

    public static byte[] resize(BufferedImage src, int maxEdge, boolean pngOutput) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        var builder = Thumbnails.of(src).size(maxEdge, maxEdge).keepAspectRatio(true);
        if (pngOutput) {
            builder.outputFormat("png").toOutputStream(baos);
        } else {
            builder.outputFormat("jpg").outputQuality(0.88f).toOutputStream(baos);
        }
        return baos.toByteArray();
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
