package com.audition.platform.application.payment;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Repository
public class PaymentCatalogStore {

    private static final ObjectMapper JSON = new ObjectMapper();
    private static final List<String> AUDIT_KEYS = List.of(
            "secretEnvironment", "rotated", "refund", "amountMinor", "credits", "environment",
            "idempotencyKey", "reprocess", "orderNo", "mockTest", "email", "contractStatus",
            "enabled", "methodEnabled", "chargeCurrency", "rate", "effectiveFrom");

    private final JdbcTemplate jdbc;

    public PaymentCatalogStore(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<ProviderRow> providers() {
        return jdbc.query("""
                SELECT id, adapter_code, display_name, environment, countries, currencies, methods,
                       contract_status, enabled, implemented, connection_status, last_connection_at, updated_at
                FROM payment_provider_configs
                ORDER BY id
                """, (rs, n) -> new ProviderRow(
                rs.getString("id"),
                rs.getString("adapter_code"),
                rs.getString("display_name"),
                rs.getString("environment"),
                rs.getString("countries"),
                rs.getString("currencies"),
                rs.getString("methods"),
                rs.getString("contract_status"),
                rs.getBoolean("enabled"),
                rs.getBoolean("implemented"),
                rs.getString("connection_status"),
                rs.getTimestamp("last_connection_at") == null ? null : rs.getTimestamp("last_connection_at").toInstant(),
                rs.getTimestamp("updated_at").toInstant()));
    }

    public Optional<ProviderRow> provider(String id) {
        return providers().stream().filter(row -> row.id().equals(id)).findFirst();
    }

    public void updateProvider(String id, String environment, String contractStatus, boolean enabled, UUID actor) {
        jdbc.update("""
                UPDATE payment_provider_configs
                SET environment = ?, contract_status = ?, enabled = ?, updated_at = NOW(), updated_by = ?
                WHERE id = ?
                """, environment, contractStatus, enabled, actor, id);
    }

    public void markConnection(String id, String status, String contractStatus) {
        jdbc.update("""
                UPDATE payment_provider_configs
                SET connection_status = ?, contract_status = ?, last_connection_at = NOW(), updated_at = NOW()
                WHERE id = ?
                """, status, contractStatus, id);
    }

    public void saveSecret(
            String providerId,
            String environment,
            String clientKey,
            String clientId,
            String secretCipher,
            String merchantId,
            String webhookCipher) {
        UUID id = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO payment_provider_secrets (
                    id, provider_id, environment, client_key, client_id, secret_cipher, merchant_id, webhook_secret_cipher, rotated_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                ON CONFLICT (provider_id, environment) DO UPDATE SET
                    client_key = COALESCE(EXCLUDED.client_key, payment_provider_secrets.client_key),
                    client_id = COALESCE(EXCLUDED.client_id, payment_provider_secrets.client_id),
                    secret_cipher = COALESCE(EXCLUDED.secret_cipher, payment_provider_secrets.secret_cipher),
                    merchant_id = COALESCE(EXCLUDED.merchant_id, payment_provider_secrets.merchant_id),
                    webhook_secret_cipher = COALESCE(EXCLUDED.webhook_secret_cipher, payment_provider_secrets.webhook_secret_cipher),
                    rotated_at = NOW(),
                    updated_at = NOW()
                """, id, providerId, environment, blank(clientKey), blank(clientId), blank(secretCipher), blank(merchantId), blank(webhookCipher));
    }

    public Optional<SecretRow> secret(String providerId, String environment) {
        List<SecretRow> rows = jdbc.query("""
                SELECT provider_id, environment, client_key, client_id, secret_cipher, merchant_id, webhook_secret_cipher, updated_at
                FROM payment_provider_secrets
                WHERE provider_id = ? AND environment = ?
                """, (rs, n) -> new SecretRow(
                rs.getString("provider_id"),
                rs.getString("environment"),
                rs.getString("client_key"),
                rs.getString("client_id"),
                rs.getString("secret_cipher"),
                rs.getString("merchant_id"),
                rs.getString("webhook_secret_cipher"),
                rs.getTimestamp("updated_at").toInstant()), providerId, environment);
        return rows.stream().findFirst();
    }

    public List<MethodRow> methods() {
        return jdbc.query("""
                SELECT m.id, m.payment_country, m.merchant_country, m.provider_id, m.method_code, m.currency, m.enabled,
                       p.adapter_code, p.environment, p.contract_status, p.connection_status, p.enabled AS provider_enabled,
                       p.implemented, p.countries, p.currencies, p.methods, p.display_name
                FROM payment_country_methods m
                JOIN payment_provider_configs p ON p.id = m.provider_id
                ORDER BY m.payment_country, m.provider_id, m.method_code
                """, (rs, n) -> mapMethod(rs));
    }

    public void setMethodEnabled(UUID id, boolean enabled) {
        jdbc.update("UPDATE payment_country_methods SET enabled = ?, updated_at = NOW() WHERE id = ?", enabled, id);
    }

    public void insertFx(UUID id, String chargeCurrency, BigDecimal rate, String basis, String rounding, Instant from, UUID actor) {
        jdbc.update("""
                INSERT INTO payment_fx_rates (id, base_currency, charge_currency, rate, basis, rounding_mode, effective_from, created_by)
                VALUES (?, 'USD', ?, ?, ?, ?, ?, ?)
                """, id, chargeCurrency, rate, basis, rounding, Timestamp.from(from), actor);
    }

    public List<FxRow> fxHistory(String chargeCurrency) {
        return jdbc.query("""
                SELECT id, base_currency, charge_currency, rate, basis, rounding_mode, effective_from, created_at
                FROM payment_fx_rates
                WHERE charge_currency = ?
                ORDER BY effective_from DESC
                """, (rs, n) -> new FxRow(
                rs.getObject("id", UUID.class),
                rs.getString("base_currency"),
                rs.getString("charge_currency"),
                rs.getBigDecimal("rate"),
                rs.getString("basis"),
                rs.getString("rounding_mode"),
                rs.getTimestamp("effective_from").toInstant()), chargeCurrency);
    }

    public Optional<FxRow> fxAt(String chargeCurrency, Instant at) {
        List<FxRow> rows = jdbc.query("""
                SELECT id, base_currency, charge_currency, rate, basis, rounding_mode, effective_from
                FROM payment_fx_rates
                WHERE charge_currency = ? AND effective_from <= ?
                ORDER BY effective_from DESC
                LIMIT 1
                """, (rs, n) -> new FxRow(
                rs.getObject("id", UUID.class),
                rs.getString("base_currency"),
                rs.getString("charge_currency"),
                rs.getBigDecimal("rate"),
                rs.getString("basis"),
                rs.getString("rounding_mode"),
                rs.getTimestamp("effective_from").toInstant()), chargeCurrency, Timestamp.from(at));
        return rows.stream().findFirst();
    }

    public boolean webhookExists(String providerId, String eventId) {
        Integer count = jdbc.queryForObject("""
                SELECT COUNT(*) FROM payment_webhook_logs
                WHERE provider_id = ? AND event_id = ? AND signature_valid = TRUE
                """, Integer.class, providerId, eventId);
        return count != null && count > 0;
    }

    public void insertWebhook(
            UUID id, String providerId, String environment, String eventId, String orderNo,
            boolean valid, boolean duplicate, String hash, String status) {
        String eventType = status;
        String failure = valid ? null : "WEBHOOK_SIGNATURE_INVALID";
        String reprocess = duplicate ? "NOT_NEEDED" : (valid ? "APPLIED" : "NONE");
        jdbc.update("""
                INSERT INTO payment_webhook_logs (
                    id, provider_id, environment, event_id, order_no, signature_valid, duplicate, payload_hash, status,
                    event_type, failure_reason, reprocess_status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, id, providerId, environment, eventId, orderNo, valid, duplicate, hash, status, eventType, failure, reprocess);
    }

    public void insertError(String orderNo, String providerId, String code, String message) {
        String safe = message == null ? code : message;
        if (safe.length() > 400) {
            safe = safe.substring(0, 400);
        }
        boolean retryable = code != null && Set.of("NETWORK_ERROR", "PAYPAL_NETWORK", "TOSS_UNREACHABLE", "INTERRUPTED").contains(code);
        jdbc.update("""
                INSERT INTO payment_error_logs (id, order_no, provider_id, code, message, retryable, process_status)
                VALUES (?, ?, ?, ?, ?, ?, 'OPEN')
                """, UUID.randomUUID(), orderNo, providerId, code, safe, retryable);
    }

    public boolean refundExists(UUID orderId, String idempotencyKey) {
        Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM payment_refunds WHERE order_id = ? AND idempotency_key = ?",
                Integer.class, orderId, idempotencyKey);
        return count != null && count > 0;
    }

    public void insertRefund(UUID orderId, String idempotencyKey, long minor, long credits) {
        jdbc.update("""
                INSERT INTO payment_refunds (id, order_id, idempotency_key, amount_minor, credits)
                VALUES (?, ?, ?, ?, ?)
                """, UUID.randomUUID(), orderId, idempotencyKey, minor, credits);
    }

    public List<WebhookLogRow> recentWebhooks() {
        return jdbc.query("""
                SELECT id, provider_id, environment, event_id, event_type, order_no, signature_valid, duplicate,
                       status, failure_reason, reprocess_status, created_at
                FROM payment_webhook_logs
                ORDER BY created_at DESC
                LIMIT 100
                """, (rs, n) -> new WebhookLogRow(
                rs.getObject("id", UUID.class),
                rs.getString("provider_id"),
                rs.getString("environment"),
                rs.getString("event_id"),
                rs.getString("event_type"),
                rs.getString("order_no"),
                rs.getBoolean("signature_valid"),
                rs.getBoolean("duplicate"),
                rs.getString("status"),
                rs.getString("failure_reason"),
                rs.getString("reprocess_status"),
                rs.getTimestamp("created_at").toInstant()));
    }

    public List<ErrorLogRow> recentErrors() {
        return jdbc.query("""
                SELECT id, order_no, provider_id, code, message, retryable, process_status, created_at
                FROM payment_error_logs
                ORDER BY created_at DESC
                LIMIT 100
                """, (rs, n) -> new ErrorLogRow(
                rs.getObject("id", UUID.class),
                rs.getString("order_no"),
                rs.getString("provider_id"),
                rs.getString("code"),
                rs.getString("message"),
                rs.getBoolean("retryable"),
                rs.getString("process_status"),
                rs.getTimestamp("created_at").toInstant()));
    }

    public Optional<ErrorLogRow> error(UUID id) {
        List<ErrorLogRow> rows = jdbc.query("""
                SELECT id, order_no, provider_id, code, message, retryable, process_status, created_at
                FROM payment_error_logs WHERE id = ?
                """, (rs, n) -> new ErrorLogRow(
                rs.getObject("id", UUID.class),
                rs.getString("order_no"),
                rs.getString("provider_id"),
                rs.getString("code"),
                rs.getString("message"),
                rs.getBoolean("retryable"),
                rs.getString("process_status"),
                rs.getTimestamp("created_at").toInstant()), id);
        return rows.stream().findFirst();
    }

    public void markError(UUID id, String processStatus) {
        jdbc.update("UPDATE payment_error_logs SET process_status = ? WHERE id = ?", processStatus, id);
    }

    public List<OrderAdminRow> searchOrders(String query, String environment, String status, Instant from, Instant to) {
        StringBuilder sql = new StringBuilder("""
                SELECT o.order_no, o.provider, o.provider_config_id, o.environment, o.user_id, u.email,
                       o.payment_country, COALESCE(o.charge_currency, o.currency) AS charge_currency,
                       o.charge_amount_minor, COALESCE(o.credits_issued, o.credits + o.bonus_credits) AS credits_issued,
                       o.status, o.paid_at, o.created_at, o.refunded_minor, o.refunded_credits, o.fail_reason,
                       o.method_code
                FROM payment_orders o
                JOIN users u ON u.id = o.user_id
                WHERE 1 = 1
                """);
        List<Object> args = new ArrayList<>();
        if (query != null && !query.isBlank()) {
            sql.append(" AND (o.order_no ILIKE ? OR u.email ILIKE ?)");
            String like = "%" + query.trim() + "%";
            args.add(like);
            args.add(like);
        }
        if (environment != null && !environment.isBlank()) {
            sql.append(" AND o.environment = ?");
            args.add(environment.trim().toUpperCase(Locale.ROOT));
        }
        if (status != null && !status.isBlank()) {
            sql.append(" AND o.status = ?");
            args.add(status.trim().toUpperCase(Locale.ROOT));
        }
        if (from != null) {
            sql.append(" AND o.created_at >= ?");
            args.add(Timestamp.from(from));
        }
        if (to != null) {
            sql.append(" AND o.created_at < ?");
            args.add(Timestamp.from(to));
        }
        sql.append(" ORDER BY o.created_at DESC LIMIT 100");
        return jdbc.query(sql.toString(), (rs, n) -> mapOrder(rs), args.toArray());
    }

    public Optional<OrderAdminRow> orderByNo(String orderNo) {
        List<OrderAdminRow> rows = jdbc.query("""
                SELECT o.order_no, o.provider, o.provider_config_id, o.environment, o.user_id, u.email,
                       o.payment_country, COALESCE(o.charge_currency, o.currency) AS charge_currency,
                       o.charge_amount_minor, COALESCE(o.credits_issued, o.credits + o.bonus_credits) AS credits_issued,
                       o.status, o.paid_at, o.created_at, o.refunded_minor, o.refunded_credits, o.fail_reason,
                       o.method_code
                FROM payment_orders o
                JOIN users u ON u.id = o.user_id
                WHERE o.order_no = ?
                """, (rs, n) -> mapOrder(rs), orderNo);
        return rows.stream().findFirst();
    }

    public List<LedgerLine> ledgerLines(UUID userId, String orderNo) {
        return jdbc.query("""
                SELECT type, amount, after_balance, reference_id, created_at
                FROM credit_transactions
                WHERE user_id = ? AND (reference_id = ? OR reference_id LIKE ?)
                ORDER BY created_at
                """, (rs, n) -> new LedgerLine(
                rs.getString("type"),
                rs.getLong("amount"),
                rs.getLong("after_balance"),
                rs.getString("reference_id"),
                rs.getTimestamp("created_at").toInstant()), userId, orderNo, orderNo + "#%");
    }

    public List<RefundAdminRow> refunds() {
        return jdbc.query("""
                SELECT r.id, r.idempotency_key, r.amount_minor, r.credits, r.created_at,
                       o.order_no, o.environment, o.provider_config_id,
                       COALESCE(o.charge_currency, o.currency) AS charge_currency,
                       o.charge_amount_minor, o.refunded_minor, o.status, u.email
                FROM payment_refunds r
                JOIN payment_orders o ON o.id = r.order_id
                JOIN users u ON u.id = o.user_id
                ORDER BY r.created_at DESC
                LIMIT 100
                """, (rs, n) -> new RefundAdminRow(
                rs.getObject("id", UUID.class),
                rs.getString("order_no"),
                rs.getString("email"),
                rs.getString("provider_config_id"),
                rs.getString("environment"),
                trim(rs.getString("charge_currency")),
                (Long) rs.getObject("charge_amount_minor"),
                rs.getLong("refunded_minor"),
                rs.getLong("amount_minor"),
                rs.getLong("credits"),
                rs.getString("status"),
                rs.getString("idempotency_key"),
                rs.getTimestamp("created_at").toInstant()));
    }

    public Optional<UserRef> userByEmail(String email) {
        List<UserRef> rows = jdbc.query("""
                SELECT id, email, role FROM users WHERE lower(email) = lower(?)
                """, (rs, n) -> new UserRef(
                rs.getObject("id", UUID.class),
                rs.getString("email"),
                rs.getString("role")), email.trim());
        return rows.stream().findFirst();
    }

    public Long ledgerClosing(UUID userId) {
        List<Long> rows = jdbc.query("""
                SELECT after_balance FROM credit_transactions
                WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 1
                """, (rs, n) -> rs.getLong("after_balance"), userId);
        return rows.stream().findFirst().orElse(null);
    }

    public List<Map<String, Object>> recentPaymentAudits() {
        return jdbc.query("""
                SELECT id, action, target_id, payload::text AS payload, created_at
                FROM admin_logs
                WHERE action = 'PAYMENT_SETTINGS_PATCH'
                ORDER BY created_at DESC
                LIMIT 50
                """, (rs, n) -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", rs.getObject("id", UUID.class).toString());
            row.put("action", rs.getString("action"));
            row.put("targetId", rs.getString("target_id"));
            row.put("createdAt", rs.getTimestamp("created_at").toInstant().toString());
            row.put("summary", auditSummary(rs.getString("payload")));
            return row;
        });
    }

    public int chargeCount(UUID userId, String orderNo) {
        Integer count = jdbc.queryForObject("""
                SELECT COUNT(*) FROM credit_transactions
                WHERE user_id = ? AND type = 'CHARGE' AND reference_id = ?
                """, Integer.class, userId, orderNo);
        return count == null ? 0 : count;
    }

    private static String auditSummary(String payload) {
        if (payload == null || payload.isBlank()) {
            return "";
        }
        try {
            JsonNode after = JSON.readTree(payload).path("after");
            List<String> parts = new ArrayList<>();
            for (String key : AUDIT_KEYS) {
                JsonNode value = after.get(key);
                if (value == null || value.isNull()) {
                    continue;
                }
                parts.add(key + "=" + value.asText());
            }
            return String.join(", ", parts);
        } catch (Exception ex) {
            return "";
        }
    }

    private static OrderAdminRow mapOrder(java.sql.ResultSet rs) throws java.sql.SQLException {
        long refunded = rs.getLong("refunded_minor");
        Long charge = (Long) rs.getObject("charge_amount_minor");
        String refundState = refunded <= 0 ? "NONE" : (charge != null && refunded >= charge ? "FULL" : "PARTIAL");
        return new OrderAdminRow(
                rs.getString("order_no"),
                rs.getString("provider_config_id"),
                rs.getString("provider"),
                rs.getString("environment"),
                rs.getObject("user_id", UUID.class),
                rs.getString("email"),
                trim(rs.getString("payment_country")),
                trim(rs.getString("charge_currency")),
                charge,
                rs.getLong("credits_issued"),
                rs.getString("status"),
                rs.getTimestamp("paid_at") == null ? null : rs.getTimestamp("paid_at").toInstant(),
                rs.getTimestamp("created_at").toInstant(),
                refundState,
                refunded,
                rs.getLong("refunded_credits"),
                rs.getString("fail_reason"),
                rs.getString("method_code"));
    }

    private static MethodRow mapMethod(java.sql.ResultSet rs) throws java.sql.SQLException {
        return new MethodRow(
                rs.getObject("id", UUID.class),
                rs.getString("payment_country").trim(),
                rs.getString("merchant_country").trim(),
                rs.getString("provider_id"),
                rs.getString("display_name"),
                rs.getString("adapter_code"),
                rs.getString("method_code"),
                rs.getString("currency").trim(),
                rs.getBoolean("enabled"),
                rs.getString("environment"),
                rs.getString("contract_status"),
                rs.getString("connection_status"),
                rs.getBoolean("provider_enabled"),
                rs.getBoolean("implemented"),
                rs.getString("countries"),
                rs.getString("currencies"),
                rs.getString("methods"));
    }

    private static String trim(String value) {
        return value == null ? null : value.trim();
    }

    private static String blank(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    public record ProviderRow(
            String id,
            String adapterCode,
            String displayName,
            String environment,
            String countries,
            String currencies,
            String methods,
            String contractStatus,
            boolean enabled,
            boolean implemented,
            String connectionStatus,
            Instant lastConnectionAt,
            Instant updatedAt) {
    }

    public record SecretRow(
            String providerId,
            String environment,
            String clientKey,
            String clientId,
            String secretCipher,
            String merchantId,
            String webhookSecretCipher,
            Instant updatedAt) {
    }

    public record MethodRow(
            UUID id,
            String paymentCountry,
            String merchantCountry,
            String providerId,
            String providerName,
            String adapterCode,
            String methodCode,
            String currency,
            boolean enabled,
            String environment,
            String contractStatus,
            String connectionStatus,
            boolean providerEnabled,
            boolean implemented,
            String providerCountries,
            String providerCurrencies,
            String providerMethods) {
    }

    public record FxRow(
            UUID id,
            String baseCurrency,
            String chargeCurrency,
            BigDecimal rate,
            String basis,
            String roundingMode,
            Instant effectiveFrom) {
    }

    public record WebhookLogRow(
            UUID id,
            String providerId,
            String environment,
            String eventId,
            String eventType,
            String orderNo,
            boolean signatureValid,
            boolean duplicate,
            String status,
            String failureReason,
            String reprocessStatus,
            Instant createdAt) {
    }

    public record ErrorLogRow(
            UUID id,
            String orderNo,
            String providerId,
            String code,
            String message,
            boolean retryable,
            String processStatus,
            Instant createdAt) {
    }

    public record OrderAdminRow(
            String orderNo,
            String providerId,
            String provider,
            String environment,
            UUID userId,
            String email,
            String paymentCountry,
            String chargeCurrency,
            Long chargeAmountMinor,
            long creditsIssued,
            String status,
            Instant paidAt,
            Instant createdAt,
            String refundState,
            long refundedMinor,
            long refundedCredits,
            String failReason,
            String methodCode) {
    }

    public record LedgerLine(String type, long amount, long afterBalance, String referenceId, Instant createdAt) {
    }

    public record RefundAdminRow(
            UUID id,
            String orderNo,
            String email,
            String providerId,
            String environment,
            String chargeCurrency,
            Long chargeAmountMinor,
            long refundedMinor,
            long amountMinor,
            long credits,
            String orderStatus,
            String idempotencyKey,
            Instant createdAt) {
    }

    public record UserRef(UUID id, String email, String role) {
    }
}
