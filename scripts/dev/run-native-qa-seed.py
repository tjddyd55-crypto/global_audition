#!/usr/bin/env python3
"""DEVELOPMENT ONLY — DO NOT RUN IN PRODUCTION.

Applies Native QA seed SQL to Railway *development* Postgres.
Requires DATABASE_PUBLIC_URL (or DATABASE_URL) in environment.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path
from urllib.parse import urlparse

import psycopg2

ROOT = Path(__file__).resolve().parents[2]
DEV_DIR = Path(__file__).resolve().parent

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

    print(f"OK: development guard passed (host={host}, env={env_name or 'n/a'})")


def run_sql_file(conn, path: Path) -> None:
    sql = path.read_text(encoding="utf-8")
    with conn.cursor() as cur:
        cur.execute(sql)
    conn.commit()
    print(f"OK: executed {path.name}")


def verify_seed(conn) -> None:
    with conn.cursor() as cur:
        cur.execute("SELECT COUNT(*) FROM auditions WHERE title LIKE '[DEV-QA]%'")
        auditions = cur.fetchone()[0]
        cur.execute(
            "SELECT balance FROM user_credits WHERE user_id = %s",
            ("779144eb-602d-4303-be67-a6684630d74d",),
        )
        credits = cur.fetchone()
        cur.execute("SELECT COUNT(*) FROM channel_videos WHERE visibility = 'PUBLIC' AND title LIKE '[DEV-QA]%'")
        videos = cur.fetchone()[0]
    print(f"VERIFY: dev_qa_auditions={auditions}, p0qa_balance={credits[0] if credits else None}, dev_qa_public_videos={videos}")


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
            if action == "seed":
                run_sql_file(conn, cleanup)
            run_sql_file(conn, seed)
            verify_seed(conn)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
