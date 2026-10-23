-- Admin desk columns only. Existing payment, credit, and settlement rows are not updated or deleted.

ALTER TABLE public.payment_webhook_logs
    ADD COLUMN IF NOT EXISTS event_type VARCHAR(64),
    ADD COLUMN IF NOT EXISTS failure_reason VARCHAR(400),
    ADD COLUMN IF NOT EXISTS reprocess_status VARCHAR(32) NOT NULL DEFAULT 'NONE';

ALTER TABLE public.payment_error_logs
    ADD COLUMN IF NOT EXISTS retryable BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS process_status VARCHAR(32) NOT NULL DEFAULT 'OPEN';

COMMENT ON COLUMN public.payment_webhook_logs.payload_hash IS
    'SHA-256 of the raw body. The body and credentials are not stored.';
