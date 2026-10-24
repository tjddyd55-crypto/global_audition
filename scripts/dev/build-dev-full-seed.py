#!/usr/bin/env python3
"""Build ONE idempotent development SQL file for the Railway dashboard SQL editor.

Combines the official seed (seed-native-qa-develop.sql) and the full QA dataset
template, wraps them in a single transaction behind dev-only guards, and appends
verification SELECTs. The BCrypt hash is read from an untracked file
(QA_PW_HASH_FILE, default /workspace/secrets/ga-dev-qa-hash.txt); it is never
printed. Usage: build-dev-full-seed.py OUTPUT.sql
"""
import os
import pathlib
import re
import sys

HERE = pathlib.Path(__file__).resolve().parent
hash_file = pathlib.Path(os.environ.get("QA_PW_HASH_FILE", "/workspace/secrets/ga-dev-qa-hash.txt"))
pw_hash = hash_file.read_text().strip()
if not re.fullmatch(r"\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}", pw_hash):
    sys.exit("hash file does not contain a BCrypt hash")

base = (HERE / "seed-native-qa-develop.sql").read_text()
base = re.sub(r"(?m)^BEGIN;\s*$", "", base)
base = re.sub(r"(?m)^COMMIT;\s*$", "", base)
full = (HERE / "seed-dev-full-qa.template.sql").read_text().replace("__QA_PW_HASH__", pw_hash)

guard = """-- GLOBAL AUDITION — DEVELOPMENT ONLY full QA seed (generated; do not commit)
-- Run in Railway > global_audition > development > Postgres > Query. Safe to rerun.
BEGIN;
DO $devguard$
DECLARE fw int; ext int; pay int;
BEGIN
  SELECT max(version::int) INTO fw FROM public.flyway_schema_history WHERE success AND version ~ '^[0-9]+$';
  IF fw IS DISTINCT FROM 60 THEN RAISE EXCEPTION 'seed refused: flyway max is % (expected 60)', fw; END IF;
  SELECT count(*) INTO ext FROM public.users WHERE email NOT LIKE '%@audition.local';
  SELECT count(*) INTO pay FROM public.payment_orders;
  IF ext > 5 OR pay > 0 THEN
    RAISE EXCEPTION 'seed refused: DB has % non-QA users / % payment orders — not a freshly reset development DB', ext, pay;
  END IF;
END
$devguard$;
SELECT set_config('app.qa_seed_env', 'development', true);
"""
verify = """
COMMIT;

-- ===================== verification =====================
SELECT 'flyway_success_rows' k, count(*)::text v FROM public.flyway_schema_history WHERE success
UNION ALL SELECT 'flyway_max', max(version::int)::text FROM public.flyway_schema_history WHERE success AND version ~ '^[0-9]+$'
UNION ALL SELECT 'qa_users', count(*)::text FROM public.users WHERE email LIKE '%@audition.local'
UNION ALL SELECT 'users_by_role:' || role, count(*)::text FROM public.users WHERE email LIKE '%@audition.local' GROUP BY role
UNION ALL SELECT 'crm_agencies:' || approval_state, count(*)::text FROM public.crm_agencies WHERE display_name LIKE '[DEV-QA]%' GROUP BY approval_state
UNION ALL SELECT 'country_admins_active', count(*)::text FROM public.country_admin_appointments WHERE status = 'ACTIVE'
UNION ALL SELECT 'auditions:' || country_code, count(*)::text FROM public.auditions WHERE title LIKE '[DEV-QA]%' GROUP BY country_code
UNION ALL SELECT 'auditions_status:' || status, count(*)::text FROM public.auditions WHERE title LIKE '[DEV-QA]%' GROUP BY status
UNION ALL SELECT 'applications:' || a.status, count(*)::text FROM public.applications a JOIN public.auditions au ON au.id = a.audition_id WHERE au.title LIKE '[DEV-QA]%' GROUP BY a.status
UNION ALL SELECT 'channels_qa', count(*)::text FROM public.channels WHERE name LIKE '[DEV-QA]%'
UNION ALL SELECT 'channel_videos_qa', count(*)::text FROM public.channel_videos WHERE title LIKE '[DEV-QA]%'
UNION ALL SELECT 'qa_seed_grants', count(*)::text FROM public.credit_transactions WHERE reason = 'QA_SEED'
UNION ALL SELECT 'qa_seed_grant_dup_refs', count(*)::text FROM (SELECT reference_id FROM public.credit_transactions WHERE reason = 'QA_SEED' GROUP BY user_id, reference_id HAVING count(*) > 1) d
UNION ALL SELECT 'wallets', count(*)::text FROM public.user_credits
UNION ALL SELECT 'ledger_balance_mismatch', count(*)::text FROM public.user_credits w
   WHERE w.balance <> (SELECT coalesce(sum(amount),0) FROM public.credit_transactions t WHERE t.user_id = w.user_id)
UNION ALL SELECT 'apply_fee_dup_groups', count(*)::text FROM (SELECT 1 FROM public.credit_transactions WHERE type='USE' AND reason='AUDITION_APPLY' AND reference_id IS NOT NULL GROUP BY user_id, reference_id HAVING count(*) > 1) d
UNION ALL SELECT 'v39_index', indexname FROM pg_indexes WHERE schemaname='public' AND indexname IN ('ux_credit_tx_apply_fee','ux_credit_tx_package_purchase','ux_credit_tx_signup_reward')
ORDER BY 1, 2;
"""
out = pathlib.Path(sys.argv[1])
old = os.umask(0o077)
try:
    out.write_text(guard + base + "\n" + full + verify)
finally:
    os.umask(old)
os.chmod(out, 0o600)
print(f"wrote {out} ({len(out.read_text().splitlines())} lines)")
