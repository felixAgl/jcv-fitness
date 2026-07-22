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
# one-time: fetch the Piper voice models (~180 MB, gitignored)
npm run reels:voices

# explicit exercise, Spanish voice-over + burned subtitles (default)
node scripts/reels/compose-reel.mjs 0043

# English cut of the same exercise
node scripts/reels/compose-reel.mjs 0043 --voice en --name my-reel-en

# the original silent reel (step captions instead of subtitles)
node scripts/reels/compose-reel.mjs 0043 --voice none

# deterministic daily pick (seeded by date, skips ids in used-ids.json)
node scripts/reels/compose-reel.mjs random --seed 2026-07-15 --mark-used
```

Output: `reels-out/{date}-{id}.mp4` (1080x1920, h264 + aac) and
`reels-out/{date}-{id}.txt` (bilingual caption with hashtags and the
"Ejercicio: Gymvisual" credit). `--name` overrides the basename.

Flags: `--voice es|en|none` (default `es`), `--subs` / `--no-subs` (default: on
whenever a voice is on), `--duration <s>`, `--out <dir>`, `--seed`,
`--mark-used`, `--name`.

Layout: graphite `#0a0a0a` background, upscaled looping exercise video in a
cyan-framed card, primary title (big, white — follows the narration language)
+ the other language (small, cyan `#22d3ee`), and the narration burned in as
subtitles in the band between the video card and the watermark.
Typeface: Bebas Neue (`assets/BebasNeue-Regular.ttf`, OFL, committed).

Duration: a voiced reel is as long as its narration (~20-30 s); a silent reel
keeps the original 10-15 s window.

## Voice-over + subtitles

Narration is **$0**: it is synthesized locally, offline, with no API key and no
account. Two files own this:

- `tts.mjs` — provider dispatch on `REELS_TTS_PROVIDER`, plus an ffprobe-backed
  duration for every segment and a content-hash cache in `.tmp/tts/`.
- `narration.mjs` — turns an exercise into a short coach-style script (name →
  2-3 cues → reps/CTA) and emits the `.ass` subtitle file.

| `REELS_TTS_PROVIDER` | License | Cost | Notes |
| --- | --- | --- | --- |
| `piper` *(default)* | MIT | $0 | ~60 MB onnx per voice, CPU-only, ~0.3 s/sentence. This is what CI runs. |
| `kokoro` | Apache-2.0 | $0 | Warmer prosody, but pulls torch (~2 GB) + espeak-ng — **too heavy for CI**, local hero reels only. |
| `elevenlabs` | paid | $$ | **Deliberate stub.** Throws "not configured"; no paid API is ever called. |

**Segment-level synthesis is the whole trick.** Each narration segment is
synthesized to its own wav and measured with `ffprobe`, so subtitle timings are
real spoken durations — no paid word-timestamp API is involved anywhere.

Voice models live in `voices/` and are **gitignored** (~60 MB each). Get them
with `npm run reels:voices`; the list lives in `download-voices.mjs`. Override
per language with `REELS_TTS_VOICE_ES` / `REELS_TTS_VOICE_EN`, or point
somewhere else with `REELS_VOICES_DIR`.

### Accents: audio vs. screen

`narration.mjs` produces two strings per segment on purpose:

- `speak` **keeps** accents (`glúteos`) — Piper/Kokoro phonemize from the
  written form, so stripping them degrades Spanish pronunciation.
- `show` is Spanish **without** accents, matching the existing on-screen
  convention used by the drawtext titles.

Both derive from the same source string, so they cannot drift.

### Swapping in a cloned voice later

Nothing in the pipeline changes shape. Implement `synthElevenLabs()` in
`tts.mjs` (one `fetch` POST), then:

```bash
REELS_TTS_PROVIDER=elevenlabs ELEVEN_API_KEY=... ELEVEN_VOICE_ID=... \
  node scripts/reels/compose-reel.mjs 0043
```

Subtitle timing keeps working untouched, because it is measured from the
returned audio rather than requested from the provider.

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

1. Installs ffmpeg + Piper and restores the cached voice models.
2. Picks an exercise deterministically from the date seed, excluding ids
   already in `used-ids.json` (FNV-1a hash of the seed modulo the remaining
   candidates; the cycle restarts once all 1,324 are used).
3. Composes **two** reels from that same exercise — `{date}-es.mp4` and
   `{date}-en.mp4`, each with its own voice-over and burned subtitles — plus
   the caption, and persists the updated `used-ids.json` via `actions/cache`.
4. Uploads all of them as a single workflow artifact (30-day retention) so the
   trainer can download and post manually.
5. Runs `publish-reel.mjs`, which **no-ops with exit 0** unless the repo
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
