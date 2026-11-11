package com.audition.platform.application.payment;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 토스페이먼츠 서버 API. 시크릿은 호출 인자로만 받고 로그에 남기지 않는다.
 * 승인: POST https://api.tosspayments.com/v1/payments/confirm
 */
@Component
public class TossPaymentsClient {

    public static final String API_BASE = "https://api.tosspayments.com";
    public static final String PROBE_PAYMENT_KEY = "INVALID_CONNECTION_TEST_KEY";

    private static final Logger log = LoggerFactory.getLogger(TossPaymentsClient.class);

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public TossPaymentsClient(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    public JsonNode confirm(String secretKey, String paymentKey, String orderId, long amount) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("paymentKey", paymentKey);
        body.put("orderId", orderId);
        body.put("amount", amount);
        return request("POST", "/v1/payments/confirm", secretKey, body);
    }

    public JsonNode getPayment(String secretKey, String paymentKey) {
        return request("GET", "/v1/payments/" + encodePath(paymentKey), secretKey, null);
    }

    public JsonNode cancel(String secretKey, String paymentKey, String cancelReason) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("cancelReason", cancelReason);
        return request("POST", "/v1/payments/" + encodePath(paymentKey) + "/cancel", secretKey, body);
    }

    /**
     * 실과금 없이 키 유효성만 확인.
     * 존재하지 않는 paymentKey 조회: 401/403 → INVALID KEY, 404 → CONNECTED.
     * 네트워크 오류·5xx 등은 키 문제가 아니므로 UNREACHABLE 로 구분한다(이전에는 INVALID KEY 로 뭉뚱그려 원인을 숨겼다).
     */
    public ConnectionProbe probeSecret(String secretKey) {
        try {
            HttpResponse<String> response = send("GET", "/v1/payments/" + PROBE_PAYMENT_KEY, secretKey, null);
            int status = response.statusCode();
            String code = tossCode(response.body());
            if (status == 404) {
                return ConnectionProbe.connected("HTTP_404" + (code == null ? "" : ":" + code));
            }
            if (status >= 200 && status < 300) {
                return ConnectionProbe.connected("HTTP_" + status);
            }
            log.warn("Toss connection probe status={} code={}", status, code);
            String detail = "HTTP_" + status + (code == null ? "" : ":" + code);
            if (status == 401 || status == 403) {
                return ConnectionProbe.invalidKey(detail);
            }
            return ConnectionProbe.unreachable(detail);
        } catch (TossPaymentsException e) {
            log.warn("Toss connection probe failed status={} code={}", e.getHttpStatus(), e.getTossCode());
            String detail = "HTTP_" + e.getHttpStatus() + ":" + e.getTossCode();
            if (e.getHttpStatus() == 401 || e.getHttpStatus() == 403) {
                return ConnectionProbe.invalidKey(detail);
            }
            return ConnectionProbe.unreachable(detail);
        }
    }

    private String tossCode(String body) {
        JsonNode json = readJson(body);
        return json != null && json.hasNonNull("code") ? json.get("code").asText() : null;
    }

    private JsonNode request(String method, String path, String secretKey, Map<String, Object> body) {
        HttpResponse<String> response = send(method, path, secretKey, body);
        int status = response.statusCode();
        JsonNode json = readJson(response.body());
        if (status >= 200 && status < 300) {
            return json;
        }
        String code = json != null && json.hasNonNull("code") ? json.get("code").asText() : "TOSS_ERROR";
        String message = json != null && json.hasNonNull("message") ? json.get("message").asText() : "토스 결제 요청이 실패했습니다.";
        log.warn("Toss API failed method={} path={} status={} code={}", method, path, status, code);
        throw new TossPaymentsException(status, code, message);
    }

    private HttpResponse<String> send(String method, String path, String secretKey, Map<String, Object> body) {
        if (secretKey == null || secretKey.isBlank()) {
            throw new TossPaymentsException(401, "INVALID_SECRET", "시크릿 키가 없습니다.");
        }
        try {
            HttpRequest.Builder builder = HttpRequest.newBuilder()
                    .uri(URI.create(API_BASE + path))
                    .timeout(Duration.ofSeconds(15))
                    .header("Authorization", basicAuth(secretKey))
                    .header("Content-Type", "application/json");
            if ("GET".equals(method) || body == null) {
                builder.GET();
            } else {
                builder.method(method, HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)));
            }
            return httpClient.send(builder.build(), HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        } catch (TossPaymentsException e) {
            throw e;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new TossPaymentsException(500, "INTERRUPTED", "토스 API 호출이 중단되었습니다.");
        } catch (Exception e) {
            log.warn("Toss API unreachable path={} error={}", path, e.getClass().getSimpleName());
            throw new TossPaymentsException(502, "TOSS_UNREACHABLE", "토스 API에 연결할 수 없습니다.");
        }
    }

    private JsonNode readJson(String raw) {
        if (raw == null || raw.isBlank()) {
            return objectMapper.createObjectNode();
        }
        try {
            return objectMapper.readTree(raw);
        } catch (Exception e) {
            return objectMapper.createObjectNode();
        }
    }

    private static String basicAuth(String secretKey) {
        String token = Base64.getEncoder().encodeToString((secretKey + ":").getBytes(StandardCharsets.UTF_8));
        return "Basic " + token;
    }

    private static String encodePath(String value) {
        return java.net.URLEncoder.encode(value, StandardCharsets.UTF_8).replace("+", "%20");
    }

    public static final class ConnectionProbe {
        private final boolean validKey;
        private final boolean reachable;
        private final String detail;

        private ConnectionProbe(boolean validKey, boolean reachable, String detail) {
            this.validKey = validKey;
            this.reachable = reachable;
            this.detail = detail;
        }

        public static ConnectionProbe connected() {
            return connected(null);
        }

        public static ConnectionProbe connected(String detail) {
            return new ConnectionProbe(true, true, detail);
        }

        public static ConnectionProbe invalidKey() {
            return invalidKey(null);
        }

        public static ConnectionProbe invalidKey(String detail) {
            return new ConnectionProbe(false, true, detail);
        }

        public static ConnectionProbe unreachable(String detail) {
            return new ConnectionProbe(false, false, detail);
        }

        public boolean isValidKey() {
            return validKey;
        }

        /** false 면 키 판정 불가(네트워크·토스 장애). */
        public boolean isReachable() {
            return reachable;
        }

        /** 원인 코드(HTTP 상태·토스 코드). 키 값은 들어가지 않는다. */
        public String getDetail() {
            return detail;
        }
    }
}
