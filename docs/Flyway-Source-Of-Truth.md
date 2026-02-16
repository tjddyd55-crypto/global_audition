## Flyway Migration Source of Truth

Flyway SQL migrations must live only in:

- `backend/src/main/resources/db/migration`

Do not add or modify migration SQL under `target/`.
`target/` is build output and is not source code.
