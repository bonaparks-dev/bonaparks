"""Native, orthographic property presentation. No raster skew or generative edit.

House: existing Matterpak-derived reconstruction. Rectangular garden composition
and planting are presentation choices previously requested by the owner; they
are not a cadastral survey. All source files remain untouched.
"""
import bpy, math, random, json, sys
from pathlib import Path
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view
import os
P=Path(os.environ.get('SUPRANU_SOURCE_DIR', str(Path(__file__).resolve().parents[3]/'SuPranu')))
ns={'__file__':str(P/'build_realistic.py')}
exec((Path(__file__).resolve().parent/'build_realistic.py').read_text().split('levels={}')[0],ns)
S=bpy.context.scene
mat,box,cyl,ball,basin=[ns[n] for n in ['material','box','cylinder','ball','basin']]
rng=random.Random(2501)
def collection(name):
 c=bpy.data.collections.new(name);S.collection.children.link(c);ns['current']=c;return c
house=collection('Matterpak house · ground floor')
ns['rdc']()
ns['wall']('Bathroom return beside refrigerator',-1.05,.85,-1.05,1.65,1.05)
patio_blue=mat('Patio blue woven resin',(.045,.17,.22),.62,.008)
for o in house.objects:
 if o.name.startswith('Chair') and o.location.y<-3.2:
  o.data.materials.clear();o.data.materials.append(patio_blue)
for o in list(house.objects):
 if o.name.startswith('Ground stair') or o.type=='LIGHT':bpy.data.objects.remove(o,do_unlink=True)
# Build the actual exterior staircase on its own straight axis.
stone=ns['stone'];plaster=ns['plaster'];black=ns['black'];white=ns['white'];oak=ns['oak'];chrome=ns['chrome']
for i in range(17):box('Exterior stair %02d'%i,(4.95,-4.64+i*.265,.09+i*.1765),(1.10,.27,.18),stone,.009)
for i in range(17):box('Stair tread nosing %02d'%i,(4.95,-4.76+i*.265,.185+i*.1765),(1.09,.025,.018),ns['dark'],.003)
box('Upper landing',(4.95,.35,3.0),(1.1,1.1,.18),stone,.012)
for side in [-.60,.60]:
 for i in range(0,17,2):cyl('Stair railing',(4.95+side,-4.64+i*.265,.65+i*.1765),.016,1.1,black,12)
 a=Vector((4.95+side,-4.64,1.22));b=Vector((4.95+side,-.40,4.04));o=cyl('Straight continuous handrail',(a+b)/2,.026,(b-a).length,black,16);o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler()
# Terrace is open in overview; no roof conceals its contents.
for x in [-2.5,.65,3.8]:box('Patio column',(x,-5.1,.62),(.22,.22,1.25),plaster,.01)
box('Patio outdoor table',(.8,-4.2,.66),(1.2,.70,.05),oak,.03)
for x in [.3,1.3]:
 for y in [-4.45,-3.95]:box('Patio table leg',(x,y,.33),(.055,.055,.65),black,.008)
# Recessed cabinet fronts, worktop edge and upholstery seams remain geometry.
for x in [-1.75,-1.1,-.45,.2]:
 box('Kitchen door',(x,3.027,.43),(.605,.028,.80),plaster,.006)
 box('Cabinet pull',(x,2.995,.72),(.24,.02,.018),black,.005)
for y in [.38,1.16,1.94]:
 p=box('Linen pillow',(3.63,y,.64),(.34,.42,.13),ns['ivory'],.06);p.rotation_euler.y=.18
for j in range(3):
 cyl('Dining plate',(1.98, .65+j*.50,.812),.13,.014,white,48)
 cyl('Dining glass',(2.28,.65+j*.50,.87),.035,.12,ns['glass'],24)
cyl('Table vase',(1.99,1.14,.91),.075,.22,ns['terracotta'],32)
# The original terrace slab extends 0.65 m beyond the rear wall. Increase its
# rear apron to the scan's visible continuous concrete walk, without shrinking rooms.
box('Rear concrete passage',(.75,4.35,-.12),(9.7,1.0,.20),stone,.015)
HS=1.05;TX=12.6;TY=11.56
def H(p):return [TX+p[0]*HS,TY+p[1]*HS,p[2]*HS+.12]
for o in house.objects:o.location=H(o.location);o.scale*=HS
land=collection('Rectangular landscape · owner presentation')
grass=mat('Living grass',(.11,.18,.045),.92,.025)
gravel=mat('Entrance limestone gravel',(.39,.37,.31),.91,.045)
earth=mat('Planting soil',(.055,.036,.02),1,.018)
travertine=mat('Honed warm travertine',(.55,.53,.46),.69,.012)
wallmat=mat('Garden mineral plaster',(.56,.57,.53),.90,.008)
leafmats=[mat('Mediterranean leaf %d'%i,(.045+i*.013,.10+i*.023,.022+i*.006),.62) for i in range(5)]
for material,scale,low,high in [(grass,5,(.025,.055,.009,1),(.16,.23,.055,1)),(gravel,75,(.19,.18,.16,1),(.58,.56,.48,1)),(travertine,7,(.40,.39,.34,1),(.66,.64,.57,1))]:
 n=material.node_tree.nodes;l=material.node_tree.links;p=n.get('Principled BSDF');tc=n.new('ShaderNodeTexCoord');noise=n.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=scale;noise.inputs['Detail'].default_value=4;l.new(tc.outputs['Object'],noise.inputs[0]);r=n.new('ShaderNodeValToRGB');r.color_ramp.elements[0].color=low;r.color_ramp.elements[1].color=high;l.new(noise.outputs['Fac'],r.inputs[0]);l.new(r.outputs[0],p.inputs['Base Color'])
box('Property base',(15,10,-.31),(30,20,.45),wallmat,.03)
box('Continuous lawn',(15,10,-.065),(29.5,19.5,.06),grass,.01)
for x in [.12,29.88]:box('Side boundary',(x,10,.20),(.24,20,.65),wallmat,.018)
for y in [.12,19.88]:box('Straight boundary',(15,y,.20),(30,.24,.65),wallmat,.018)
def paved(name,x0,y0,x1,y1,material=travertine,z=.025,tile=1.2):
 box(name+' bed',((x0+x1)/2,(y0+y1)/2,z-.07),(x1-x0,y1-y0,.13),material,.015)
 if tile:
  x=x0
  while x<x1-.01:
   y=y0
   while y<y1-.01:
    w=min(tile,x1-x);h=min(tile,y1-y);box(name+' tile',(x+w/2,y+h/2,z),(w-.005,h-.005,.025),material,.004);y+=h
   x+=w
paved('Vehicle gravel entrance',1.15,7.65,8.75,19.72,gravel,tile=0)
paved('Rear walk',9.0,15.55,18.6,16.55)
paved('East walk',17.1,6.0,18.6,16.55)
paved('Patio apron',9.0,5.85,18.6,8.25)
paved('Pool approach',17.1,4.4,23.4,6.0)
paved('Pool deck',20.4,.45,28.9,5.15)
# Reusable mapping from the old authored interaction coordinates to the site.
def site(x,y,z=0):
 px=x*1.448-305.528;py=y*1.086-4.344;det=1115*667+299*411
 return [30*(667*px+299*py)/det,20-20*(-411*px+1115*py)/det,z]
def mesh(name,verts,faces,material):
 me=bpy.data.meshes.new(name);me.from_pydata(verts,[],faces);me.update();o=bpy.data.objects.new(name,me);ns['current'].objects.link(o);me.materials.append(material);return o
# Garage footprint and a clear approach remain separate from the two lawns.
for x in [1.15,3.25]:box('Garage wall',(x,13.3,.38),(.15,6.4,.8),wallmat,.012)
box('Garage rear',(2.2,16.5,.38),(2.2,.15,.8),wallmat,.012)
paved('Garage floor',1.25,10.1,3.15,16.4,stone,tile=1)
for j in range(4):box('Garage storage',(2.65,10.8+j*1.2,.38),(.68,.8,.75),oak,.01)
# Gate stays a dynamic overlay, so an open gate never leaves a baked closed leaf.
ga,gb=[site(*p) for p in [[236.9,128.9],[309.4,159.3]]]
ga[1]=gb[1]=(ga[1]+gb[1])/2
for x,y,z in [ga,gb]:box('Gate stone pier',(x,y,.62),(.32,.35,1.25),travertine,.018)
box('Gate threshold',((ga[0]+gb[0])/2,(ga[1]+gb[1])/2,.015),(gb[0]-ga[0]+.3,.38,.07),stone,.01)
# Pool outline is kept consistent with the accepted freeform basin and the
# animation footprint. The water is physically shaded, not drawn as white lines.
poolLegacy=[[614,763],[630,751],[749,799],[757,819],[737,876],[720,882],[605,841],[596,819],[584,789],[598,777],[614,779]]
pp=[site(x,y,.075) for x,y in poolLegacy]
cx=sum(p[0] for p in pp)/len(pp);cy=sum(p[1] for p in pp)/len(pp)
def round_outline(points):
 out=[]
 for i,p in enumerate(points):
  a=Vector(points[(i-1)%len(points)]);b=Vector(p);c=Vector(points[(i+1)%len(points)])
  for j in range(8):
   t=j/8;q=(a*.16+b*.84)*(1-t)**2+2*b*t*(1-t)+(b*.84+c*.16)*t*t;out.append(list(q))
 return out
pp=round_outline(pp);N=len(pp)
water=mat('Pool water',(.025,.22,.29),.11)
p=water.node_tree.nodes.get('Principled BSDF');p.inputs['Transmission Weight'].default_value=.02;p.inputs['Metallic'].default_value=.25;p.inputs['IOR'].default_value=1.333
n=water.node_tree.nodes;l=water.node_tree.links;tex=n.new('ShaderNodeTexNoise');tex.inputs['Scale'].default_value=12;tex.inputs['Detail'].default_value=2;b=n.new('ShaderNodeBump');b.inputs['Strength'].default_value=.23;b.inputs['Distance'].default_value=.035;l.new(tex.outputs['Fac'],b.inputs['Height']);l.new(b.outputs[0],p.inputs['Normal'])
co=n.new('ShaderNodeTexCoord');broad=n.new('ShaderNodeTexNoise');broad.inputs['Scale'].default_value=1.4;broad.inputs['Detail'].default_value=3;l.new(co.outputs['Object'],broad.inputs['Vector']);ramp=n.new('ShaderNodeValToRGB');ramp.color_ramp.elements[0].color=(.013,.13,.17,1);ramp.color_ramp.elements[1].color=(.045,.29,.33,1);l.new(broad.outputs['Fac'],ramp.inputs[0]);l.new(ramp.outputs[0],p.inputs['Base Color'])
mesh('Physical water surface',pp,[tuple(range(N))],water)
pooltile=mat('Pool ceramic',(.13,.36,.39),.35,.004)
outer=[]
for x,y,z in pp:
 v=Vector((x-cx,y-cy));v.normalize();outer.append([x+v.x*.24,y+v.y*.24,.10])
mesh('Pool stone coping',outer+[[x,y,.10] for x,y,z in pp],[(i,(i+1)%N,(i+1)%N+N,i+N) for i in range(N)],travertine)
mesh('Pool inner walls',pp+[[x,y,-1.05] for x,y,z in pp],[(i,(i+1)%N,(i+1)%N+N,i+N) for i in range(N)],pooltile)
mesh('Pool ceramic floor',[[x,y,-1.05] for x,y,z in pp],[tuple(range(N))],pooltile)
spa=site(687,746);sx,sy,_=spa
cyl('Spa base',(sx,sy,.12),.78,.25,travertine,8)
basin('Octagonal spa bowl',sx,sy,.37,1.35,1.35,.28,white)
cyl('Spa water',(sx,sy,.32),.56,.025,water,64)
# Side gazebo: open sides, slender timber posts, subtle fabric canopy.
gx,gy,_=site(499,729)
paved('Gazebo pad',gx-1.4,gy-1.25,gx+1.4,gy+1.25)
for x in [gx-1.15,gx+1.15]:
 for y in [gy-1,gy+1]:box('Gazebo post',(x,y,1.25),(.09,.09,2.5),oak,.008)
cloth=mat('Gazebo natural canvas',(.70,.68,.59),.9,.007)
verts=[(gx-1.3,gy-1.15,2.48),(gx+1.3,gy-1.15,2.48),(gx+1.3,gy+1.15,2.48),(gx-1.3,gy+1.15,2.48),(gx,gy,2.78)]
canopy=mesh('Tensioned gazebo canopy',verts,[(0,1,4),(1,2,4),(2,3,4),(3,0,4)],cloth);m=canopy.modifiers.new('Canvas thickness','SOLIDIFY');m.thickness=.012
# Planting is built from branches and individual leaves, avoiding blocky blobs.
foliage=collection('Mediterranean planting')
def plant(x,y,r=.6,h=1.0,tree=False):
 if tree:
  cyl('Tree trunk',(x,y,h*.4),.055,h*.8,oak,12)
  for i in range(5):
   a=i*math.tau/5;v=Vector((math.cos(a)*r*.7,math.sin(a)*r*.7,h*.45));o=cyl('Tree branch',Vector((x,y,h*.45))+v/2,.018,v.length,oak,8);o.rotation_euler=v.to_track_quat('Z','Y').to_euler()
 verts=[];faces=[];indices=[]
 for i in range(650 if tree else 260):
  a=rng.random()*math.tau;rad=math.sqrt(rng.random())*r;z=(h*.65 if tree else .1)+rng.random()*(h*.5 if tree else h)*math.sqrt(max(0,1-rad*rad/(r*r)))
  center=Vector((x+math.cos(a)*rad,y+math.sin(a)*rad,z));az=rng.random()*math.tau;length=rng.uniform(.055,.14);wide=length*.35
  u=Vector((math.cos(az),math.sin(az),rng.uniform(-.4,.7)))*length;v=Vector((-math.sin(az),math.cos(az),rng.uniform(-.1,.2)))*wide
  n=len(verts);verts.extend([center-u,center+v,center+u,center-v,center+Vector((0,0,.015))]);faces.extend([(n,n+1,n+4),(n+1,n+2,n+4),(n+2,n+3,n+4),(n+3,n,n+4)]);indices.extend([rng.randrange(5)]*4)
 o=mesh('Individual olive leaves' if tree else 'Individual shrub leaves',verts,faces,leafmats[0])
 for m in leafmats[1:]:o.data.materials.append(m)
 for f,idx in zip(o.data.polygons,indices):f.material_index=idx
for x in [i*.9+.7 for i in range(32)]:
 if x<1.2 or x>8.7:plant(x,19.28,.45,rng.uniform(.55,.85))
 if x<20:plant(x,.65,.46,rng.uniform(.5,.8))
for y in [i*.85+1 for i in range(22)]:
 plant(.65,y,.44,rng.uniform(.5,.8));plant(29.3,y,.44,rng.uniform(.55,.9))
for x,y in [(8.1,18.2),(1,18.6),(7.9,16.2),(7.8,11.4),(8,9.4)]:plant(x,y,.75,2.2,True)
for x,y in [(gx-1.8,gy),(gx+1.8,gy+1),(gx,gy-1.7)]:plant(x,y,.55,1)
for x,y in [(8.0,12.8),(8.0,10.9),(7.2,10.9)]:
 box('Existing raised planter',(x,y,.14),(.70,.7,.30),travertine,.02);plant(x,y,.28,.55)
# Low visual noise, physically small gravel stones in the entrance.
collection('Gravel micro geometry')
verts=[];faces=[]
for i in range(25000):
 x=rng.uniform(1.2,8.7);y=rng.uniform(7.7,19.7)
 if x<3.3 and y<16.6:continue
 r=rng.uniform(.009,.03);z=.03;n=len(verts);verts.extend([(x-r,y,z),(x,y-r,z),(x+r,y,z),(x,y+r,z),(x,y,z+r*.8)]);faces.extend([(n,n+1,n+4),(n+1,n+2,n+4),(n+2,n+3,n+4),(n+3,n,n+4)])
mesh('Individual limestone gravel',verts,faces,gravel)
# Real grass blades in the visible lawns, with planted/paved areas excluded.
collection('Lawn micro geometry')
verts=[];faces=[]
for i in range(180000):
 x=rng.uniform(.5,29.5);y=rng.uniform(.5,19.5)
 if (1.0<x<8.8 and y>7.5) or (8.7<x<18.7 and 5.7<y<16.7) or (17<x<23.5 and 4.3<y<6.1) or (20.2<x<29 and y<5.3) or (abs(x-gx)<1.5 and abs(y-gy)<1.4):continue
 a=rng.random()*math.tau;h=rng.uniform(.025,.065);w=.007;n=len(verts);dx=math.cos(a)*w;dy=math.sin(a)*w
 verts.extend([(x-dx,y-dy,-.02),(x+dx,y+dy,-.02),(x+math.sin(a)*h*.4,y+math.cos(a)*h*.4,h)]);faces.append((n,n+1,n+2))
mesh('Individual grass blades',verts,faces,grass)
collection('Architectural daylight')
S.world.use_nodes=True;world=S.world.node_tree;world.nodes.clear();sky=world.nodes.new('ShaderNodeTexSky');sky.sky_type='MULTIPLE_SCATTERING';sky.sun_elevation=math.radians(43);sky.sun_rotation=math.radians(145);sky.air_density=1;bg=world.nodes.new('ShaderNodeBackground');bg.inputs[1].default_value=.045;world.links.new(sky.outputs[0],bg.inputs[0]);out=world.nodes.new('ShaderNodeOutputWorld');world.links.new(bg.outputs[0],out.inputs[0])
def area(name,location,energy,size,color,target):
 o=ns['lamp'](name,location,energy,color,size);o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
area('Large daylight softbox',(7,-4,26),2400,12,(1,.92,.80),(15,10,0))
area('Cool ambient fill',(27,18,20),1700,15,(.77,.86,1),(15,10,0))
target=Vector((15,10,.2));bpy.ops.object.camera_add(location=target+Vector((0,-40,62)));cam=bpy.context.object;cam.name='Aligned orthographic camera';S.camera=cam;cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=30.6
S.render.engine='CYCLES';S.cycles.samples=48 if '--preview' in sys.argv else 320;S.cycles.use_denoising=True;S.cycles.use_adaptive_sampling=True;S.cycles.adaptive_threshold=.008;S.cycles.max_bounces=10;S.cycles.transparent_max_bounces=8
prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='OPTIX';prefs.get_devices()
for d in prefs.devices:d.use=d.type!='CPU'
S.cycles.device='GPU';S.render.resolution_x=1536 if '--preview' in sys.argv else 4096;S.render.resolution_y=960 if '--preview' in sys.argv else 2560;S.render.resolution_percentage=100
S.render.film_transparent=True;S.render.image_settings.file_format='PNG';S.render.image_settings.color_mode='RGBA';S.render.image_settings.color_depth='8';S.render.image_settings.compression=30
S.view_settings.view_transform='AgX';S.view_settings.look='AgX - Medium High Contrast';S.view_settings.exposure=-.6
bpy.context.view_layer.update()
def project(p):
 q=world_to_camera_view(S,cam,Vector(p));return [round(q.x*1000,6),round((1-q.y)*1000,6)]
p0,px,py=[project(site(*p)) for p in [(0,0),(1000,0),(0,1000)]]
matrix=[(px[0]-p0[0])/1000,(px[1]-p0[1])/1000,(py[0]-p0[0])/1000,(py[1]-p0[1])/1000,*p0]
report={'version':25,'renderSize':[4096,2560],'projection':matrix,'plot':[project(p) for p in [(0,0,0),(30,0,0),(30,20,0),(0,20,0)]],'tv':{'living':[project(H(p)) for p in [(1.92,3.408,1.06),(2.68,3.408,1.06),(2.68,3.408,.60),(1.92,3.408,.60)]]},'rearPassage':[project(H(p)) for p in [(-4.1,3.96,0),(5.6,3.96,0),(5.6,4.85,0),(-4.1,4.85,0)]],'houseCorners':[project(H(p)) for p in [(-2.8,3.85,0),(4.3,3.85,0),(4.3,-3.2,0),(-2.8,-3.2,0)]],'gate':[project(p) for p in [ga,gb]],'source':'Matterpak-derived editable house, owner-requested rectangular landscaping; no raster affine deformation'}
(P/'property_projection_v25.json').write_text(json.dumps(report,indent=2))
S.render.filepath=str(P/('property_v25_preview.png' if '--preview' in sys.argv else 'property_v25.png'))
bpy.ops.wm.save_as_mainfile(filepath=str(P/'SuPranu_Property_Native_v25.blend'))
bpy.ops.render.render(write_still=True)
print('NATIVE_PROPERTY_RENDER_COMPLETE',flush=True)
