package com.audition.platform.application.payment;

import com.audition.platform.infra.TestJwtSecrets;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SettingsSecretCryptoTest {

    @Test
    void encryptDecryptRoundTrip() {
        SettingsSecretCrypto crypto = new SettingsSecretCrypto(TestJwtSecrets.ACCEPTABLE);
        String raw = "test_gsk_secret_value_1234";
        String cipher = crypto.encrypt(raw);
        assertTrue(cipher != null && !cipher.contains(raw));
        assertEquals(raw, crypto.decrypt(cipher));
    }

    @Test
    void maskKeepsPrefixAndLastFour() {
        String masked = SettingsSecretCrypto.maskSecret("live_gsk_ABCDEFGH1234ABCD");
        assertEquals("live_gsk****ABCD", masked);
    }

    @Test
    void maskBlankIsNull() {
        assertNull(SettingsSecretCrypto.maskSecret(" "));
        assertNull(SettingsSecretCrypto.maskSecret(null));
    }
}
