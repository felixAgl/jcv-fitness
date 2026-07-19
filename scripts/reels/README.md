# Reels pipeline

Automated bilingual (ES/EN) exercise Reels generated from the 1,324-exercise
library (`public/data/exercise-library.json`) and the exercise MP4s hosted at
`https://media.jcv24fitness.com/videos-mp4/`.

> **License gate:** the exercise clips are © Gymvisual. The owner's Gymvisual
> license is **in progress** — until it is finalized the pipeline only
> *generates* reels (manual review + posting). Do not add the Instagram
> secrets before the license is closed.

## Generate a reel

```bash
# explicit exercise
node scripts/reels/compose-reel.mjs 0043

# deterministic daily pick (seeded by date, skips ids in used-ids.json)
node scripts/reels/compose-reel.mjs random --seed 2026-07-15 --mark-used
```

Output: `reels-out/{date}-{id}.mp4` (1080x1920, h264, 10-15 s) and
`reels-out/{date}-{id}.txt` (bilingual caption with hashtags and the
"Ejercicio: Gymvisual" credit).

Layout: graphite `#0a0a0a` background, upscaled looping exercise video in a
cyan-framed card, ES title (big) + EN title (small, cyan `#22d3ee`), and the
first 3 Spanish instruction steps shown sequentially as bottom captions.
Typeface: Bebas Neue (`assets/BebasNeue-Regular.ttf`, OFL, committed).

Requires Node 18+ and ffmpeg **with drawtext** (libfreetype). On macOS the
core Homebrew `ffmpeg` bottle no longer ships drawtext — use:

```bash
brew install ffmpeg-full
FFMPEG=/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg node scripts/reels/compose-reel.mjs 0043
```

Ubuntu's `apt` ffmpeg (used in CI) includes drawtext.

## Daily automation

`.github/workflows/daily-reel.yml` runs every day at 16:00 UTC (11:00
Colombia):

1. Picks an exercise deterministically from the date seed, excluding ids
   already in `used-ids.json` (FNV-1a hash of the seed modulo the remaining
   candidates; the cycle restarts once all 1,324 are used).
2. Composes the reel + caption, commits the updated `used-ids.json`.
3. Uploads both files as a workflow artifact (30-day retention) so the
   trainer can download and post manually.
4. Runs `publish-reel.mjs`, which **no-ops with exit 0** unless the repo
   secrets `IG_USER_ID` and `IG_ACCESS_TOKEN` exist.

Manual run: Actions > Daily Reel > Run workflow (optionally pass an
`exercise_id`).

## Enable auto-publishing (once the Gymvisual license is finalized)

1. Convert the Instagram account to **Professional** (Business/Creator) and
   link it to a Facebook Page you admin.
2. Create a Meta app (type *Business*) at
   <https://developers.facebook.com/apps> and add the **Instagram Graph API**
   product.
3. In Graph API Explorer generate a user token with scopes
   `instagram_basic`, `instagram_content_publish`,
   `pages_read_engagement`, `business_management`.
4. Exchange it for a long-lived token (~60 days, must be rotated):
   `GET /oauth/access_token?grant_type=fb_exchange_token&client_id=APP_ID&client_secret=APP_SECRET&fb_exchange_token=TOKEN`
5. Find the IG user id: `GET /me/accounts` → page id →
   `GET /{page-id}?fields=instagram_business_account`.
6. Add the GitHub Actions secrets `IG_USER_ID` and `IG_ACCESS_TOKEN`.

`publish-reel.mjs` then creates a resumable `REELS` container, uploads the
local MP4 to `rupload.facebook.com` (no public URL needed), polls the
container status and publishes.
