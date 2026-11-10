import bpy,json,math,os
from pathlib import Path
from bpy_extras.object_utils import world_to_camera_view
p=Path(os.environ.get('SUPRANU_SOURCE_DIR',Path(__file__).resolve().parents[3]/'SuPranu'))
bpy.ops.wm.open_mainfile(filepath=str(p/'SuPranu_Property_Native_v25.blend'))
s=bpy.context.scene
bpy.context.view_layer.update()
def proj(v):
 q=world_to_camera_view(s,s.camera,v);return [round(q.x*1000,6),round((1-q.y)*1000,6)]
pool=bpy.data.objects['Physical water surface'];spa=bpy.data.objects['Spa water']
pv=[proj(pool.matrix_world@v.co) for v in pool.data.vertices]
sv=sorted([v for v in spa.data.vertices if v.co.z>0],key=lambda v:math.atan2(v.co.y,v.co.x))
r={'pool':pv,'spa':[proj(spa.matrix_world@v.co) for v in sv]}
(p/'water_projection_v25.json').write_text(json.dumps(r,indent=2));print('Water silhouettes exported from rendered mesh')
