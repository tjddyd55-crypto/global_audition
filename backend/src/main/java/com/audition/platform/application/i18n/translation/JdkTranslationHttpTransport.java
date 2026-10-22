package com.audition.platform.application.i18n.translation;

import com.audition.platform.domain.audition.AuditionTranslation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import javax.net.ssl.SNIHostName;
import javax.net.ssl.SSLParameters;
import javax.net.ssl.SSLSocket;
import javax.net.ssl.SSLSocketFactory;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.net.SocketTimeoutException;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

/**
 * 리다이렉트를 따르지 않는다. DNS 로 고른 공개 IP 에 연결하고 SNI 는 허용된 호스트명을 쓴다.
 */
@Component
public class JdkTranslationHttpTransport implements TranslationHttpTransport {

    private static final int CONNECT_TIMEOUT_MS = 10_000;
    private static final int READ_TIMEOUT_MS = 20_000;
    private static final int MAX_BODY_BYTES = 1_048_576;

    private final EndpointGuard endpointGuard;
    private final SSLSocketFactory sslSocketFactory;

    @Autowired
    public JdkTranslationHttpTransport(EndpointGuard endpointGuard) {
        this(endpointGuard, (SSLSocketFactory) SSLSocketFactory.getDefault());
    }

    JdkTranslationHttpTransport(EndpointGuard endpointGuard, SSLSocketFactory sslSocketFactory) {
        this.endpointGuard = endpointGuard;
        this.sslSocketFactory = sslSocketFactory;
    }

    @Override
    public TranslationHttpResult postJson(String url, String bearerToken, String jsonBody) {
        if (bearerToken == null || bearerToken.isBlank()
                || bearerToken.indexOf('\r') >= 0 || bearerToken.indexOf('\n') >= 0) {
            throw new TranslationProviderException(
                    AuditionTranslation.ERROR_NOT_CONFIGURED,
                    "번역 공급자가 설정되지 않았습니다.");
        }
        ResolvedEndpoint endpoint = endpointGuard.resolveForCall(url);
        TranslationProviderException last = null;
        for (InetAddress address : endpoint.addresses()) {
            try {
                return postPinned(endpoint, address, bearerToken, jsonBody);
            } catch (TranslationProviderException ex) {
                if (!AuditionTranslation.ERROR_TIMEOUT.equals(ex.getErrorCode())
                        && !AuditionTranslation.ERROR_PROVIDER.equals(ex.getErrorCode())) {
                    throw ex;
                }
                last = ex;
            }
        }
        if (last != null) {
            throw last;
        }
        throw new TranslationProviderException(
                AuditionTranslation.ERROR_ENDPOINT_REJECTED,
                "번역 엔드포인트가 허용되지 않습니다.");
    }

    private TranslationHttpResult postPinned(
            ResolvedEndpoint endpoint,
            InetAddress address,
            String bearerToken,
            String jsonBody) {
        try (Socket socket = new Socket()) {
            socket.connect(new InetSocketAddress(address, endpoint.port()), CONNECT_TIMEOUT_MS);
            socket.setSoTimeout(READ_TIMEOUT_MS);
            SSLSocket ssl = (SSLSocket) sslSocketFactory.createSocket(socket, endpoint.host(), endpoint.port(), true);
            SSLParameters params = ssl.getSSLParameters();
            params.setServerNames(java.util.List.of(new SNIHostName(endpoint.host())));
            params.setEndpointIdentificationAlgorithm("HTTPS");
            ssl.setSSLParameters(params);
            ssl.startHandshake();
            byte[] payload = jsonBody.getBytes(StandardCharsets.UTF_8);
            String request = "POST " + endpoint.pathAndQuery() + " HTTP/1.1\r\n"
                    + "Host: " + hostHeader(endpoint) + "\r\n"
                    + "Authorization: Bearer " + bearerToken + "\r\n"
                    + "Content-Type: application/json\r\n"
                    + "Accept: application/json\r\n"
                    + "Content-Length: " + payload.length + "\r\n"
                    + "Connection: close\r\n\r\n";
            ssl.getOutputStream().write(request.getBytes(StandardCharsets.ISO_8859_1));
            ssl.getOutputStream().write(payload);
            ssl.getOutputStream().flush();
            return readHttpResponse(ssl.getInputStream());
        } catch (TranslationProviderException ex) {
            throw ex;
        } catch (SocketTimeoutException ex) {
            throw new TranslationProviderException(
                    AuditionTranslation.ERROR_TIMEOUT,
                    "번역 공급자 응답 시간이 초과되었습니다.");
        } catch (IOException ex) {
            throw new TranslationProviderException(
                    AuditionTranslation.ERROR_PROVIDER,
                    "번역 공급자에 연결하지 못했습니다.");
        }
    }

    static TranslationHttpResult readHttpResponse(InputStream input) throws IOException {
        String statusLine = readLine(input);
        if (statusLine == null || statusLine.isBlank()) {
            throw new TranslationProviderException(
                    AuditionTranslation.ERROR_HTTP,
                    "번역 공급자 응답이 비어 있습니다.");
        }
        int code = statusCode(statusLine);
        Map<String, String> headers = readHeaders(input);
        if (code >= 300 && code < 400) {
            throw new TranslationProviderException(
                    AuditionTranslation.ERROR_HTTP,
                    "번역 공급자 리다이렉트를 따르지 않습니다.");
        }
        byte[] body = readBody(input, headers);
        if (code < 200 || code >= 300) {
            throw new TranslationProviderException(
                    AuditionTranslation.ERROR_HTTP,
                    "번역 공급자가 HTTP " + code + " 를 반환했습니다.");
        }
        return new TranslationHttpResult(code, new String(body, StandardCharsets.UTF_8));
    }

    private static int statusCode(String statusLine) {
        String[] parts = statusLine.split(" ");
        if (parts.length < 2) {
            throw new TranslationProviderException(
                    AuditionTranslation.ERROR_HTTP,
                    "번역 공급자 응답이 비어 있습니다.");
        }
        try {
            return Integer.parseInt(parts[1]);
        } catch (NumberFormatException ex) {
            throw new TranslationProviderException(
                    AuditionTranslation.ERROR_HTTP,
                    "번역 공급자 응답이 비어 있습니다.");
        }
    }

    private static Map<String, String> readHeaders(InputStream input) throws IOException {
        Map<String, String> headers = new LinkedHashMap<>();
        while (true) {
            String line = readLine(input);
            if (line == null || line.isEmpty()) {
                return headers;
            }
            int split = line.indexOf(':');
            if (split > 0) {
                headers.put(line.substring(0, split).trim().toLowerCase(Locale.ROOT), line.substring(split + 1).trim());
            }
        }
    }

    private static byte[] readBody(InputStream input, Map<String, String> headers) throws IOException {
        String encoding = headers.getOrDefault("transfer-encoding", "");
        if (encoding.toLowerCase(Locale.ROOT).contains("chunked")) {
            return readChunked(input);
        }
        String length = headers.get("content-length");
        if (length != null) {
            int size;
            try {
                size = Integer.parseInt(length.trim());
            } catch (NumberFormatException ex) {
                throw new TranslationProviderException(
                        AuditionTranslation.ERROR_HTTP,
                        "번역 공급자 응답이 비어 있습니다.");
            }
            if (size < 0 || size > MAX_BODY_BYTES) {
                throw new TranslationProviderException(
                        AuditionTranslation.ERROR_HTTP,
                        "번역 응답이 너무 깁니다.");
            }
            return input.readNBytes(size);
        }
        return input.readNBytes(MAX_BODY_BYTES);
    }

    private static byte[] readChunked(InputStream input) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        while (true) {
            String sizeLine = readLine(input);
            if (sizeLine == null) {
                break;
            }
            String sizeToken = sizeLine.split(";", 2)[0].trim();
            int size;
            try {
                size = Integer.parseInt(sizeToken, 16);
            } catch (NumberFormatException ex) {
                throw new TranslationProviderException(
                        AuditionTranslation.ERROR_MALFORMED_JSON,
                        "번역 응답을 해석하지 못했습니다.");
            }
            if (size == 0) {
                return out.toByteArray();
            }
            if (size < 0 || out.size() + size > MAX_BODY_BYTES) {
                throw new TranslationProviderException(
                        AuditionTranslation.ERROR_HTTP,
                        "번역 응답이 너무 깁니다.");
            }
            byte[] chunk = input.readNBytes(size);
            out.write(chunk);
            readLine(input);
        }
        return out.toByteArray();
    }

    private static String readLine(InputStream input) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        while (true) {
            int value = input.read();
            if (value < 0) {
                return out.size() == 0 ? null : out.toString(StandardCharsets.ISO_8859_1);
            }
            if (value == '\n') {
                break;
            }
            if (value != '\r') {
                out.write(value);
            }
            if (out.size() > 8192) {
                throw new TranslationProviderException(
                        AuditionTranslation.ERROR_HTTP,
                        "번역 응답이 너무 깁니다.");
            }
        }
        return out.toString(StandardCharsets.ISO_8859_1);
    }

    private static String hostHeader(ResolvedEndpoint endpoint) {
        if (endpoint.port() == 443) {
            return endpoint.host();
        }
        return endpoint.host() + ":" + endpoint.port();
    }
}
