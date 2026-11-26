-- A rotation changes this opaque marker and invalidates this account's prior sessions.
ALTER TABLE users ADD COLUMN bootstrap_credential_version UUID;
