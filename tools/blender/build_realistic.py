"""Editable, physically rendered reconstruction traced against Matterpak k4yeqikRRkV.
Units: meters. Furnishings are rebuilt approximations; scan remains the reference.
Run Blender --background --python this_file.py [-- --preview].
"""
import bpy, math, random, json, sys
from pathlib import Path
from mathutils import Vector
import os
P=Path(os.environ.get('SUPRANU_SOURCE_DIR', str(Path(__file__).resolve().parents[3]/'SuPranu')))
OUT=P/'renders_blender';OUT.mkdir(exist_ok=True)
EXP=P/'export_ue5';EXP.mkdir(exist_ok=True)
preview='--preview' in sys.argv
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
for c in list(bpy.data.collections):
 if c.name!='Collection':bpy.data.collections.remove(c)
S=bpy.context.scene; rng=random.Random(41); current=None
def material(name,color,rough=.5,noise=0,metal=0):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
 n=m.node_tree.nodes;p=n.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal
 if noise:
  t=n.new('ShaderNodeTexNoise');t.inputs['Scale'].default_value=90;t.inputs['Detail'].default_value=3
  b=n.new('ShaderNodeBump');b.inputs['Strength'].default_value=.24;b.inputs['Distance'].default_value=noise
  m.node_tree.links.new(t.outputs['Fac'],b.inputs['Height']);m.node_tree.links.new(b.outputs['Normal'],p.inputs['Normal'])
 return m
plaster=material('Warm lime plaster',(.72,.69,.62),.88,.008)
cut=material('Wall cut limestone',(.50,.48,.43),.8,.003)
white=material('Porcelain',(.86,.86,.81),.22)
oak=material('Natural oak',(.34,.19,.085),.39,.005)
oaklight=material('Oak countertop',(.56,.39,.21),.4,.003)
black=material('Graphite metal',(.025,.031,.035),.3,0,.65)
chrome=material('Brushed steel',(.45,.48,.49),.22,0,.85)
fabric=material('Natural woven linen',(.62,.54,.40),.92,.015)
ivory=material('Ivory bedding',(.78,.74,.66),.96,.013)
blue=material('Blue woven bedding',(.08,.25,.40),.97,.012)
terracotta=material('Terracotta',(.46,.225,.13),.8,.008)
stone=material('Concrete terrace',(.48,.47,.42),.86,.008)
dark=material('Shadow joint',(.17,.17,.16),.95)
glass=material('Smoked glass',(.055,.09,.1),.12,0,.4)
tiles=[material('Limestone plank %02d'%i,(.52+i*.011,.50+i*.011,.44+i*.011),.65,.003) for i in range(9)]
# Directional wood grain and textile microstructure are shader geometry, not AI imagery.
for mat in [oak,oaklight]:
 n=mat.node_tree.nodes;l=mat.node_tree.links;p=n.get('Principled BSDF')
 co=n.new('ShaderNodeTexCoord');scale=n.new('ShaderNodeVectorMath');scale.operation='MULTIPLY';scale.inputs[1].default_value=(4,140,9);l.new(co.outputs['Generated'],scale.inputs[0])
 noise=n.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=2.5;noise.inputs['Detail'].default_value=3;l.new(scale.outputs[0],noise.inputs['Vector'])
 ramp=n.new('ShaderNodeValToRGB');base=mat.diffuse_color[:3]
 ramp.color_ramp.elements[0].color=(*[v*.48 for v in base],1);ramp.color_ramp.elements[1].color=(*[v*1.1 for v in base],1)
 l.new(noise.outputs['Fac'],ramp.inputs[0]);l.new(ramp.outputs[0],p.inputs['Base Color'])
def link(o):
 for c in list(o.users_collection):c.objects.unlink(o)
 current.objects.link(o);return o
def box(name,loc,size,mat,bevel=.015):
 sx,sy,sz=[v/2 for v in size]
 verts=[(-sx,-sy,-sz),(-sx,-sy,sz),(-sx,sy,-sz),(-sx,sy,sz),(sx,-sy,-sz),(sx,-sy,sz),(sx,sy,-sz),(sx,sy,sz)]
 me=bpy.data.meshes.new(name);me.from_pydata(verts,[],[(0,4,6,2),(1,3,7,5),(0,1,5,4),(2,6,7,3),(0,2,3,1),(4,5,7,6)]);me.update()
 o=bpy.data.objects.new(name,me);current.objects.link(o);o.location=loc;o.data.materials.append(mat)
 if bevel:
  mod=o.modifiers.new('Soft manufactured edges','BEVEL');mod.width=bevel;mod.segments=3
  mod=o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
 return o
def cylinder(name,loc,r,depth,mat,vertices=32):
 bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=r,depth=depth,location=loc);o=link(bpy.context.object);o.name=name;o.data.materials.append(mat)
 b=o.modifiers.new('Round edge','BEVEL');b.width=.008;b.segments=2
 for f in o.data.polygons:f.use_smooth=True
 return o
def ball(name,loc,size,mat):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=12,location=loc);o=link(bpy.context.object);o.name=name;o.scale=size;o.data.materials.append(mat)
 for f in o.data.polygons:f.use_smooth=True
 return o
def wall(name,x0,y0,x1,y1,h=1.15):
 dx,dy=x1-x0,y1-y0;length=math.hypot(dx,dy)
 o=box(name,((x0+x1)/2,(y0+y1)/2,h/2),(length,.17,h),plaster,.012);o.rotation_euler.z=math.atan2(dy,dx)
 cap=box(name+' cut',((x0+x1)/2,(y0+y1)/2,h+.008),(length,.178,.025),cut,.008);cap.rotation_euler.z=o.rotation_euler.z
 # skirting follows real wall geometry.
 for side in [-1,1]:
  nx,ny=-dy/length*.091*side,dx/length*.091*side
  p=box(name+' skirting',((x0+x1)/2+nx,(y0+y1)/2+ny,.055),(length,.022,.11),white,.004);p.rotation_euler.z=o.rotation_euler.z
def floor(x0,y0,x1,y1,clay=False):
 box('Floor substrate',((x0+x1)/2,(y0+y1)/2,-.12),(x1-x0,y1-y0,.22),dark,.02)
 stepY=.34 if clay else .23;stepX=.34 if clay else 1.05
 y=y0;row=0
 while y<y1-.005:
  x=x0;offset=.5*stepX if row%2 else 0
  while x<x1-.005:
   length=min(stepX-offset,x1-x);width=min(stepY,y1-y)
   box('Terracotta tile' if clay else 'Limestone plank',(x+length/2,y+width/2,.003),(max(.005,length-.005),max(.005,width-.005),.018),terracotta if clay else rng.choice(tiles),.002)
   x+=length;offset=0
  y+=stepY;row+=1
def lamp(name,loc,power=30,color=(1,.69,.37),size=.55):
 bpy.ops.object.light_add(type='AREA',location=loc);o=link(bpy.context.object);o.name=name;o.data.energy=power;o.data.color=color;o.data.shape='DISK';o.data.size=size
 return o
def basin(name,x,y,z,w,l,depth,mat=white):
 verts=[];faces=[];N=64
 # Rounded rectangular vessel: rim down to the bowl, closed underside.
 for rx,ry,zz in [(w/2,l/2,z-.04),(w/2,l/2,z),(.44*w,.42*l,z+.008),(.37*w,.34*l,z-depth),(.25*w,.20*l,z-depth-.015)]:
  for i in range(N):
   a=i*math.tau/N;c=math.cos(a);d=math.sin(a)
   verts.append((x+rx*math.copysign(abs(c)**.65,c),y+ry*math.copysign(abs(d)**.65,d),zz))
 for ring in range(4):
  for i in range(N):j=(i+1)%N;faces.append((ring*N+i,ring*N+j,(ring+1)*N+j,(ring+1)*N+i))
 faces.append(tuple(range(4*N,5*N)))
 me=bpy.data.meshes.new(name);me.from_pydata(verts,[],faces);me.update();o=bpy.data.objects.new(name,me);current.objects.link(o);me.materials.append(mat)
 for f in me.polygons:f.use_smooth=True
 cylinder('Chrome drain',(x,y,z-depth+.001),.022,.005,chrome,24)
 return o

def sink(x,y,z=.83):
 box('Vanity',(x,y,z/2),(.68,.5,z-.04),oaklight)
 basin('Porcelain basin',x,y,z+.10,.7,.53,.07)
 cylinder('Tap',(x,y+.19,z+.13),.018,.24,chrome)
 box('Tap spout',(x,y+.12,z+.24),(.035,.18,.035),chrome,.012)
def toilet(x,y):
 ball('WC pedestal',(x,y,.22),(.19,.24,.24),white)
 ball('WC bowl',(x,y-.10,.43),(.22,.29,.10),white)
 ball('WC seat',(x,y-.10,.505),(.195,.255,.018),ivory)
 box('WC cistern',(x,y+.18,.61),(.42,.18,.45),white,.06)
def chair(x,y,angle=0):
 start=set(current.objects)
 box('Chair seat',(x,y,.46),(.43,.43,.085),oak,.055)
 box('Chair upholstered pad',(x,y,.51),(.38,.37,.045),fabric,.04)
 for dx in [-.16,.16]:
  for dy in [-.16,.16]:box('Chair leg',(x+dx,y+dy,.235),(.045,.045,.45),oak,.009)
 box('Chair back',(x,y+.19,.76),(.43,.07,.44),oak,.065)
 for o in set(current.objects)-start:
  d=o.location-Vector((x,y,0));o.location.x=x+d.x*math.cos(angle)-d.y*math.sin(angle);o.location.y=y+d.x*math.sin(angle)+d.y*math.cos(angle);o.rotation_euler.z+=angle
def bed(name,x,y,w=1.6,l=2,mat=ivory,rotate=False):
 start=set(current.objects)
 box(name+' base',(x,y,.22),(w,l,.34),oak,.06)
 box(name+' mattress',(x,y,.46),(w-.04,l-.03,.25),ivory,.12)
 duvet=box(name+' duvet',(x,y-.13,.61),(w+.035,l-.26,.12),mat,.11)
 # Physical small scale fabric relief; no painted scan tears.
 sub=duvet.modifiers.new('Bedding surface','SUBSURF');sub.levels=3;sub.render_levels=3
 texture=bpy.data.textures.get('Woven folds') or bpy.data.textures.new('Woven folds',type='CLOUDS');texture.noise_scale=.18
 disp=duvet.modifiers.new('Soft textile folds','DISPLACE');disp.texture=texture;disp.strength=.055;disp.texture_coords='GLOBAL'
 box(name+' headboard',(x,y+l/2,.52),(w+.07,.10,.95),fabric,.06)
 for dx in [-w*.24,w*.24] if w>1.2 else [0]:
  pillow=box(name+' pillow',(x+dx,y+l*.31,.68),(w*.43,.40,.15),ivory,.12);pillow.rotation_euler.z=rng.uniform(-.07,.07)
 if rotate:
  for o in set(current.objects)-start:
   d=o.location-Vector((x,y,0));o.location.x=x-d.y;o.location.y=y+d.x;o.rotation_euler.z+=math.pi/2
def wardrobe(x,y,w=1.3,d=.56,h=1.25):
 box('Wardrobe carcass',(x,y,h/2),(w,d,h),ivory,.015)
 for dx in [-w/4,w/4]:
  box('Wardrobe door',(x+dx,y-d/2-.015,h/2),(w/2-.012,.035,h-.025),plaster,.009)
  cylinder('Wardrobe handle',(x+dx+(.1 if dx<0 else -.1),y-d/2-.05,.75),.009,.21,chrome,16)
def staircase(x=4.85,y=-3.9):
 # Exterior stair rises towards the landing at y=0.55.
 for i in range(16):box('Exterior stair tread',(x,y+i*.26,-2.90+i*.181),(1.0,.265,.18),stone,.008)
 box('Exterior landing',(x,.5,-.09),(1.1,1.05,.18),stone,.015)
 for side in [-.51,.51]:
  for i in range(0,17,2):cylinder('Stair baluster',(x+side,y+i*.26,-2.4+i*.181),.018,1,black,12)
  a=Vector((x+side,y,-1.92));b=Vector((x+side,y+4.16,.98));o=cylinder('Stair handrail',(a+b)/2,.025,(b-a).length,black,16);o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler()
def perimeter(front):
 wall('Back exterior',-2.8,3.85,4.3,3.85,1.25)
 wall('Left exterior',-2.8,front,-2.8,3.85,1.05)
 # Two window openings in the back, represented by framed glazing at cut height.
 for x in [-1.1,3.0]:
  box('Window reveal',(x,3.745,.99),(1.05,.05,.43),dark,.003)
  box('Window glass',(x,3.71,1.0),(.95,.015,.35),glass,.001)
  for dx in [-.50,0,.5]:box('Window mullion',(x+dx,3.68,1.0),(.035,.04,.43),white,.002)
def rdc():
 floor(-2.8,-1.3,4.3,3.85);floor(-2.8,-3.2,4.3,-1.3,True)
 box('Terrace slab',(.75,-.7,-.22),(9.7,10.4,.22),stone,.04)
 perimeter(-1.3)
 wall('Right exterior',4.3,-1.3,4.3,3.85,.8)
 wall('Front wall left',-2.8,-1.3,2.55,-1.3,.72);wall('Front wall right',3.45,-1.3,4.3,-1.3,.72)
 wall('Bathroom screen',-2.7,1.65,-.35,1.65,.95)
 wall('Bathroom front partition',-1.05,-1.2,-1.05,.05,.85)
 wall('Veranda front',-2.8,-3.2,.85,-3.2,.58);wall('Veranda side',-2.8,-3.2,-2.8,-1.3,.8)
 # Existing L-shaped kitchen.
 for x in [-1.75,-1.1,-.45,.2]:
  box('Kitchen base',(x,3.35,.44),(.63,.62,.88),plaster)
  box('Kitchen handle',(x,3.025,.69),(.28,.024,.018),black,.006)
 box('Kitchen counter',(-.78,3.35,.91),(2.65,.68,.055),stone,.016)
 box('Kitchen peninsula',(.45,2.65,.45),(.62,1.75,.9),plaster)
 box('Peninsula stone top',(.45,2.64,.94),(.7,1.83,.07),stone)
 box('Cooktop',(-1.05,3.34,.95),(.55,.47,.025),glass,.01)
 for dx in [-.14,.14]:
  for dy in [-.12,.12]:cylinder('Burner',(-1.05+dx,3.34+dy,.975),.075,.015,black,24)
 basin('Kitchen steel basin',-.38,3.37,1.01,.47,.40,.055,chrome);cylinder('Kitchen tap',(-.38,3.59,1.08),.018,.25,chrome)
 box('Fridge',(-.45,1.2,.92),(.66,.68,1.84),chrome,.04)
 box('Fridge seam',(-.45,.85,1.25),(.64,.015,.008),black,.001)
 box('Fridge handle',(-.70,.83,1.03),(.025,.025,.40),black,.008)
 # The table long axis is north/south in the scan.
 box('Dining table',(1.98,1.15,.77),(.93,1.48,.065),oaklight,.06)
 for x in [1.62,2.34]:
  for y in [.56,1.74]:box('Table leg',(x,y,.38),(.07,.07,.75),oak,.012)
 chair(1.98,2.15);chair(1.98,.17,math.pi);chair(1.25,1.15,math.pi/2);chair(2.72,1.15,-math.pi/2)
 # Sofa against east wall, facing the dining room.
 box('Sofa plinth',(3.78,1.16,.17),(.88,2.18,.22),oak,.05)
 box('Sofa back',(4.08,1.16,.67),(.24,2.18,.94),fabric,.12)
 for y in [.38,1.16,1.94]:
  box('Sofa cushion',(3.67,y,.43),(.65,.71,.28),fabric,.11)
  p=box('Sofa back cushion',(3.94,y,.78),(.20,.68,.55),ivory,.1);p.rotation_euler.y=-.18
 for y in [0,2.32]:box('Sofa arm',(3.74,y,.56),(.90,.18,.60),fabric,.07)
 box('TV console',(2.30,3.43,.30),(.9,.44,.60),oak)
 box('TV screen',(2.3,3.44,.83),(.82,.055,.49),black,.02)
 box('Fireplace hearth',(3.63,3.32,.12),(.95,.82,.24),stone,.02)
 wall('Fireplace back',3.25,3.72,4.15,3.72,.96)
 box('Fireplace interior',(3.65,3.53,.4),(.62,.25,.45),black,.01)
 sink(-2.20,1.08);toilet(-2.32,-.20)
 box('Shower tray',(-2.2,-.85,.10),(.95,.77,.14),white,.06)
 sink(-1.75,-1.75)
 box('Washing machine',(-.98,-1.72,.43),(.62,.62,.86),white,.025)
 o=cylinder('Washer door',(-.98,-2.045,.43),.22,.04,black);o.rotation_euler.x=math.pi/2
 o=cylinder('Washer glass',(-.98,-2.07,.43),.17,.025,glass);o.rotation_euler.x=math.pi/2
 for x in [-1.5,-.6,.3]:chair(x,-3.55,math.pi)
 for loc in [(-.6,3.1,2.0),(1.9,1.1,2.6),(-2,.7,1.8),(-1,-2,1.9)]:lamp('Warm interior',loc,35)
 # Short lower-flight representation of the source stair.
 for i in range(6):box('Ground stair',(3.72,-3.85+i*.24,.08+i*.17),(1.0,.25,.16),stone)
def upper():
 floor(-2.8,-3.2,4.3,3.85);perimeter(-3.2)
 wall('East back wall',4.3,1.1,4.3,3.85,1.05);wall('East front wall',4.3,-3.2,4.3,-.05,.75)
 wall('Front exterior',-2.8,-3.2,4.3,-3.2,.65)
 # Room divisions traced from upper-level cutaway. Doorways stay open.
 wall('Northwest room front',-2.7,.85,-.35,.85,.9)
 wall('Central bedroom partition',.5,1.15,.5,3.75,1.1)
 wall('Northeast room front',2.92,.85,4.22,.85,.9)
 wall('Northeast central partition',1.85,1.2,1.85,3.75,1.1)
 wall('Nursery north',-2.7,-.3,-1.1,-.3,.8)
 wall('Nursery east',-.55,-3.1,-.55,-.42,.9)
 wall('Bathroom east',1.10,-3.1,1.10,-.35,.9)
 wall('South bedroom north',.50,-.3,3.05,-.3,.9)
 bed('Northwest double bed',-1.57,2.27,1.65,1.95,ivory,True)
 bed('Northeast double bed',3.05,1.92,1.65,1.95,ivory,True)
 bed('South blue double bed',2.35,-1.95,1.65,1.95,blue,True)
 # Fine stripe bands follow the linen shader rather than floating above the bedding.
 n=blue.node_tree.nodes;l=blue.node_tree.links;p=n.get('Principled BSDF');wave=n.new('ShaderNodeTexWave');wave.bands_direction='Y';wave.inputs['Scale'].default_value=7;wave.inputs['Distortion'].default_value=2;wave.inputs['Detail Scale'].default_value=1.5
 ramp=n.new('ShaderNodeValToRGB');ramp.color_ramp.elements[0].position=.38;ramp.color_ramp.elements[0].color=(.025,.12,.24,1);ramp.color_ramp.elements[1].position=.65;ramp.color_ramp.elements[1].color=(.35,.51,.61,1);l.new(wave.outputs['Color'],ramp.inputs[0]);l.new(ramp.outputs[0],p.inputs['Base Color'])
 for x in [-2.22,-.98]:
  bed('Child cot',x,-1.28,.68,1.24,terracotta if x<-2 else ivory)
  for dx in [-.36,.36]:
   for i in range(10):box('Cot spindle',(x+dx,-1.82+i*.12,.70),(.022,.025,.66),white,.005)
   box('Cot rail',(x+dx,-1.28,1.03),(.045,1.3,.05),white,.012)
 wardrobe(1.15,2.6,1.1,.6,1.35);wardrobe(1.15,1.60,1.1,.6,1.35)
 wardrobe(3.92,-1.95,.42,1.65,1.25)
 sink(.73,-.84);toilet(.75,-2.58)
 box('Bathtub plinth',(-.12,-2.1,.10),(.65,1.65,.20),white,.10)
 basin('Recessed bathtub',-.12,-2.1,.58,.69,1.69,.30)
 for x,y in [(-2.3,3.32),(3.6,3.28),(1.55,-2.8)]:
  box('Bedside table',(x,y,.27),(.42,.4,.54),oak,.015);cylinder('Bedside lamp stem',(x,y,.64),.018,.20,chrome);cylinder('Bedside linen lampshade',(x,y,.82),.13,.20,ivory)
  lamp('Bedside pool of light',(x,y,1.0),7,size=.25)
 staircase()
 for loc in [(-1.5,2,2.8),(3,2,2.8),(2.4,-1.9,2.8),(-1.6,-1.3,2.5),(.1,-1.5,2.4)]:lamp('Soft room lighting',loc,22)

levels={}
for name,builder in [('RDC',rdc),('Etage',upper)]:
 current=bpy.data.collections.new(name);S.collection.children.link(current);levels[name]=current;builder()
# A neutral studio makes the cutaway legible on the app's dark background.
current=bpy.data.collections.new('Studio');S.collection.children.link(current)
back=material('Midnight backdrop',(.025,.035,.055),.9)
box('Studio ground',(0,0,-3.6),(200,200,.1),back,0)
S.world.use_nodes=True;S.world.node_tree.nodes['Background'].inputs[0].default_value=(.68,.78,1,1);S.world.node_tree.nodes['Background'].inputs[1].default_value=.18
for name,loc,power,size,color in [('Large warm key',(-3,-4,12),1050,7,(1,.85,.65)),('Cool fill',(6,3,9),480,7,(.70,.82,1)),('Soft rim',(-6,6,8),850,6,(1,.94,.83))]:
 o=lamp(name,loc,power,color,size);o.rotation_euler=(Vector((.5,.2,0))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add();cam=link(bpy.context.object);cam.name='Architectural camera';S.camera=cam;cam.data.type='ORTHO';cam.data.lens=55
S.render.engine='CYCLES';S.cycles.samples=24 if preview else 160;S.cycles.use_denoising=True;S.cycles.use_adaptive_sampling=True;S.cycles.adaptive_threshold=.025;S.cycles.max_bounces=8
prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='OPTIX';prefs.get_devices()
gpu=False
for d in prefs.devices:d.use=d.type!='CPU';gpu=gpu or d.use
if gpu:S.cycles.device='GPU'
S.view_settings.view_transform='AgX';S.view_settings.look='AgX - Medium High Contrast';S.view_settings.exposure=-.05
S.render.resolution_x=1400 if preview else 2800;S.render.resolution_y=1400 if preview else 2800;S.render.resolution_percentage=100;S.render.image_settings.file_format='PNG'
manifest={'units':'meters','source':'Matterpak k4yeqikRRkV','reconstruction':'Measured footprint and scan-derived layout; rebuilt furniture and materials are approximate. Upper floor is the second scanned level, around z=3m. Render collections each use floor z=0.','exports':[]}
for name,col in levels.items():
 for key,c in levels.items():c.hide_render=key!=name;c.hide_viewport=key!=name
 target=Vector((.7,-.1,0));cam.location=target+Vector((8,-11,18));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=16.6 if name=='RDC' else 13.7
 S.render.filepath=str(OUT/(name+('_preview' if preview else '')+'.png'));bpy.ops.render.render(write_still=True)
 if not preview:
  # Join evaluated copies for portable FBX while retaining editable originals.
  for o in bpy.context.selected_objects:o.select_set(False)
  deps=bpy.context.evaluated_depsgraph_get();parts=[]
  for o in list(col.objects):
   if o.type!='MESH':continue
   me=bpy.data.meshes.new_from_object(o.evaluated_get(deps),depsgraph=deps);ob=bpy.data.objects.new('export_'+o.name,me);S.collection.objects.link(ob);ob.matrix_world=o.matrix_world;parts.append(ob);ob.select_set(True)
  bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.join();joined=bpy.context.object;joined.name='SuPranu_'+name
  # Non-degenerate cubic UVs on all procedural geometry for UE tangent generation.
  for old_uv in list(joined.data.uv_layers):joined.data.uv_layers.remove(old_uv)
  uv=joined.data.uv_layers.new(name='UVMap_UE')
  for poly in joined.data.polygons:
   axis=max(range(3),key=lambda i:abs(poly.normal[i]));axes=[i for i in range(3) if i!=axis]
   for idx in poly.loop_indices:
    v=joined.data.vertices[joined.data.loops[idx].vertex_index].co;uv.data[idx].uv=(v[axes[0]],v[axes[1]])
  filepath=str(EXP/(joined.name+'.fbx'));bpy.ops.export_scene.fbx(filepath=filepath,use_selection=True,object_types={'MESH'},axis_forward='-Y',axis_up='Z',apply_unit_scale=True,bake_anim=False,mesh_smooth_type='FACE')
  mats=[]
  for m in joined.data.materials:
   p=m.node_tree.nodes.get('Principled BSDF');mats.append({'name':m.name,'color':list(m.diffuse_color[:3]),'roughness':p.inputs['Roughness'].default_value,'metallic':p.inputs['Metallic'].default_value})
  manifest['exports'].append({'name':joined.name,'file':filepath,'materials':mats})
  bpy.data.objects.remove(joined,do_unlink=True)
for key,c in levels.items():c.hide_render=key!='Etage';c.hide_viewport=key!='Etage'
(EXP/'manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
bpy.ops.wm.save_as_mainfile(filepath=str(P/('SuPranu_modele_preview.blend' if preview else 'SuPranu_architecture.blend')))
print('SUPRANU_DONE',flush=True)
