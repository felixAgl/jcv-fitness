# Database Operational Notes

Operational hardening notes from the payment / DB audit. Companion to
`supabase/migrations/20260718000000_indexes_and_retention.sql` and
`.github/workflows/db-backup.yml`.

## 1. `user_plans.plan_data` JSON growth risk

`user_plans.plan_data` is a JSON column that holds the generated fitness plan.
The workout-logging feature **appends each logged workout into `plan_data.workoutLog`
in place**, so the JSON document grows without bound for active users:

- Every logged set / session enlarges the row.
- Postgres stores oversized values via TOAST, but each read/write still
  deserializes and rewrites the **whole** document, so latency and WAL volume
  grow with log length.
- There is no cap and no pruning today.

### Recommendation (not implemented yet — flag only)

Pick one when logs get large (order of preference):

1. **Cap the array** — keep only the last N entries in `workoutLog` (e.g. 200)
   and drop the oldest on write. Cheapest, no schema change.
2. **Move logs to their own table** — `workout_logs(user_id, plan_id, logged_at,
   payload jsonb)` with an index on `(user_id, logged_at)`. Correct long-term
   shape; keeps `plan_data` small and makes history queryable/paginated.

No schema change is made now; this is a watch item. Revisit once any user's
`plan_data` approaches a few hundred KB (`SELECT pg_column_size(plan_data)` per
row to monitor).

## 2. Indexes & payment idempotency

Migration `20260718000000_indexes_and_retention.sql`:

- `uniq_subscriptions_payment_ref` — UNIQUE on
  `subscriptions(payment_provider, payment_reference)`. This is the ON CONFLICT
  arbiter the MercadoPago worker uses to make webhook processing idempotent
  (one payment reference -> one subscription). **Do not drop it** without
  coordinating with the worker code. NULL `payment_reference` values do not
  collide (Postgres treats NULLs as distinct), so pre-payment rows are fine.
- Defensive FK/lookup indexes on `user_plans(user_id)`,
  `subscriptions(user_id)`, `webhook_logs(payment_id)`, `bookings(user_id)`,
  `bookings(slot_id)`. Live inspection (2026-07-18) showed these already exist;
  the `IF NOT EXISTS` statements are no-ops there but protect drifted / fresh
  environments.

## 3. `webhook_logs` retention

`prune_webhook_logs(retention_days integer DEFAULT 90)` deletes rows older than
`retention_days` (by `received_at`) and returns the row count. It is **defined
but not scheduled**. The worker cron can call `SELECT prune_webhook_logs(90);`
periodically. Keeps the webhook audit table bounded.

## 4. Backup & retention runbook

Workflow: `.github/workflows/db-backup.yml` (nightly, 06:30 UTC).

**Pipeline:** `pg_dump` over the Supabase pooler -> GPG AES-256 encrypt ->
upload to Cloudflare R2 (S3 API) -> prune R2 objects older than 30 days.

### Required GitHub Actions secrets

| Secret | Purpose |
| --- | --- |
| `SUPABASE_DB_URL` | Postgres pooler connection string for `pg_dump` |
| `BACKUP_PASSPHRASE` | GPG symmetric passphrase — **without it backups are unrecoverable** |
| `R2_ACCOUNT_ID` | Cloudflare account id; builds the R2 S3 endpoint |
| `R2_ACCESS_KEY_ID` | R2 S3 API access key id |
| `R2_SECRET_ACCESS_KEY` | R2 S3 API secret access key |
| `R2_BUCKET` | Target R2 bucket name |

If any secret is missing the workflow logs a warning and skips (stays green).

### Restore from an R2 backup

```bash
# 0. Set the same values used by the workflow (locally, not committed):
export R2_ACCOUNT_ID=...            # Cloudflare account id
export AWS_ACCESS_KEY_ID=$R2_ACCESS_KEY_ID
export AWS_SECRET_ACCESS_KEY=$R2_SECRET_ACCESS_KEY
export AWS_DEFAULT_REGION=auto
export R2_BUCKET=jcv-db-backups
export BACKUP_PASSPHRASE=...        # the same passphrase used to encrypt
ENDPOINT="https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com"

# 1. List available backups (newest last):
aws s3 ls "s3://${R2_BUCKET}/" --endpoint-url "$ENDPOINT"

# 2. Download the chosen encrypted dump:
aws s3 cp "s3://${R2_BUCKET}/jcv-db-YYYYMMDD-HHMMSS.sql.gpg" . \
  --endpoint-url "$ENDPOINT"

# 3. Decrypt:
gpg --batch --yes --passphrase "$BACKUP_PASSPHRASE" \
  -o restore.sql -d jcv-db-YYYYMMDD-HHMMSS.sql.gpg

# 4. Restore. ALWAYS restore into a fresh / staging database first and verify,
#    before touching production:
psql "$STAGING_DB_URL" -f restore.sql
```

**Notes**
- The dump uses `--no-owner --no-privileges`, so it restores cleanly into a
  different role/environment.
- Retention is 30 days of nightly backups. Keep at least one off-R2 copy of a
  known-good monthly dump if you need longer history.
- Test the restore path periodically — an untested backup is not a backup.
