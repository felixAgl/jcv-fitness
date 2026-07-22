"""
Close-up renderer for the mannequin's hands and feet.

Its only job is to make the extremity stylisation *reviewable*: it frames the
hands and the feet from cameras derived from the rig itself, so the exact same
shot can be rendered against two different .blend files and stacked into a
before/after panel.

    blender -b assets/3d/jcv_mannequin.blend -P scripts/blender/render_extremities.py -- \
        --parts hands,feet --pose rest --out out-3d/ext

`--pose flex` curls the fingers and rocks the ankles first, which is the check
that matters: a stylisation that only looks right in the rest pose is useless,
the mesh has to survive armature deformation.
"""

import sys
import os
import argparse
import math

import bpy
from mathutils import Vector, Matrix

BODY = "JCV_Body"
RIG = "JCV_Rig"


def log(msg):
    print(f"[extremities] {msg}", flush=True)


def parse_args(argv):
    argv = argv[argv.index("--") + 1:] if "--" in argv else []
    p = argparse.ArgumentParser()
    p.add_argument("--parts", default="hands,feet")
    p.add_argument("--pose", default="rest", choices=["rest", "flex"])
    p.add_argument("--out", default="out-3d/ext")
    p.add_argument("--samples", type=int, default=64)
    p.add_argument("--res", default="900x900")
    return p.parse_args(argv)


# ------------------------------------------------------------------- posing
def _rotate_world(rig, bone_name, axis, angle):
    pb = rig.pose.bones.get(bone_name)
    if pb is None:
        return
    bpy.context.view_layer.update()
    m = pb.matrix.copy()
    head = m.translation.copy()
    R = Matrix.Rotation(angle, 4, axis)
    pb.matrix = Matrix.Translation(head) @ R @ Matrix.Translation(-head) @ m
    bpy.context.view_layer.update()


def pose_flex(rig):
    """Curl the fingers and rock the ankles: the deformation stress test."""
    for pb in rig.pose.bones:
        pb.rotation_mode = "QUATERNION"
    for side, sign in (("L", 1.0), ("R", -1.0)):
        lateral = Vector((sign, 0, 0))
        # fingers curl around the body-lateral axis
        for f in range(2, 6):
            for seg, ang in ((1, 48), (2, 62), (3, 55)):
                _rotate_world(rig, f"finger{f}-{seg}.{side}",
                              lateral, math.radians(ang))
        for seg, ang in ((1, 26), (2, 30)):
            _rotate_world(rig, f"finger1-{seg}.{side}", lateral,
                          math.radians(ang))
        _rotate_world(rig, f"wrist.{side}", Vector((0, 1, 0)),
                      sign * math.radians(-18))
        # ankle dorsiflexion + toe-off
        _rotate_world(rig, f"foot.{side}", lateral, math.radians(24))
        _rotate_world(rig, f"toe1-1.{side}", lateral, math.radians(-30))
    log("posed: fingers curled, wrists cocked, ankles flexed")


# ------------------------------------------------------------------ framing
def bone_pts(rig, names, which="head"):
    out = []
    for n in names:
        b = rig.data.bones.get(n)
        if b is None:
            continue
        out.append(rig.matrix_world @ (b.head_local if which == "head"
                                       else b.tail_local))
    return out


def evaluated_pts(body, near, radius):
    """World positions of the evaluated (posed) skin within `radius` of any of
    the `near` points -- this is what actually has to be in frame."""
    dg = bpy.context.evaluated_depsgraph_get()
    ev = body.evaluated_get(dg)
    mesh = ev.to_mesh()
    mw = ev.matrix_world
    pts = []
    for v in mesh.vertices:
        p = mw @ v.co
        if any((p - c).length <= radius for c in near):
            pts.append(p)
    ev.to_mesh_clear()
    return pts


def make_camera():
    cam = bpy.data.objects.get("JCV_ExtCam")
    if cam is None:
        data = bpy.data.cameras.new("JCV_ExtCam")
        cam = bpy.data.objects.new("JCV_ExtCam", data)
        bpy.context.collection.objects.link(cam)
    cam.data.lens = 85.0            # long-ish lens: minimal perspective flare
    cam.data.sensor_fit = "VERTICAL"
    cam.data.sensor_height = 36.0
    cam.data.clip_start = 0.005
    return cam


def frame_points(cam, pts, direction, margin=1.6):
    lo = Vector((min(p[i] for p in pts) for i in range(3)))
    hi = Vector((max(p[i] for p in pts) for i in range(3)))
    centre = (lo + hi) * 0.5
    size = hi - lo
    tan_v = math.tan(math.atan(cam.data.sensor_height * 0.5 / cam.data.lens))
    extent = max(size.length * 0.5, 1e-3)
    d = extent * margin / tan_v
    loc = centre + direction.normalized() * d
    cam.location = loc
    cam.rotation_euler = (centre - loc).to_track_quat("-Z", "Y").to_euler()
    return centre


# Framing is derived from BONE positions, never from the mesh. The whole point
# of this script is to compare two different meshes side by side, and a camera
# fitted to the evaluated geometry silently zooms in when the geometry gets
# smaller -- which is exactly what stylising the extremities does. The rig is
# identical across versions, so bones give a genuinely fixed shot.
def view_hands(cam, body, rig):
    """The left hand, seen from outside-front-above -- the angle a reel would
    actually catch it at."""
    tips = bone_pts(rig, [f"finger{f}-3.L" for f in range(2, 6)], "tail")
    wrist = bone_pts(rig, ["wrist.L"], "head")
    frame_points(cam, wrist + tips, Vector((-0.70, -0.66, 0.26)), margin=1.75)


def view_feet(cam, body, rig):
    """Both feet from a low front three-quarter."""
    anchor = (bone_pts(rig, ["foot.L", "foot.R"], "head")
              + bone_pts(rig, ["toe1-1.L", "toe1-1.R"], "tail"))
    frame_points(cam, anchor, Vector((-0.42, -1.0, 0.46)), margin=1.9)


VIEWS = {"hands": view_hands, "feet": view_feet}


# ------------------------------------------------------------------- render
def setup_glow():
    sc = bpy.context.scene
    ng = bpy.data.node_groups.get("JCV_Comp")
    if ng is None:
        # a scene compositing group is NOT auto-fed the render result on 5.x
        ng = bpy.data.node_groups.new("JCV_Comp", "CompositorNodeTree")
        ng.interface.new_socket("Image", in_out="OUTPUT",
                                socket_type="NodeSocketColor")
        rl = ng.nodes.new("CompositorNodeRLayers")
        go = ng.nodes.new("NodeGroupOutput")
        go.location = (600, 0)
        glare = ng.nodes.new("CompositorNodeGlare")
        glare.location = (250, 0)
        glare.inputs["Type"].default_value = "Bloom"
        glare.inputs["Quality"].default_value = "High"
        glare.inputs["Threshold"].default_value = 1.0
        glare.inputs["Strength"].default_value = 0.55
        glare.inputs["Size"].default_value = 8 / 9.0
        ng.links.new(rl.outputs["Image"], glare.inputs["Image"])
        ng.links.new(glare.outputs["Image"], go.inputs[0])
    sc.compositing_node_group = ng
    sc.render.use_compositing = True


def main():
    args = parse_args(sys.argv)
    body = bpy.data.objects.get(BODY)
    rig = bpy.data.objects.get(RIG)
    if body is None or rig is None:
        raise SystemExit("need JCV_Body and JCV_Rig in the .blend")

    if args.pose == "flex":
        pose_flex(rig)
    bpy.context.view_layer.update()

    w, h = (int(x) for x in args.res.lower().split("x"))
    sc = bpy.context.scene
    sc.render.engine = "BLENDER_EEVEE"
    sc.render.resolution_x, sc.render.resolution_y = w, h
    sc.eevee.taa_render_samples = args.samples
    sc.render.image_settings.file_format = "PNG"
    setup_glow()

    cam = make_camera()
    sc.camera = cam
    out_root = os.path.abspath(args.out)
    os.makedirs(out_root, exist_ok=True)

    for part in (p.strip() for p in args.parts.split(",")):
        if part not in VIEWS:
            raise SystemExit(f"unknown part '{part}', have {list(VIEWS)}")
        VIEWS[part](cam, body, rig)
        sc.render.filepath = os.path.join(out_root, f"{part}_{args.pose}.png")
        bpy.ops.render.render(write_still=True)
        log(f"wrote {sc.render.filepath}")


if __name__ == "__main__":
    main()
