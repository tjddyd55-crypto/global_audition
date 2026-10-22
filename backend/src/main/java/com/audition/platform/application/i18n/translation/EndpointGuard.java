package com.audition.platform.application.i18n.translation;

import com.audition.platform.domain.audition.AuditionTranslation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.InetAddress;
import java.net.URI;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * 저장 시점과 호출 시점에 같은 규칙을 적용한다.
 * 허용 호스트는 설정값만 사용한다.
 * 기본 허용은 api.openai.com, translate.googleapis.com, oauth2.googleapis.com 이다.
 */
@Component
public class EndpointGuard {

    static final String DEFAULT_ALLOWED_HOSTS =
            "api.openai.com,translate.googleapis.com,oauth2.googleapis.com";

    private final Set<String> allowedHosts;
    private final DnsResolver dnsResolver;

    public EndpointGuard(
            @Value("${app.translation.allowed-hosts:" + DEFAULT_ALLOWED_HOSTS + "}") String allowedHosts,
            DnsResolver dnsResolver) {
        this.allowedHosts = parseHosts(allowedHosts);
        this.dnsResolver = dnsResolver;
    }

    public boolean permits(String url) {
        try {
            resolveForCall(url);
            return true;
        } catch (RuntimeException ex) {
            return false;
        }
    }

    public ResolvedEndpoint resolveForCall(String rawUrl) {
        URI uri = parseHttps(rawUrl);
        String host = normalizeHost(uri.getHost());
        if (isBlockedHostname(host) || isIpLiteral(host) || !allowedHosts.contains(host)) {
            throw rejected();
        }
        int port = uri.getPort() == -1 ? 443 : uri.getPort();
        if (port < 1 || port > 65535) {
            throw rejected();
        }
        String path = uri.getRawPath() == null || uri.getRawPath().isEmpty() ? "/" : uri.getRawPath();
        if (path.indexOf('\r') >= 0 || path.indexOf('\n') >= 0) {
            throw rejected();
        }
        if (uri.getRawQuery() != null) {
            if (uri.getRawQuery().indexOf('\r') >= 0 || uri.getRawQuery().indexOf('\n') >= 0) {
                throw rejected();
            }
            path = path + "?" + uri.getRawQuery();
        }
        List<InetAddress> addresses = dnsResolver.resolve(host);
        if (addresses == null || addresses.isEmpty()) {
            throw rejected();
        }
        for (InetAddress address : addresses) {
            if (address == null || isDisallowedAddress(address)) {
                throw rejected();
            }
        }
        return new ResolvedEndpoint(host, port, path, List.copyOf(addresses));
    }

    static boolean isDisallowedAddress(InetAddress address) {
        if (address.isAnyLocalAddress()
                || address.isLoopbackAddress()
                || address.isLinkLocalAddress()
                || address.isSiteLocalAddress()
                || address.isMulticastAddress()) {
            return true;
        }
        byte[] raw = address.getAddress();
        if (raw.length == 16 && isMappedV4(raw)) {
            try {
                return isDisallowedAddress(InetAddress.getByAddress(Arrays.copyOfRange(raw, 12, 16)));
            } catch (Exception ex) {
                return true;
            }
        }
        if (raw.length == 4) {
            int b0 = raw[0] & 0xff;
            int b1 = raw[1] & 0xff;
            if (b0 == 0 || b0 == 127 || b0 >= 224) {
                return true;
            }
            if (b0 == 100 && b1 >= 64 && b1 <= 127) {
                return true;
            }
            if (b0 == 192 && b1 == 0 && (raw[2] & 0xff) == 0) {
                return true;
            }
            if (b0 == 198 && (b1 == 18 || b1 == 19)) {
                return true;
            }
        }
        if (raw.length == 16) {
            int first = raw[0] & 0xff;
            if ((first & 0xfe) == 0xfc) {
                return true;
            }
        }
        return false;
    }

    private static boolean isMappedV4(byte[] raw) {
        for (int i = 0; i < 10; i++) {
            if (raw[i] != 0) {
                return false;
            }
        }
        return raw[10] == (byte) 0xff && raw[11] == (byte) 0xff;
    }

    private static URI parseHttps(String rawUrl) {
        if (rawUrl == null || rawUrl.isBlank()) {
            throw rejected();
        }
        URI uri;
        try {
            uri = URI.create(rawUrl.trim());
        } catch (IllegalArgumentException ex) {
            throw rejected();
        }
        if (uri.getUserInfo() != null || !"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null) {
            throw rejected();
        }
        return uri;
    }

    private static String normalizeHost(String host) {
        String normalized = host.toLowerCase(Locale.ROOT);
        if (normalized.endsWith(".")) {
            normalized = normalized.substring(0, normalized.length() - 1);
        }
        return normalized;
    }

    static boolean isBlockedHostname(String host) {
        return host.isBlank()
                || "localhost".equals(host)
                || host.endsWith(".localhost")
                || host.endsWith(".local")
                || "metadata.google.internal".equals(host)
                || host.endsWith(".metadata.google.internal");
    }

    static boolean isIpLiteral(String host) {
        if (host.indexOf(':') >= 0) {
            return true;
        }
        String[] parts = host.split("\\.");
        if (parts.length != 4) {
            return false;
        }
        for (String part : parts) {
            if (part.isEmpty() || part.length() > 3 || !part.chars().allMatch(Character::isDigit)) {
                return false;
            }
        }
        return true;
    }

    private static Set<String> parseHosts(String raw) {
        String source = raw == null || raw.isBlank() ? DEFAULT_ALLOWED_HOSTS : raw;
        Set<String> hosts = new LinkedHashSet<>();
        for (String item : source.split(",")) {
            String host = item.trim().toLowerCase(Locale.ROOT);
            if (host.endsWith(".")) {
                host = host.substring(0, host.length() - 1);
            }
            if (!host.isEmpty() && !isBlockedHostname(host) && !isIpLiteral(host)) {
                hosts.add(host);
            }
        }
        if (hosts.isEmpty()) {
            hosts.add(DEFAULT_ALLOWED_HOSTS);
        }
        return Set.copyOf(hosts);
    }

    private static TranslationProviderException rejected() {
        return new TranslationProviderException(
                AuditionTranslation.ERROR_ENDPOINT_REJECTED,
                "번역 엔드포인트가 허용되지 않습니다.");
    }
}
