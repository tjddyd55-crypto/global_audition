# Repository cleanup — output (structural only)

## 1. Moved files/folders

| From (root) | To |
|-------------|-----|
| `_archived_legacy/` | `docs/_archived_legacy/` |
| `dev_task/` | `docs/dev_task/` |
| `scripts/` | `docs/scripts/` |
| `VALIDATION_REPORT.md` | `docs/_history/VALIDATION_REPORT.md` |
| `VALIDATION_SUMMARY.md` | `docs/_history/VALIDATION_SUMMARY.md` |

## 2. Deleted files/folders

| Item | Note |
|------|------|
| `.vscode/` | IDE-local settings (not shared in repo) |
| `mobile/` | Not in current product scope |
| `docker-compose.yml` | Railway is the only runtime target |

## 3. Final repository tree (root)

```
/
├── backend/
├── frontend/
│   └── web/
├── docs/
│   ├── _archived_legacy/
│   ├── dev_task/
│   ├── scripts/
│   ├── _history/
│   └── (current docs)
├── .gitignore
├── ENV_LOCAL_TEMPLATE.txt
├── README.md
└── README_DEPLOY.md
```

No other top-level folders. See `docs/REPO_STRUCTURE.md` for the SSOT rule.

## 4. Build confirmation

- **Backend:** `cd backend && ./mvnw -DskipTests compile` — **success** (paths unchanged; Railway root = `backend`).
- **Frontend:** `cd frontend/web && npm run build` — **success** (paths unchanged; Railway root = `frontend/web`).
- No imports or build configs referenced removed paths. One comment in `frontend/web/src/lib/api/vault.ts` was updated (backend/services/media-service → backend monolith). Doc references to moved paths were updated (e.g. `docs/_archived_legacy`, `docs/dev_task`, `docs/scripts`).
