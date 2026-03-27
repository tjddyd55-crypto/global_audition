SET search_path TO public;

CREATE TABLE IF NOT EXISTS application_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications (id) ON DELETE CASCADE,
    previous_status TEXT NOT NULL,
    next_status TEXT NOT NULL,
    changed_by UUID NOT NULL REFERENCES users (id),
    changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_app_status_history_application_id ON application_status_history (application_id);
CREATE INDEX IF NOT EXISTS idx_app_status_history_changed_at ON application_status_history (changed_at DESC);
