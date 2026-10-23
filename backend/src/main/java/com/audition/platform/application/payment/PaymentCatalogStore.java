package com.audition.platform.application.payment;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class PaymentCatalogStore {

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
        jdbc.update("""
                INSERT INTO payment_webhook_logs (
                    id, provider_id, environment, event_id, order_no, signature_valid, duplicate, payload_hash, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, id, providerId, environment, eventId, orderNo, valid, duplicate, hash, status);
    }

    public void insertError(String orderNo, String providerId, String code, String message) {
        String safe = message == null ? code : message;
        if (safe.length() > 400) {
            safe = safe.substring(0, 400);
        }
        jdbc.update("""
                INSERT INTO payment_error_logs (id, order_no, provider_id, code, message)
                VALUES (?, ?, ?, ?, ?)
                """, UUID.randomUUID(), orderNo, providerId, code, safe);
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
                SELECT provider_id, environment, event_id, order_no, signature_valid, duplicate, status, created_at
                FROM payment_webhook_logs
                ORDER BY created_at DESC
                LIMIT 50
                """, (rs, n) -> new WebhookLogRow(
                rs.getString("provider_id"),
                rs.getString("environment"),
                rs.getString("event_id"),
                rs.getString("order_no"),
                rs.getBoolean("signature_valid"),
                rs.getBoolean("duplicate"),
                rs.getString("status"),
                rs.getTimestamp("created_at").toInstant()));
    }

    public List<ErrorLogRow> recentErrors() {
        return jdbc.query("""
                SELECT order_no, provider_id, code, message, created_at
                FROM payment_error_logs
                ORDER BY created_at DESC
                LIMIT 50
                """, (rs, n) -> new ErrorLogRow(
                rs.getString("order_no"),
                rs.getString("provider_id"),
                rs.getString("code"),
                rs.getString("message"),
                rs.getTimestamp("created_at").toInstant()));
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
            String providerId,
            String environment,
            String eventId,
            String orderNo,
            boolean signatureValid,
            boolean duplicate,
            String status,
            Instant createdAt) {
    }

    public record ErrorLogRow(String orderNo, String providerId, String code, String message, Instant createdAt) {
    }
}
