"""Render the same native house in overview and close-up; export one camera basis.
Furniture and landscaping remain a reconstruction, not a surveyed as-built model.
"""
import bpy,json,sys
from pathlib import Path
from mathutils import Vector,Matrix
from bpy_extras.object_utils import world_to_camera_view
import os
P=Path(os.environ.get('SUPRANU_SOURCE_DIR', str(Path(__file__).resolve().parents[3]/'SuPranu')))
bpy.ops.wm.open_mainfile(filepath=str(P/'SuPranu_Property_Native_v25.blend'))
s=bpy.context.scene
overviewMatrix=s.camera.matrix_world.copy();overviewScale=s.camera.data.ortho_scale
for c in bpy.data.collections:
 if c.name not in ['Collection','Matterpak house · ground floor','Architectural daylight']:c.hide_render=True
def H(p):return [12.6+p[0]*1.05,11.56+p[1]*1.05,p[2]*1.05+.12]
target=Vector(H((.8,-.6,.2)));s.camera.location=target+Vector((0,-40,62));s.camera.rotation_euler=(target-s.camera.location).to_track_quat('-Z','Y').to_euler();s.camera.data.ortho_scale=13.2
s.render.resolution_x=s.render.resolution_y=4096;s.render.resolution_percentage=100;s.cycles.samples=256
prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='OPTIX';prefs.get_devices()
for d in prefs.devices:d.use=d.type!='CPU'
s.cycles.device='GPU';s.render.filepath=str(P/'ground_quality_v25.png');bpy.context.view_layer.update()
def project(p):
 q=world_to_camera_view(s,s.camera,Vector(p));return [round(q.x*1000,6),round((1-q.y)*1000,6)]
def rect(x0,y0,x1,y1,z=.03):return [project(H(p)) for p in [(x0,y0,z),(x1,y0,z),(x1,y1,z),(x0,y1,z)]]
old=Matrix([[511,249,1],[360,330,1],[410,570,1]]);dest=[project(H(p)) for p in [(-.3,2.8,0),(-2,.2,0),(.4,-4.4,0)]]
ax=old.inverted()@Vector([p[0] for p in dest]);ay=old.inverted()@Vector([p[1] for p in dest]);matrix=[ax[0],ay[0],ax[1],ay[1],ax[2],ay[2]]
report={'projection':matrix,'size':[4096,4096],'tv':{'living':[project(H(p)) for p in [(1.92,3.408,1.06),(2.68,3.408,1.06),(2.68,3.408,.60),(1.92,3.408,.60)]]},'rooms':{'kitchen':rect(-2.65,1.8,.8,3.7),'living':rect(-.9,-1.1,4.1,1.7),'bath-down':rect(-2.65,-1.1,-1.1,1.6),'patio':rect(-2.6,-5.3,4.1,-1.4),'stairs':[project(H(p)) for p in [(4.38,-4.8,.02),(5.52,-4.8,.02),(5.52,.9,3.1),(4.38,.9,3.1)]]}}
def details():
 return {'entry':{'p':project(H((2.55,-1.3,0))),'q':project(H((3.45,-1.3,0))),'open':project(H((2.55,-2.2,0))),'height':project(H((2.55,-1.3,0)))[1]-project(H((2.55,-1.3,1.7)))[1]},'speakers':[project(H(p)) for p in [(-2.5,-1.6,.15),(4.0,-1.6,.15),(-2.5,-5.2,.15),(4.,-5.2,.15)]],'fixtures':{k:[project(H(p)) for p in v] for k,v in {'kitchen':[(-1.8,3.55,1.15),(.2,3.55,1.15)],'living':[(4.,2.8,.7),(4.,-.9,.7)],'bath-down':[(-2.5,1.4,.9)],'patio':[(-2.5,-1.6,.7),(3.8,-5.0,.7)],'stairs':[(5.4,.3,3.2)]}.items()}}
report.update(details())
rdcMatrix=s.camera.matrix_world.copy();rdcScale=s.camera.data.ortho_scale
s.camera.matrix_world=overviewMatrix;s.camera.data.ortho_scale=overviewScale;s.render.resolution_x=4096;s.render.resolution_y=2560;bpy.context.view_layer.update();report['overview']=details()
s.camera.matrix_world=rdcMatrix;s.camera.data.ortho_scale=rdcScale;s.render.resolution_x=s.render.resolution_y=4096;bpy.context.view_layer.update()
(P/'ground_projection_v25.json').write_text(json.dumps(report,indent=2))
if '--no-render' in sys.argv:sys.exit(0)
if '--preview' in sys.argv:
 s.cycles.samples=32;s.render.resolution_x=s.render.resolution_y=1536;s.render.filepath=str(P/'ground_quality_preview_v25.png')
bpy.ops.render.render(write_still=True)
print('GROUND_NATIVE_QUALITY_COMPLETE',flush=True)
