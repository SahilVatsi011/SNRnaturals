# Operations — Supabase Keep-Alive

## Why this exists

Supabase **pauses free projects after 7 days with no API activity.** A paused
project needs a manual "Restore" in the dashboard, and any request from a
visitor or a background job counts as activity.

So we run two independent, zero-cost pings against the project's REST API.
Between them, forgetting to do anything is not an option.

| Net | What runs it | Cadence | Depends on |
|---|---|---|---|
| GitHub Actions | `.github/workflows/keep_alive.yml` | every 2 days, 06:00 UTC | GitHub (repo secrets `SUPABASE_URL`, `SUPABASE_ANON_KEY`) |
| Local macOS cron | `scripts/keep_alive_local.sh` | every 3rd day, 06:00 local | this Mac being on |
| Store traffic | real customers / your own browsing | whenever | — |

## Net 1 — GitHub Actions

```bash
gh secret set SUPABASE_URL -b "https://snucyelfztwtcqyecpml.supabase.co"
gh secret set SUPABASE_ANON_KEY -b "<anon key from .env.local>"
gh workflow run keep_alive.yml      # manual test
gh run list --workflow keep_alive.yml --limit 3
gh run watch                        # watch the latest run
```

A healthy run logs `Supabase ping: HTTP 200`.

> GitHub disables *scheduled* workflows on a private repo after 60 days of repo
> inactivity. This repo gets regular commits, so that never triggers.

## Net 2 — Local macOS cron

```bash
chmod +x scripts/keep_alive_local.sh
(crontab -l 2>/dev/null; echo "0 6 */3 * * /bin/bash $PWD/scripts/keep_alive_local.sh") | crontab -
crontab -l                                  # confirm the entry
bash scripts/keep_alive_local.sh            # test once, right now
tail -5 /tmp/snr-keepalive.log              # expect: ... ping -> HTTP 200
```

Keys are read from `.env.local` at run time, so the script holds no secrets and
is safe to commit.

## Verifying things are actually alive

```bash
# local ping log
tail -5 /tmp/snr-keepalive.log

# direct manual ping (no cron involved)
bash scripts/keep_alive_local.sh && tail -1 /tmp/snr-keepalive.log

# GitHub Actions side
gh run list --workflow keep_alive.yml --limit 3

# project reachable at all
curl -s -o /dev/null -w "%{http_code}\n" https://snucyelfztwtcqyecpml.supabase.co/rest/v1/products?select=id\&limit=1 \
  -H "apikey: <anon key>"
```

If the project ever does get paused: Supabase dashboard → the project →
**Restore**. Data is untouched.

## Free-tier headroom (30 orders/day)

- **Rows:** ~900 orders/month ≈ 11k/year, against the 500,000-row limit.
- **Size:** ~3 KB/order ≈ 32 MB/year, against the 500 MB limit.
- The binding constraint is **egress bandwidth (5 GB/month)** — keep product
  images compressed and long-cache; that is what to watch, not the database.