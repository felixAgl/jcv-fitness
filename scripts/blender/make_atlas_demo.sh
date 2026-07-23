#!/usr/bin/env bash
# Build the "3D atlas" deliverables — the 3D counterparts of the SVG muscle
# atlas showcase (src/shared/components/MuscleAtlas):
#
#   <P>-regiones.png    every canonical muscle region glowing individually,
#                       front or back view (whichever shows it), montaged
#                       into one labelled contact sheet -> proves the 3D
#                       mannequin is atlas-grade addressable
#   <P>-turnaround.mp4  bench-press pattern (pectorals 1.0, delts+triceps
#                       0.35), standing, seamless 360-degree orbit, 6 s
#   <P>-squat.mp4       squat pattern (quads 1.0, glutes/hams/calves/
#                       lower-back 0.35), same orbit
#
# <P> is $PREFIX (default "3d-atlas"). Upload to R2 afterwards:
#   npx wrangler r2 object put jcv-exercise-media/demo/<file> \
#       --file out-3d/atlas-demo/<file> --content-type image/png|video/mp4 --remote
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BLENDER="${BLENDER:-/Applications/Blender.app/Contents/MacOS/Blender}"
FFMPEG="${FFMPEG:-/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg}"
FONT="${FONT:-/System/Library/Fonts/Supplemental/Arial Bold.ttf}"
BLEND="${BLEND:-$ROOT/assets/3d/jcv_mannequin.blend}"
PREFIX="${PREFIX:-3d-atlas}"
OUT="${OUT:-$ROOT/out-3d/atlas-demo}"
SHEET_SAMPLES="${SHEET_SAMPLES:-96}"
TURN_SAMPLES="${TURN_SAMPLES:-48}"
export BLENDER_USER_EXTENSIONS="${MPFB_EXT_DIR:-$ROOT/assets/3d/blender-extensions}"

render() { "$BLENDER" -b "$BLEND" -P "$ROOT/scripts/blender/render_exercise.py" -- "$@"; }

# same front/back split the atlas's pickAtlasView uses
FRONT="pectorals abs obliques delts biceps forearms quads adductors"
BACK="traps lats lower-back triceps glutes hamstrings calves"

mkdir -p "$OUT/tmp"

echo "== 1/3 region contact sheet =="
i=0; inputs=(); filters=""
for view in front back; do
  [ "$view" = front ] && list="$FRONT" || list="$BACK"
  for m in $list; do
    render --muscle "$m" --views "$view" --frames 1 --motion none \
           --res 540x960 --samples "$SHEET_SAMPLES" --out "$OUT/tmp"
    inputs+=(-i "$OUT/tmp/${m}_${view}.png")
    filters+="[$i]drawtext=fontfile=$FONT:text=$m:fontcolor=0x22d3ee:fontsize=30"
    filters+=":x=(w-tw)/2:y=h-60:box=1:boxcolor=0x0a0a0a@0.75:boxborderw=10[t$i];"
    i=$((i+1))
  done
done
# 8 front tiles on top, 7 back tiles (padded) below
row1="[t0][t1][t2][t3][t4][t5][t6][t7]hstack=inputs=8[r1]"
row2="[t8][t9][t10][t11][t12][t13][t14]hstack=inputs=7,pad=iw+540:ih:0:0:0x0a0a0a[r2]"
"$FFMPEG" -y -loglevel error "${inputs[@]}" \
  -filter_complex "$filters$row1;$row2;[r1][r2]vstack=inputs=2" \
  "$OUT/$PREFIX-regiones.png"

turn() { # exercise-name out-stem
  local stem frames
  render --turnaround --exercise-name "$1" --samples "$TURN_SAMPLES" \
         --out "$OUT/tmp/turn-$2"
  frames=("$OUT/tmp/turn-$2"/*_turnaround_0001.png)
  stem="$(basename "${frames[0]}")"; stem="${stem%_turnaround_0001.png}"
  "$FFMPEG" -y -loglevel error -framerate 24 -start_number 1 \
    -i "$OUT/tmp/turn-$2/${stem}_turnaround_%04d.png" \
    -c:v libx264 -pix_fmt yuv420p -crf 19 -movflags +faststart \
    "$OUT/$PREFIX-$2.mp4"
}

echo "== 2/3 bench-press turnaround =="
turn "Barbell Bench Press - Medium Grip" turnaround

echo "== 3/3 squat turnaround =="
turn "Barbell Squat" squat

echo "done -> $OUT"
