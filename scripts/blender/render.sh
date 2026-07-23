#!/usr/bin/env bash
# JCV 24 Fitness - 3D exercise renderer (headless Blender + EEVEE).
#
#   scripts/blender/render.sh build
#       (re)generate assets/3d/jcv_mannequin.blend from MPFB2
#
#   scripts/blender/render.sh render --muscle quads --views front,side --frames 1-48 --out out-3d/run1
#       render the mannequin; every flag is forwarded to render_exercise.py
#
#   scripts/blender/render.sh muscles
#       list the muscle groups baked into the .blend
#
#   scripts/blender/render.sh demo
#       produce the three owner-facing deliverables in out-3d/demo/
#
#   scripts/blender/render.sh atlas
#       produce the "3D atlas" deliverables (region contact sheet + 360
#       turnarounds) in out-3d/atlas-demo/
#
# Env overrides:
#   BLENDER      path to the Blender binary
#   FFMPEG       path to ffmpeg
#   MPFB_EXT_DIR directory used as BLENDER_USER_EXTENSIONS (holds the MPFB2 addon)
#   BLEND        path to the scene .blend
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BLENDER="${BLENDER:-/Applications/Blender.app/Contents/MacOS/Blender}"
FFMPEG="${FFMPEG:-/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg}"
MPFB_EXT_DIR="${MPFB_EXT_DIR:-$ROOT/assets/3d/blender-extensions}"
BLEND="${BLEND:-$ROOT/assets/3d/jcv_mannequin.blend}"

export BLENDER_USER_EXTENSIONS="$MPFB_EXT_DIR"

cmd="${1:-render}"; shift || true

case "$cmd" in
  build)
    "$BLENDER" -b -P "$ROOT/scripts/blender/build_scene.py" -- --out "$BLEND" "$@"
    ;;
  render)
    "$BLENDER" -b "$BLEND" -P "$ROOT/scripts/blender/render_exercise.py" -- "$@"
    ;;
  muscles)
    "$BLENDER" -b "$BLEND" -P "$ROOT/scripts/blender/render_exercise.py" -- --list-muscles
    ;;
  demo)
    "$ROOT/scripts/blender/make_demo.sh" "$@"
    ;;
  atlas)
    "$ROOT/scripts/blender/make_atlas_demo.sh" "$@"
    ;;
  *)
    echo "usage: render.sh {build|render|muscles|demo|atlas} [args...]" >&2
    exit 2
    ;;
esac
