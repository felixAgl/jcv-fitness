#!/usr/bin/env bash
#
# transcode-exercise-media.sh — GIF -> MP4 (H.264) + WebP poster for the
# exercise library media (dataset: github.com/hasaneyldrm/exercises-dataset).
#
# For every *.gif in SRC_DIR this produces:
#   OUT_DIR/mp4/{basename}.mp4       H.264, yuv420p, faststart, crf 30, no audio
#   OUT_DIR/posters/{basename}.webp  first frame, libwebp quality 75
#
# Re-runnable: existing non-empty outputs are skipped, so an interrupted run
# can simply be restarted. Parallelized with xargs -P.
#
# Usage:
#   ./scripts/transcode-exercise-media.sh <SRC_DIR> <OUT_DIR> [JOBS]
#
# Example:
#   ./scripts/transcode-exercise-media.sh ~/exercises-dataset/videos /tmp/exmedia 8
#
# Upload afterwards (R2 bucket jcv-exercise-media, served at media.jcv24fitness.com):
#   mp4/     -> videos-mp4/{basename}.mp4  (content-type video/mp4)
#   posters/ -> posters/{basename}.webp    (content-type image/webp)

set -euo pipefail

SRC_DIR="${1:?usage: $0 <SRC_DIR> <OUT_DIR> [JOBS]}"
OUT_DIR="${2:?usage: $0 <SRC_DIR> <OUT_DIR> [JOBS]}"
JOBS="${3:-8}"

FFMPEG="${FFMPEG:-/opt/homebrew/bin/ffmpeg}"

# Some ffmpeg builds ship without the libwebp encoder; fall back to the
# standalone cwebp binary (brew install webp) via a PNG intermediate.
if "$FFMPEG" -hide_banner -encoders 2>/dev/null | grep -q libwebp; then
  WEBP_MODE="ffmpeg"
else
  WEBP_MODE="cwebp"
  command -v cwebp >/dev/null || { echo "Need ffmpeg with libwebp or cwebp on PATH" >&2; exit 1; }
fi

mkdir -p "$OUT_DIR/mp4" "$OUT_DIR/posters"

export FFMPEG OUT_DIR WEBP_MODE

transcode_one() {
  local gif="$1"
  local base mp4 poster
  base="$(basename "$gif" .gif)"
  mp4="$OUT_DIR/mp4/$base.mp4"
  poster="$OUT_DIR/posters/$base.webp"

  # MP4: H.264, even dimensions (yuv420p requires them), faststart for web.
  if [ ! -s "$mp4" ]; then
    "$FFMPEG" -hide_banner -loglevel error -y -i "$gif" \
      -movflags faststart -pix_fmt yuv420p \
      -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" \
      -an -crf 30 "$mp4" || { echo "FAIL mp4 $base" >&2; rm -f "$mp4"; return 1; }
  fi

  # Poster: first frame as WebP.
  if [ ! -s "$poster" ]; then
    if [ "$WEBP_MODE" = "ffmpeg" ]; then
      "$FFMPEG" -hide_banner -loglevel error -y -i "$gif" \
        -vframes 1 -c:v libwebp -quality 75 "$poster" \
        || { echo "FAIL poster $base" >&2; rm -f "$poster"; return 1; }
    else
      local png="$OUT_DIR/posters/$base.tmp.png"
      "$FFMPEG" -hide_banner -loglevel error -y -i "$gif" -vframes 1 "$png" \
        && cwebp -quiet -q 75 "$png" -o "$poster" \
        || { echo "FAIL poster $base" >&2; rm -f "$poster" "$png"; return 1; }
      rm -f "$png"
    fi
  fi
}
export -f transcode_one

find "$SRC_DIR" -name '*.gif' -print0 \
  | xargs -0 -n 1 -P "$JOBS" bash -c 'transcode_one "$1"' _

echo "Done. Outputs:"
echo "  mp4:     $(find "$OUT_DIR/mp4" -name '*.mp4' | wc -l | tr -d ' ') files, $(du -sh "$OUT_DIR/mp4" | cut -f1)"
echo "  posters: $(find "$OUT_DIR/posters" -name '*.webp' | wc -l | tr -d ' ') files, $(du -sh "$OUT_DIR/posters" | cut -f1)"
