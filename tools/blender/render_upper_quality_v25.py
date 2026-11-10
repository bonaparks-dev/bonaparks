"""Quality-only rerender: retain every validated v24 vertex and the same camera.
Export an occlusion-correct TV mask from the native scene as well.
"""
import bpy,json,hashlib
from pathlib import Path
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view
import os
P=Path(os.environ.get('SUPRANU_SOURCE_DIR', str(Path(__file__).resolve().parents[3]/'SuPranu')))
bpy.ops.wm.open_mainfile(filepath=str(P/'SuPranu_Etage_Natif_v24.blend'))
s=bpy.context.scene
def digest():return hashlib.sha256(repr([(o.name,list(o.matrix_world),[tuple(v.co) for v in o.data.vertices]) for o in s.objects if o.type=='MESH']).encode()).hexdigest()
before=digest()
prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='OPTIX';prefs.get_devices()
for d in prefs.devices:d.use=d.type!='CPU'
s.cycles.device='GPU';s.cycles.samples=320;s.cycles.use_denoising=True;s.cycles.use_adaptive_sampling=True;s.cycles.adaptive_threshold=.006
s.render.resolution_x=s.render.resolution_y=4096;s.render.resolution_percentage=100;s.render.image_settings.file_format='PNG';s.render.image_settings.color_mode='RGBA';s.render.film_transparent=True
s.render.filepath=str(P/'etage_quality_v25.png');bpy.ops.render.render(write_still=True)
assert before==digest(),'Quality pass must not change validated geometry'
def project(p):
 v=world_to_camera_view(s,s.camera,Vector(p));return [round(v.x*1000,4),round((1-v.y)*1000,4)]
face=[project(p) for p in [(-2.727,-2.681,1.08),(-1.953,-2.681,1.08),(-1.953,-2.681,.64),(-2.727,-2.681,.64)]]
(P/'upper_quality_v25.json').write_text(json.dumps({'geometryHash':before,'unchanged':True,'tv':face,'resolution':[4096,4096]},indent=2))
def emission(name,color):
 m=bpy.data.materials.new(name);m.use_nodes=True;m.node_tree.nodes.clear();e=m.node_tree.nodes.new('ShaderNodeEmission');e.inputs['Color'].default_value=(*color,1);out=m.node_tree.nodes.new('ShaderNodeOutputMaterial');m.node_tree.links.new(e.outputs[0],out.inputs[0]);return m
black=emission('TV visibility occluder',(0,0,0));white=emission('TV visibility screen',(1,1,1))
for o in s.objects:
 if o.type=='MESH':o.data.materials.clear();o.data.materials.append(white if o.name=='Ecran television enfants' else black)
 if o.type=='LIGHT':o.hide_render=True
s.world.use_nodes=True
for n in s.world.node_tree.nodes:
 if n.type=='BACKGROUND':n.inputs[0].default_value=(0,0,0,1);n.inputs[1].default_value=0
s.view_settings.view_transform='Standard';s.view_settings.look='None';s.view_settings.exposure=0;s.render.film_transparent=False;s.cycles.samples=24;s.render.resolution_x=s.render.resolution_y=2048
s.render.filepath=str(P/'upper_tv_visibility_v25.png');bpy.ops.render.render(write_still=True)
print('UPPER_QUALITY_VERIFIED',flush=True)
