# Railway memory and cost audit — Development only

Status: PARTIAL — local build, regression suite and memory comparison completed;
Railway deployment and real-service before/after validation are BLOCKED on access.
No Railway deployment or settings change has been performed.
Base: develop aa6fc4e2bf5146b57eea8992d02fdfe64b33da18. Production/main is untouched.

## 1. What is known about the memory usage

User-reported last-24-hour averages (not independently queried):

| Service | Development | Production |
| --- | ---: | ---: |
| Backend | 952 MB | 728 MB |
| Frontend | 100 MB | 116 MB |
| PostgreSQL | 66 MB | 47 MB |

The Development Backend limit is reportedly 1 GB. Do not lower it during this experiment.

`backend/pom.xml` uses Java 17, Spring Boot 3.2.0, embedded Tomcat, Hibernate/JPA,
PostgreSQL, HikariCP, Actuator, springdoc and the synchronous AWS S3 SDK. No Spring
Boot DevTools dependency was found. The POM sets the Java compilation target; the
deployed runtime Java version still requires confirmation from Railway.

`backend/railway.toml` already packages once with Maven/Nixpacks and runs a single
`java -jar` process with Xms128m, Xmx512m, MaxMetaspaceSize192m, code cache64m,
UseContainerSupport and ExitOnOutOfMemoryError. No explicit MaxRAMPercentage is
configured; an explicit Xmx takes priority over percentage-based heap sizing.
These are repository settings, not evidence that the deployed process uses them.
Check Railway's actual deployment commit/config path and service-level start command.
Review the *presence* and effective effects of JAVA_TOOL_OPTIONS/JDK_JAVA_OPTIONS/
_JAVA_OPTIONS without logging their contents.

Xmx is neither RSS nor the service's total memory. The heap, metaspace, code cache,
direct/mapped buffers, thread stacks, GC bookkeeping, native allocations, shared
libraries and container file cache must be distinguished. Heap/metaspace/code-cache
limits sum to 768 MiB, but are ceilings rather than measured resident consumption.
No explicit direct-buffer limit or stack-size override exists. G1/direct/native
allocations and a higher actual heap setting remain hypotheses, not diagnosed leaks.

Current shared settings: Tomcat max50/min-spare5, max-connections200; Hikari max8/
min-idle2/lifetime30min; open-in-view=false; SQL logging off; ddl-auto=none.
Tomcat's maximum does not mean 50 resident application threads exist at idle.
JPA has no explicitly configured second-level/query cache provider. Actuator is
present, but no Prometheus registry or extra exported metrics endpoint is configured.
Do not expose `/actuator/env`, heap dumps or configuration properties for this audit:
SecurityConfig permits `/actuator/**`, so new exposure would be unsafe.

The existing StartupLoggingListener records heap init/max/used/committed, aggregate
non-heap use and live threads at readiness, without printing JVM-option values.
It does not establish steady-state RSS or retention over time.

Cache review: RecoveryRateLimiter and ImageUploadRateLimiter keep keys indefinitely;
GoogleAccessTokenClient caches by account email; CreditPolicyPublicSnapshotCache
retains keys after its 20-second value TTL. Growth depends on distinct keys/accounts.
This is a retention risk requiring cardinality/heap evidence, not an explanation of
952 MB at almost zero traffic. Authentication, credit and upload controls are unchanged.

## 2. Opt-in candidate

The shared application.yml, railway.toml, migration files and frontend are unchanged.
The new `scripts/start-development-memory.sh` and `application-development-memory.yml`
are an experiment, not an automatic rollout:

| Setting | Current repository | Development candidate |
| --- | --- | --- |
| Initial / maximum heap | 128 / 512 MiB | 64 / 384 MiB |
| Collector | JVM-selected | Serial GC |
| Metaspace / code-cache ceiling | 192 / 64 MiB | unchanged |
| Hikari max / minimum idle | 8 / 2 | 4 / 1 |
| Tomcat max / minimum spare | 50 / 5 | 50 / 2 |
| Railway memory limit | reported 1 GB | unchanged |

Serial GC is a low-throughput candidate with fewer GC threads/native overhead. It can
increase stop-the-world pause times, so promote it only after latency and GC-pause
measurement. The application still processes translations, checks authorization,
and uses the same database/storage/payment paths. No background feature is disabled.
No new explicit direct-buffer or stack cap is introduced. HotSpot's default direct
memory ceiling can follow Xmx, so direct-buffer headroom must still be checked under
upload/HTTP workloads. The explicit metaspace cap is unchanged.

The start script refuses any environment name except Development/development and
refuses inherited JVM option variables to avoid silently conflicting memory/GC flags.
Review existing options securely; do not blindly delete agents or required settings.
Native Memory Tracking is opt-in via DEVELOPMENT_MEMORY_DIAGNOSTICS=true; remove this
diagnostic flag after measurement because it has overhead.

## 3. Railway rollout and before/after measurement

Blocked until Development-scoped Railway authentication and network access are usable.
No claim of a lower Railway average, CPU usage or bill is made by local tests.

1. Confirm project/environment/service IDs, deployed commit, Java version, replicas,
   memory/vCPU limits, restart count, source branch, config-file root, start command,
   Serverless, health checks and watch paths. Read Production settings only; do not
   apply variables, deploy or restart there. Export only non-secret settings; leave
   secrets and credentials in Railway's secure configuration.
2. Capture a comparable baseline window, ideally 24 hours, plus startup and controlled
   development traffic: Railway memory/CPU and restart/OOM metrics; process RSS;
   cgroup memory.current/stat (anon/file/kernel); heap used/committed/max; each memory
   pool; BufferPoolMXBean direct/mapped usage; thread count; Hikari use/waits;
   p50/p95 response time and GC pause time. Identify units (MB/MiB, core-percent/vCPU).
   If jcmd is available, use `VM.flags`, `GC.heap_info`, and NMT `VM.native_memory
   summary`/`baseline`/`summary.diff`. NMT needs a diagnostic restart and does not
   account for every third-party native allocation or container page cache. Never
   collect env/system-property dumps, raw heap dumps or account payloads into Git.
3. Verify the existing start command is actually active before reducing heap. If it
   is overridden, first test restoring the known command in Development. This may
   solve the discrepancy without the smaller candidate.
4. After local tests pass, deploy the reviewed commit to **Development Backend only**.
   Change only its service-level start command to
   `bash scripts/start-development-memory.sh` (service root backend). Keep 1 GB limit,
   DB/volumes/credentials/replica count unchanged. Do not replace shared railway.toml.
   Platform variable changes can trigger deployment, so select the environment explicitly.
5. Warm up and observe readiness; run login/session, audition list/detail, application
   flows against test data, translation completion, image/contract upload to Development
   storage with synthetic files, and payment-path tests without charging money.
   Never reuse real credits/applications or choose personal media just for a benchmark.
6. Sample matched idle/load windows and then a 24-hour soak. Stop on any OOM, restart
   loop, readiness failure, pool timeout or material response/GC-pause regression.
   Restore the captured original Development start command and JVM/profile variables
   if these occur. Do not change the DB or run rollback migrations. If 384 MiB is
   inadequate, restore 512 MiB and retain only changes supported by measurements.

Short local probes do not prove absence of a memory leak. Compare post-GC live heap,
cache cardinality and native committed growth at the same workload over hours. Do not
use forced GC as an operational optimization or confuse peak startup with idle averages.

## 4. Regression evidence

Java 17 local build/verify against a dedicated local PostgreSQL 15 instance:
243 unit tests passed; integration 88 discovered, 87 passed, 1 skipped; 0 failures/
errors. `ContractStorageIT.presignedDownloadExpiresAndMatchesBytes` was skipped
because its optional local S3-compatible endpoint was unavailable. Attempts to pull
MinIO from Docker Hub and Quay were denied by the registries, so that test remains
SKIPPED; no real R2 credentials were requested or used. It is not an upload PASS.
The development launcher rejects Production, missing environment and conflicting JVM
options before starting Java.

### Local comparison (2026-11-10)

One sequential run per configuration, Temurin Java 17.0.21, ActiveProcessorCount=2,
NMT summary enabled on both, same empty local PostgreSQL database/schema, no R2 or
external provider. Processes ran on the cloud host (not a Railway 1 GB container).
Each run: readiness, smoke requests, 60 one-second idle samples, 200 audition-list
requests at concurrency4, then 60 one-second idle samples. No forced GC. This is a
short diagnostic probe, not a 24-hour average, capacity proof or statistical benchmark.

| Metric | Existing settings | Development candidate |
| --- | ---: | ---: |
| Mean RSS during first idle window | 427.40 MiB | 347.50 MiB |
| Mean RSS after load | 436.29 MiB | 355.08 MiB |
| CPU during first idle window (one core=100%) | 1.95% | 2.05% |
| CPU after load (one core=100%) | 0.88% | 0.64% |
| Readiness time | 12.16 s | 12.18 s |
| List-request p50 / p95 | 10.97 / 24.28 ms | 8.24 / 22.02 ms |
| OS threads at end of first idle window | 37 | 27 |
| NMT GC committed at first idle snapshot | 42.58 MiB | 0.42 MiB |
| NMT total committed at first idle snapshot | 361.63 MiB | 292.41 MiB |

Local idle RSS decreased by 79.90 MiB (18.7%); post-load RSS by 81.21 MiB (18.6%).
Metaspace committed remained about 98 MiB in both runs. Reduced GC native overhead
and heap commitment explain part of the local reduction. This does not explain the
entire Railway 952 MB observation. Startup, cold caches, allocation patterns, traffic,
environment overrides and container accounting may differ. First-window CPU includes
post-startup compilation; the small difference is not evidence of a CPU improvement.

Both runs returned 200 for health/version/auditions/tags/public-agencies and 401 for
unauthenticated auth/me, and completed all 200 load requests with 200. No process
exit/OOM was observed during the probes. Empty-list requests are not representative
of populated data, image decoding, authenticated writes, credit use, video upload or
provider calls. GC pause distributions and a long soak are still required.

Numeric machine-readable evidence is in `docs/evidence/railway-memory-local.json`.

These are local tests. Railway Development end-to-end authentication/payment/upload
and memory validation remain BLOCKED pending access. No real payment was made and no
existing account, database or storage object was deleted.

## 5. Frontend and Serverless

Next.js 14.0.4 builds with `next build` and runs `next start`, not `next dev`.
Nixpacks retains build tooling but the runtime command does not invoke it.
NODE_OPTIONS=--max-old-space-size=1024 is a ceiling, not a 1 GB reservation. Reducing
this value alone will not save the reported 100 MB average and risks build/runtime OOM.

Static export is not equivalent: next.config.js rewrites same-origin `/api/*` to
BACKEND_PROXY_ORIGIN, middleware handles locale/device/cookies and authenticated admin
requests, and server components read request headers. An export would require a new
proxy/auth/locale design and regression work. Keep Node for now. Future options are a
tested standalone runtime artifact (smaller image, not guaranteed lower RSS), CDN
caching of public/static assets with correct Vary/cookie handling, and more granular
deploy watch paths. Never cache authenticated APIs or private application/video data.

ContentTranslationScheduler calls worker.drain every 5 seconds by default. Even an
empty queue performs a transactional PostgreSQL UPDATE/SELECT claim; Hikari also
maintains connections and rotates them after 30 minutes. This generates outbound
traffic and may prevent Serverless sleeping. Do not disable the queue, set infinite
poll delay, or close DB access just to obtain a sleep result: pending translations
could stop completing. Actual Railway sleep/wake eligibility is unverified. Test with
queue empty, background traffic measured and no external uptime probes, then test
wake/readiness/session/queued-job behavior against Railway's current Serverless rules.
If outbound traffic prevents sleeping, retain always-on behavior; an event-driven
worker is a separate architecture task. PostgreSQL/volumes can continue costing money
even when application services are suspended.

## 6. Cost estimate

Savings must use Railway's actual metered units and current plan rates:

`monthly saving = (before_mean_GB - after_mean_GB) * billed_hours * memory_GB_hour_rate`

Add measured vCPU-hour changes, and subtract neither subscription minimums nor
included usage twice. Network, volume, database and build charges remain separate.
Illustratively, at an **assumed** $10/GB-month rate and decimal MB, 952→500 MB would
save ~$4.52/month; 952→300 MB ~$6.52/month for that Backend alone. These are scenarios,
not achieved savings or a verified tariff. If values are MiB, convert consistently.
Check https://docs.railway.com/reference/pricing and the actual invoice/plan before
quoting an expected final bill. CPU was reported low but no numeric baseline was given.

## 7. Production preservation and future recovery

Production shutdown is performed by the user. Do not deploy, restart, change its
variables or delete services/DB/volumes during this task. Its automatic deployment
state cannot be verified without Railway access. Before suspending, the user should
disable automatic deploys on both Production app services and check source branches,
watch paths, image triggers, deployment webhooks and CI/deploy credentials. Record the
last healthy commit/artifact, root/config/start commands, limits, replicas, domains,
DB/volume IDs, backups and secret references securely. Do not export secret values here.

For future explicitly authorized recovery: verify DB/volume/backups and environment
bindings first; confirm source commits and schema compatibility; restore the recorded
Production commands and limits (not this Development candidate); start Backend then
Frontend; check health, authentication, private data access, lists, storage and mock
payment behavior; observe memory/restarts/latency before re-enabling automatic deploys.
Do not recreate the DB, reset data or edit old Flyway migrations. Apply any later
memory optimization to Production only after separate authorization and a successful
Development soak. The deprecated application-production.yml must not be activated.

## 8. Follow-up opportunities

Measure before selecting: smaller heap vs Serial/G1 pauses; DB-pool waits; cache
cardinality/expired-key cleanup without weakening rate limits; image decode dimensions
(compressed upload size does not bound decoded pixels); event-driven translation
dispatch; dependency/framework updates in a separate compatibility/security task;
Development-only deploy watch paths and cancellation of obsolete builds. No scheduler,
upload, payment, authentication or credit logic was modified by this audit.
