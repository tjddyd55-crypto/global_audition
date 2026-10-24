#!/usr/bin/env python3
"""DEVELOPMENT ONLY — DO NOT RUN IN PRODUCTION.

Applies Native QA seed SQL to Railway *development* Postgres.
Requires DATABASE_PUBLIC_URL (or DATABASE_URL) in environment.

Safety:
  * `seed` never runs cleanup first: the seed is idempotent on its own
    (fixed UUIDs + ON CONFLICT DO NOTHING, credits only via QA_SEED ledger).
  * `cleanup` aborts if QA auditions have fee ledger rows or foreign applications.
  * Requires QA_SEED_CONFIRM_ENV=development, and sets the session flag
    app.qa_seed_env=development that the SQL files check before doing anything.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path
from urllib.parse import urlparse

import psycopg2

ROOT = Path(__file__).resolve().parents[2]
DEV_DIR = Path(__file__).resolve().parent
QA_APPLICANT_ID = "00000006-0000-4000-8000-000000000006"

ALLOWED_HOST_MARKERS = (
    "shortline.proxy.rlwy.net",
    "postgres-develop",
    "localhost",
    "127.0.0.1",
)
BLOCKED_HOST_MARKERS = (
    "postgres-production",
    "postgres-main",
)


def resolve_db_url() -> str:
    url = os.environ.get("DATABASE_PUBLIC_URL") or os.environ.get("DATABASE_URL")
    if not url:
        print("ERROR: DATABASE_PUBLIC_URL or DATABASE_URL is required.", file=sys.stderr)
        sys.exit(2)
    return url


def assert_development_only(url: str) -> None:
    host = (urlparse(url).hostname or "").lower()
    env_name = (os.environ.get("RAILWAY_ENVIRONMENT_NAME") or os.environ.get("RAILWAY_ENVIRONMENT") or "").lower()

    if any(marker in host for marker in BLOCKED_HOST_MARKERS):
        print(f"ABORT: blocked host marker matched ({host}). Production-like endpoint.", file=sys.stderr)
        sys.exit(3)

    if env_name and env_name not in ("development", "develop", "dev"):
        print(f"ABORT: RAILWAY_ENVIRONMENT_NAME={env_name!r} is not development.", file=sys.stderr)
        sys.exit(3)

    if env_name == "" and not any(marker in host for marker in ALLOWED_HOST_MARKERS):
        print(f"ABORT: host {host!r} is not in development allowlist.", file=sys.stderr)
        sys.exit(3)

    if os.environ.get("QA_SEED_CONFIRM_ENV", "").lower() != "development":
        print("ABORT: set QA_SEED_CONFIRM_ENV=development to confirm the target.", file=sys.stderr)
        sys.exit(3)

    print(f"OK: development guard passed (host={host}, env={env_name or 'n/a'})")


def run_sql_file(conn, path: Path) -> None:
    sql = path.read_text(encoding="utf-8")
    with conn.cursor() as cur:
        cur.execute("SET app.qa_seed_env = 'development'")
        cur.execute(sql)
    conn.commit()
    print(f"OK: executed {path.name}")


def verify_seed(conn) -> None:
    with conn.cursor() as cur:
        cur.execute("SELECT COUNT(*) FROM auditions WHERE title LIKE '[DEV-QA]%'")
        auditions = cur.fetchone()[0]
        cur.execute(
            """
            SELECT w.balance, COALESCE((SELECT SUM(amount) FROM credit_transactions t WHERE t.user_id = w.user_id), 0)
            FROM user_credits w WHERE w.user_id = %s
            """,
            (QA_APPLICANT_ID,),
        )
        credits = cur.fetchone()
        cur.execute(
            """
            SELECT COUNT(*) FROM (
              SELECT 1 FROM credit_transactions
              WHERE type = 'USE' AND reason = 'AUDITION_APPLY' AND reference_id IS NOT NULL
              GROUP BY user_id, reference_id HAVING COUNT(*) > 1) d
            """
        )
        dup_fee_groups = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM channel_videos WHERE visibility = 'PUBLIC' AND title LIKE '[DEV-QA]%'")
        videos = cur.fetchone()[0]
    print(
        f"VERIFY: dev_qa_auditions={auditions}, qa_applicant_balance={credits[0] if credits else None}, "
        f"qa_applicant_ledger_sum={credits[1] if credits else None}, dup_fee_groups={dup_fee_groups}, "
        f"dev_qa_public_videos={videos}"
    )
    if credits and credits[0] != credits[1]:
        print("WARN: qa applicant wallet != ledger sum", file=sys.stderr)
        sys.exit(4)


def main() -> None:
    action = sys.argv[1] if len(sys.argv) > 1 else "seed"
    url = resolve_db_url()
    assert_development_only(url)

    cleanup = DEV_DIR / "cleanup-native-qa-develop.sql"
    seed = DEV_DIR / "seed-native-qa-develop.sql"

    conn = psycopg2.connect(url)
    try:
        if action in ("cleanup", "reset"):
            run_sql_file(conn, cleanup)
        if action in ("seed", "reset"):
            run_sql_file(conn, seed)
            verify_seed(conn)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
