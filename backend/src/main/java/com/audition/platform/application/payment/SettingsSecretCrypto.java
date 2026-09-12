package com.audition.platform.application.payment;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * 결제 시크릿 저장용 AES-GCM.
 * 새 KMS를 만들지 않고 기존 {@code app.jwt.secret} 재료만 해시해 키로 쓴다.
 */
@Component
public class SettingsSecretCrypto {

    private static final int GCM_IV_LEN = 12;
    private static final int GCM_TAG_BITS = 128;

    private final byte[] key;
    private final SecureRandom random = new SecureRandom();

    public SettingsSecretCrypto(@Value("${app.jwt.secret}") String jwtSecret) {
        try {
            this.key = MessageDigest.getInstance("SHA-256").digest(jwtSecret.getBytes(StandardCharsets.UTF_8));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("결제 시크릿 키를 준비할 수 없습니다.", e);
        }
    }

    public String encrypt(String plaintext) {
        if (plaintext == null || plaintext.isBlank()) {
            return null;
        }
        try {
            byte[] iv = new byte[GCM_IV_LEN];
            random.nextBytes(iv);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, new SecretKeySpec(key, "AES"), new GCMParameterSpec(GCM_TAG_BITS, iv));
            byte[] enc = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));
            byte[] packed = new byte[iv.length + enc.length];
            System.arraycopy(iv, 0, packed, 0, iv.length);
            System.arraycopy(enc, 0, packed, iv.length, enc.length);
            return Base64.getEncoder().encodeToString(packed);
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("결제 시크릿을 암호화할 수 없습니다.", e);
        }
    }

    public String decrypt(String cipherText) {
        if (cipherText == null || cipherText.isBlank()) {
            return null;
        }
        try {
            byte[] packed = Base64.getDecoder().decode(cipherText);
            byte[] iv = new byte[GCM_IV_LEN];
            System.arraycopy(packed, 0, iv, 0, GCM_IV_LEN);
            byte[] enc = new byte[packed.length - GCM_IV_LEN];
            System.arraycopy(packed, GCM_IV_LEN, enc, 0, enc.length);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, new SecretKeySpec(key, "AES"), new GCMParameterSpec(GCM_TAG_BITS, iv));
            return new String(cipher.doFinal(enc), StandardCharsets.UTF_8);
        } catch (GeneralSecurityException | RuntimeException e) {
            throw new IllegalStateException("결제 시크릿을 복호화할 수 없습니다.", e);
        }
    }

    public static String maskSecret(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String v = raw.trim();
        if (v.length() <= 8) {
            return "****" + v.substring(Math.max(0, v.length() - 2));
        }
        return v.substring(0, 8) + "****" + v.substring(v.length() - 4);
    }
}
