#!/usr/bin/env bash
# Before/after proof for the extremity stylisation:
#
#   <PREFIX>-manos-pies.png   2x2 panel, hands on top, feet below,
#                             MakeHuman's literal anatomy on the left and the
#                             stylised mannequin on the right
#
# Both columns are rendered from cameras derived from the rig, so the framing is
# identical and the only variable is the mesh.
#
#   BLEND_PREV=assets/3d/jcv_mannequin_v2.blend \
#   BLEND=assets/3d/jcv_mannequin_v3.blend \
#   PREFIX=3d-v3 scripts/blender/make_extremity_demo.sh
#
# POSE=flex renders the deformation stress test instead of the rest pose.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BLENDER="${BLENDER:-/Applications/Blender.app/Contents/MacOS/Blender}"
FFMPEG="${FFMPEG:-/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg}"
FONT="${FONT:-/System/Library/Fonts/Supplemental/Arial Bold.ttf}"
BLEND="${BLEND:-$ROOT/assets/3d/jcv_mannequin.blend}"
BLEND_PREV="${BLEND_PREV:-$ROOT/assets/3d/jcv_mannequin_v2.blend}"
PREFIX="${PREFIX:-3d-v3}"
POSE="${POSE:-rest}"
OUT="${OUT:-$ROOT/out-3d/demo}"
SAMPLES="${SAMPLES:-128}"
RES="${RES:-900x900}"
export BLENDER_USER_EXTENSIONS="${MPFB_EXT_DIR:-$ROOT/assets/3d/blender-extensions}"

mkdir -p "$OUT/tmp"

shot() { # blend outdir
  "$BLENDER" -b "$1" -P "$ROOT/scripts/blender/render_extremities.py" -- \
    --parts hands,feet --pose "$POSE" --out "$2" --samples "$SAMPLES" --res "$RES"
}

label() { # in out text
  "$FFMPEG" -y -loglevel error -i "$1" -vf \
    "drawtext=fontfile=$FONT:text='$3':fontcolor=0x22d3ee:fontsize=44:x=(w-tw)/2:y=h-92:box=1:boxcolor=0x0a0a0a@0.75:boxborderw=20" \
    "$2"
}

echo "== before =="
shot "$BLEND_PREV" "$OUT/tmp/ext_prev"
echo "== after =="
shot "$BLEND"      "$OUT/tmp/ext_next"

label "$OUT/tmp/ext_prev/hands_$POSE.png" "$OUT/tmp/e_ph.png" "MANOS - ANTES"
label "$OUT/tmp/ext_next/hands_$POSE.png" "$OUT/tmp/e_nh.png" "MANOS - DESPUES"
label "$OUT/tmp/ext_prev/feet_$POSE.png"  "$OUT/tmp/e_pf.png" "PIES - ANTES"
label "$OUT/tmp/ext_next/feet_$POSE.png"  "$OUT/tmp/e_nf.png" "PIES - DESPUES"

"$FFMPEG" -y -loglevel error \
  -i "$OUT/tmp/e_ph.png" -i "$OUT/tmp/e_nh.png" \
  -i "$OUT/tmp/e_pf.png" -i "$OUT/tmp/e_nf.png" \
  -filter_complex "[0][1]hstack=inputs=2[t];[2][3]hstack=inputs=2[b];[t][b]vstack=inputs=2" \
  "$OUT/$PREFIX-manos-pies.png"

echo "done -> $OUT/$PREFIX-manos-pies.png"
ls -lh "$OUT/$PREFIX-manos-pies.png"
