"""Render sign-free wall plates where the right-room signage used to be. Blender 4.5 LTS.

The approved films were rendered with a room name and identity on the right room.
Rather than re-rendering whole films (and drifting from the approved look), this
renders only the region the removed lettering occupied in each frame, from a scene
baked by render.py (personal edition, which no longer creates that lettering).
patch-signage.mjs then grafts these plates into the approved frames.

blender -b --gpu-backend vulkan OUTPUT/representative-LAYOUT.blend -P render-plate.py -- OUTPUT representative-LAYOUT
"""
import bpy, os, sys, json
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

out, key = sys.argv[sys.argv.index('--') + 1:]
out = os.path.abspath(out)
s = bpy.context.scene
cam = s.camera
width, height = s.render.resolution_x, s.render.resolution_y

# Same denoising compositor as render-saved.py, so plates match the delivered films.
s.use_nodes = True
nodes = s.node_tree.nodes
nodes.clear()
layers = nodes.new('CompositorNodeRLayers')
denoise = nodes.new('CompositorNodeDenoise')
composite = nodes.new('CompositorNodeComposite')
s.node_tree.links.new(layers.outputs['Image'], denoise.inputs['Image'])
s.node_tree.links.new(denoise.outputs['Image'], composite.inputs['Image'])
s.render.image_settings.file_format = 'PNG'
s.render.image_settings.color_mode = 'RGB'

# World-space box around the former lettering on the right room's wall (x = 3.5):
# name at z 4.82 (size .34) and identity at z 4.25 (size .62), mounted at y ~1.75.
corners = [Vector((x, 1.74, z)) for x in (3.5 - 1.45, 3.5 + 1.45) for z in (3.85, 5.15)]
margin = 28
regions = {}
for frame in range(s.frame_start, s.frame_end + 1):
    s.frame_set(frame)
    points = [world_to_camera_view(s, cam, corner) for corner in corners]
    if any(point.z <= 0 for point in points):
        continue
    x0 = max(0.0, min(p.x for p in points) - margin / width)
    x1 = min(1.0, max(p.x for p in points) + margin / width)
    y0 = max(0.0, min(p.y for p in points) - margin / height)
    y1 = min(1.0, max(p.y for p in points) + margin / height)
    if x1 - x0 < 4 / width or y1 - y0 < 4 / height:
        continue
    s.render.use_border = True
    s.render.use_crop_to_border = True
    s.render.border_min_x, s.render.border_max_x = x0, x1
    s.render.border_min_y, s.render.border_max_y = y0, y1
    s.render.filepath = os.path.join(out, f'{key}-plate-{frame:04d}.png')
    bpy.ops.render.render(write_still=True)
    # Top-left pixel of the crop in image coordinates; the crop size comes from the PNG.
    regions[frame] = {'left': x0 * width, 'top': (1 - y1) * height}
    print(f'Plate {key} {frame}', flush=True)

with open(os.path.join(out, f'{key}-plates.json'), 'w') as f:
    json.dump({'width': width, 'height': height, 'regions': regions}, f, indent=1)
