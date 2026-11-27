CREATE TABLE android_push_installations (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    expo_token TEXT NOT NULL UNIQUE,
    locale VARCHAR(16) NOT NULL,
    registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    refreshed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    active BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE INDEX android_push_installations_user ON android_push_installations(user_id) WHERE active;

CREATE TABLE android_push_deliveries (
    installation_id UUID NOT NULL REFERENCES android_push_installations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_id UUID NOT NULL,
    kind TEXT NOT NULL,
    link TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','RECEIPT','DELIVERED','FAILED')),
    next_attempt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    attempts INT NOT NULL DEFAULT 0,
    expo_ticket TEXT,
    error_code TEXT,
    PRIMARY KEY (installation_id, notification_id)
);
CREATE INDEX android_push_delivery_queue ON android_push_deliveries(next_attempt)
    WHERE status IN ('PENDING','RECEIPT');
