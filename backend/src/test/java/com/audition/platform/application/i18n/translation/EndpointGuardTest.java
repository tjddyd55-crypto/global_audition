package com.audition.platform.application.i18n.translation;

import com.audition.platform.domain.audition.AuditionTranslation;
import org.junit.jupiter.api.Test;

import java.net.InetAddress;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class EndpointGuardTest {

    @Test
    void allowsConfiguredHostWhenEveryAddressIsPublic() throws Exception {
        EndpointGuard guard = guard("api.openai.com", Map.of(
                "api.openai.com", List.of(InetAddress.getByName("1.1.1.1"))));

        ResolvedEndpoint endpoint = guard.resolveForCall("https://api.openai.com/v1/chat/completions");

        assertEquals("api.openai.com", endpoint.host());
        assertEquals(443, endpoint.port());
        assertEquals("/v1/chat/completions", endpoint.pathAndQuery());
        assertTrue(guard.permits("https://api.openai.com/v1/chat/completions"));
    }

    @Test
    void rejectsHttpLocalhostMetadataAndUnlistedHost() throws Exception {
        EndpointGuard guard = guard("api.openai.com", Map.of(
                "api.openai.com", List.of(InetAddress.getByName("1.1.1.1"))));

        assertRejected(guard, "http://api.openai.com/v1/chat/completions");
        assertRejected(guard, "https://localhost/v1");
        assertRejected(guard, "https://127.0.0.1/v1");
        assertRejected(guard, "https://169.254.169.254/latest/meta-data");
        assertRejected(guard, "https://evil.example/v1");
        assertRejected(guard, "https://user:pw@api.openai.com/v1");
        assertFalse(guard.permits("http://127.0.0.1/v1"));
    }

    @Test
    void rejectsWhenAnyResolvedAddressIsPrivateOrMetadata() throws Exception {
        Map<String, List<InetAddress>> dns = Map.of(
                "api.openai.com", List.of(
                        InetAddress.getByName("1.1.1.1"),
                        InetAddress.getByName("10.1.2.3")),
                "rebind.example", List.of(InetAddress.getByName("169.254.169.254")),
                "cgnat.example", List.of(InetAddress.getByName("100.64.0.1")),
                "ula.example", List.of(InetAddress.getByName("fd00:ec2::254")),
                "mapped.example", List.of(InetAddress.getByName("::ffff:127.0.0.1")));
        EndpointGuard guard = guard("api.openai.com,rebind.example,cgnat.example,ula.example,mapped.example", dns);

        assertRejected(guard, "https://api.openai.com/v1/chat/completions");
        assertRejected(guard, "https://rebind.example/v1");
        assertRejected(guard, "https://cgnat.example/v1");
        assertRejected(guard, "https://ula.example/v1");
        assertRejected(guard, "https://mapped.example/v1");
    }

    @Test
    void resolvesAgainOnEachCall() throws Exception {
        AtomicInteger lookups = new AtomicInteger();
        DnsResolver dns = host -> {
            lookups.incrementAndGet();
            return List.of(address("8.8.8.8"));
        };
        EndpointGuard guard = new EndpointGuard("api.openai.com", dns);

        guard.resolveForCall("https://api.openai.com/v1");
        guard.resolveForCall("https://api.openai.com/v1");

        assertEquals(2, lookups.get());
    }

    @Test
    void classifiesPrivateRanges() throws Exception {
        assertTrue(EndpointGuard.isDisallowedAddress(InetAddress.getByName("127.0.0.1")));
        assertTrue(EndpointGuard.isDisallowedAddress(InetAddress.getByName("10.0.0.1")));
        assertTrue(EndpointGuard.isDisallowedAddress(InetAddress.getByName("172.16.0.1")));
        assertTrue(EndpointGuard.isDisallowedAddress(InetAddress.getByName("192.168.1.1")));
        assertTrue(EndpointGuard.isDisallowedAddress(InetAddress.getByName("169.254.169.254")));
        assertTrue(EndpointGuard.isDisallowedAddress(InetAddress.getByName("100.64.1.1")));
        assertTrue(EndpointGuard.isDisallowedAddress(InetAddress.getByName("fd00:ec2::254")));
        assertFalse(EndpointGuard.isDisallowedAddress(InetAddress.getByName("8.8.8.8")));
        assertFalse(EndpointGuard.isDisallowedAddress(InetAddress.getByName("100.128.0.1")));
    }

    @Test
    void defaultAllowlistIncludesGoogleAndStillBlocksMetadata() throws Exception {
        EndpointGuard guard = guard(EndpointGuard.DEFAULT_ALLOWED_HOSTS, Map.of(
                "api.openai.com", List.of(InetAddress.getByName("1.1.1.1")),
                "translate.googleapis.com", List.of(InetAddress.getByName("8.8.8.8")),
                "oauth2.googleapis.com", List.of(InetAddress.getByName("8.8.4.4"))));

        assertTrue(guard.permits("https://translate.googleapis.com/v3/projects/demo/locations/global:translateText"));
        assertTrue(guard.permits("https://oauth2.googleapis.com/token"));
        assertTrue(guard.permits("https://api.openai.com/v1/chat/completions"));
        assertRejected(guard, "https://metadata.google.internal/computeMetadata/v1/");
        assertRejected(guard, "https://localhost/token");
    }

    private static void assertRejected(EndpointGuard guard, String url) {
        TranslationProviderException ex = assertThrows(TranslationProviderException.class, () -> guard.resolveForCall(url));
        assertEquals(AuditionTranslation.ERROR_ENDPOINT_REJECTED, ex.getErrorCode());
    }

    private static InetAddress address(String literal) {
        try {
            return InetAddress.getByName(literal);
        } catch (Exception ex) {
            throw new IllegalStateException(ex);
        }
    }

    private static EndpointGuard guard(String allowlist, Map<String, List<InetAddress>> dns) {
        return new EndpointGuard(allowlist, host -> {
            List<InetAddress> found = dns.get(host);
            if (found == null) {
                throw new TranslationProviderException(
                        AuditionTranslation.ERROR_ENDPOINT_REJECTED,
                        "번역 엔드포인트의 DNS를 확인하지 못했습니다.");
            }
            return found;
        });
    }
}
