# Backend memory tuning (Railway)

## Symptom

- DEV/PROD backend **idle** RSS ≈ **1.55 GB** with ~0% CPU.
- Peer Spring monoliths on Railway often sit at **0.1–0.45 GB**.

## Root cause (confirmed in repo)

| Factor | Finding |
|--------|---------|
| **JVM flags** | `backend/railway.toml` used `java -jar target/*.jar` with **no heap cap**. |
| **Container ergonomics** | Java 17 `UseContainerSupport` sizes max heap from **cgroup memory limit** (`MaxRAMPercentage`, default 25%). A multi-GB Railway limit → **~1.5 GB committed heap** at idle. |
| **Traffic** | Not the driver (CPU ≈ 0; DEV ≈ PROD). |
| **Startup preload** | No full-table memory preload found. |
| **Large static caches** | Only small TTL maps (`CreditPolicyPublicSnapshotCache`, rate limiters). |
| **Media** | `MultipartFile.getBytes()` on upload path only (not idle RSS). |
| **Extra runtimes** | No Playwright/Chromium/ML; deps are Spring Web/JPA, JWT, AWS S3 SDK, image libs. |
| **Actuator** | On classpath; default HTTP exposure is health-only (no public memory endpoint added). |

## Changes (`fix/backend-memory-footprint`)

1. **`railway.toml`** — explicit `-Xms128m -Xmx512m`, metaspace/code cache caps, `ExitOnOutOfMemoryError`.
2. **`application.yml`** — Tomcat `max` threads 50; Hikari `maximum-pool-size` 8, `minimum-idle` 2.
3. **`StartupLoggingListener`** — logs heap/non-heap MB and live thread count at boot (for Railway logs).

## Railway operations (manual)

1. Deploy to **development** first.
2. Set service **memory limit** to **1024 MB** (after JVM flags; do not only lower limit without `-Xmx`).
3. Watch 30–60 min: memory graph, restarts, `/api/health`, smoke APIs.
4. Compare avg RSS to baseline **1.55 GB**.
5. Apply to production only after develop soak.

## Tuning knobs (if OOM under load)

- Increase `-Xmx` in `startCommand` (e.g. 640m / 768m) before raising Railway limit.
- `JAVA_TOOL_OPTIONS` on Railway merges with the start command — use sparingly.

## Not changed

- Business rules, DTOs, payment, DB schema, Native/frontend.
