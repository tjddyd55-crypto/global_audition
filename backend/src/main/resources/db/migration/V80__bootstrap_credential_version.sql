-- A rotation changes this opaque marker and invalidates this account's prior sessions.
ALTER TABLE users ADD COLUMN bootstrap_credential_version UUID;

-- The two environment variables manage one account, independent of its login email.
CREATE UNIQUE INDEX uq_users_bootstrap_managed_account
    ON users ((1)) WHERE bootstrap_credential_version IS NOT NULL;
