# Repository structure (SSOT)

## Final directory layout

```
/
├── backend/                 # Single Spring Boot app (Railway root = backend)
├── frontend/
│   └── web/                 # Next.js app (Railway root = frontend/web)
├── docs/                    # All documentation and reference
│   ├── _archived_legacy/    # Archive placeholder (legacy code already removed)
│   ├── dev_task/            # Task/scope docs (reference)
│   ├── scripts/             # Helper scripts (e.g. create-env-local.ps1)
│   ├── _history/            # Historical reports (e.g. VALIDATION_*)
│   └── (current docs)
├── .gitignore
├── ENV_LOCAL_TEMPLATE.txt
├── README.md
└── README_DEPLOY.md
```

No other top-level folders. No `mobile/`, no `docker-compose.yml`, no `.vscode/` in repo.

## Why only backend / frontend/web / docs are SSOT

- **backend/** — Single deployable; one JAR, Flyway SSOT, Postgres. Railway backend service uses this as root.
- **frontend/web/** — Single Next.js app. Railway frontend service uses this as root.
- **docs/** — All non-code: runbooks, architecture, archived/reference material, scripts. Keeps root minimal and avoids confusion with legacy or experimental folders.

## Rule

**No new top-level folders without an explicit architectural decision.** New code belongs under `backend/` or `frontend/web/`; new docs/scripts under `docs/`.
