#!/usr/bin/env bash
# Build the owner-facing proof deliverables:
#   <P>-camaras.png       same pose, 4 camera angles      -> proves camera freedom
#   <P>-musculos.png      same camera, 3 muscles glowing  -> proves muscle control
#   <P>-movimiento.mp4    animated squat + camera orbit   -> proves motion
#   <P>-antes-despues.png old vs new mannequin            -> only when BLEND_PREV is set
#
# <P> is $PREFIX (default "3d"). Set PREFIX=3d-v2 for a new mannequin generation
# so the previous set of URLs keeps working.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BLENDER="${BLENDER:-/Applications/Blender.app/Contents/MacOS/Blender}"
FFMPEG="${FFMPEG:-/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg}"
FONT="${FONT:-/System/Library/Fonts/Supplemental/Arial Bold.ttf}"
BLEND="${BLEND:-$ROOT/assets/3d/jcv_mannequin.blend}"
BLEND_PREV="${BLEND_PREV:-}"
PREFIX="${PREFIX:-3d}"
OUT="${OUT:-$ROOT/out-3d/demo}"
SAMPLES="${SAMPLES:-128}"
export BLENDER_USER_EXTENSIONS="${MPFB_EXT_DIR:-$ROOT/assets/3d/blender-extensions}"

render() { "$BLENDER" -b "$BLEND" -P "$ROOT/scripts/blender/render_exercise.py" -- "$@"; }
render_prev() { "$BLENDER" -b "$BLEND_PREV" -P "$ROOT/scripts/blender/render_exercise.py" -- "$@"; }
label() { # in out text
  "$FFMPEG" -y -loglevel error -i "$1" -vf \
    "drawtext=fontfile=$FONT:text='$3':fontcolor=0x22d3ee:fontsize=54:x=(w-tw)/2:y=h-120:box=1:boxcolor=0x0a0a0a@0.75:boxborderw=24" \
    "$2"
}

mkdir -p "$OUT/tmp"

if [ -n "$BLEND_PREV" ]; then
  echo "== 0/4 before / after =="
  # identical muscle, camera and frame on both scenes: the only variable is the
  # mannequin itself
  render_prev --muscle quads --views three_quarter --frames 26 \
              --out "$OUT/tmp/prev" --samples "$SAMPLES"
  render      --muscle quads --views three_quarter --frames 26 \
              --out "$OUT/tmp/next" --samples "$SAMPLES"
  label "$OUT/tmp/prev/quads_three_quarter.png" "$OUT/tmp/ba_prev.png" "ANTES"
  label "$OUT/tmp/next/quads_three_quarter.png" "$OUT/tmp/ba_next.png" "DESPUES"
  "$FFMPEG" -y -loglevel error -i "$OUT/tmp/ba_prev.png" -i "$OUT/tmp/ba_next.png" \
    -filter_complex "[0][1]hstack=inputs=2" "$OUT/$PREFIX-antes-despues.png"
fi

echo "== 1/3 camera freedom =="
render --muscle quads --views front,three_quarter,side,closeup --frames 26 \
       --out "$OUT/tmp" --samples "$SAMPLES"
label "$OUT/tmp/quads_front.png"         "$OUT/tmp/l_front.png"  "FRONTAL"
label "$OUT/tmp/quads_three_quarter.png" "$OUT/tmp/l_tq.png"     "3/4"
label "$OUT/tmp/quads_side.png"          "$OUT/tmp/l_side.png"   "PERFIL"
label "$OUT/tmp/quads_closeup.png"       "$OUT/tmp/l_close.png"  "CLOSE-UP"
"$FFMPEG" -y -loglevel error -i "$OUT/tmp/l_front.png" -i "$OUT/tmp/l_tq.png" \
  -i "$OUT/tmp/l_side.png" -i "$OUT/tmp/l_close.png" \
  -filter_complex "[0][1][2][3]hstack=inputs=4" "$OUT/$PREFIX-camaras.png"

echo "== 2/3 muscle selection =="
# all three must be visible from the SAME camera, otherwise the comparison
# proves nothing to the viewer
for m in quads abs pectorals; do
  render --muscle "$m" --views three_quarter --frames 26 \
         --out "$OUT/tmp" --samples "$SAMPLES"
done
label "$OUT/tmp/quads_three_quarter.png"     "$OUT/tmp/m_quads.png" "CUADRICEPS"
label "$OUT/tmp/abs_three_quarter.png"       "$OUT/tmp/m_abs.png"   "ABDOMEN"
label "$OUT/tmp/pectorals_three_quarter.png" "$OUT/tmp/m_pecs.png"  "PECTORALES"
"$FFMPEG" -y -loglevel error -i "$OUT/tmp/m_quads.png" -i "$OUT/tmp/m_abs.png" \
  -i "$OUT/tmp/m_pecs.png" -filter_complex "[0][1][2]hstack=inputs=3" \
  "$OUT/$PREFIX-musculos.png"

echo "== 3/3 motion + orbit =="
render --muscle quads --views orbit --frames 1-48 --rep-frames 48 \
       --out "$OUT/frames" --samples "$SAMPLES"
"$FFMPEG" -y -loglevel error -framerate 24 -start_number 1 \
  -i "$OUT/frames/quads_orbit_%04d.png" \
  -filter_complex "[0]loop=loop=2:size=48:start=0,setpts=N/24/TB[v]" -map "[v]" \
  -c:v libx264 -pix_fmt yuv420p -crf 20 -movflags +faststart \
  "$OUT/$PREFIX-movimiento.mp4"

echo "done -> $OUT"
ls -lh "$OUT"/$PREFIX-*
