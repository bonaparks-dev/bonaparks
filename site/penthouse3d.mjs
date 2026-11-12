// The Residence space of Parks 3D: a penthouse on three storeys and its roof, in three dimensions.
// The model is the clean rebuild of two 3D scans (walls, stairs and furniture measured on them), loaded as one file:
// penthouse/penthouse.glb, with penthouse/penthouse.json for its storeys, rooms, lighting zones and equipment.
// Axes: x, y up, z = minus the y of the survey, metres.
// The light is not computed here. It was calculated once, at every vertex, in separate layers: the lamps (with the share
// of each of the six lighting zones), the daylight, and the light of an open sky for the storey whose lid is off.
// The page only mixes those layers, so a zone can be switched.
// Drag to turn around it, pinch or wheel to zoom, choose a storey, touch a room to go there, then visit it on foot.
// Everything that moves or lights up is simulated: nothing is measured, tracked or controlled.
import * as T from './vendor/three.module.min.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';

const $=id=>document.getElementById(id);
// Inside the Bonaparks app the same page is shown: ?app hides the way back to the site, ?vue=scene keeps the penthouse alone.
{const q=new URLSearchParams(location.search),root=document.documentElement;root.classList.toggle('in-app',q.has('app'));root.classList.toggle('only-scene',q.get('vue')==='scene');}
const canvas=$('view'),stageEl=$('scene'),labelsEl=$('labels'),loadingEl=$('loading');
// Inside the app, the page says when the penthouse is drawn or when it cannot be, so the app can show something else.
const tell=word=>{try{window.webkit?.messageHandlers?.parks3d?.postMessage(word);}catch{}};
let drawn=false;const failed=()=>{if(drawn)return;tell('failed');loadingEl.textContent='Le penthouse ne peut pas s’afficher sur cet appareil.';loadingEl.classList.add('failed');loadingEl.classList.remove('gone');};
addEventListener('error',failed);addEventListener('unhandledrejection',failed);
const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),ease=t=>t*t*(3-2*t),between=(t,a,b)=>ease(clamp((t-a)/(b-a),0,1));

let renderer;try{renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true});}catch(error){failed();throw error;}
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();failed();});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;
const scene=new T.Scene(),camera=new T.PerspectiveCamera(30,1,.4,700);
// The only light of the scene: it is for the people, who are not part of the baked model.
const sky=new T.HemisphereLight(0xe6ecff,0x4a4450,1);scene.add(sky);
// A soft room to mirror in the marble, the gold and the glass: light from above, dark below.
{const pm=new T.PMREMGenerator(renderer),env=new T.Scene(),g=new T.SphereGeometry(40,24,12),p=g.attributes.position,c=[],top=new T.Color(0xfff3e0),mid=new T.Color(0xb4aea8),low=new T.Color(0x26221f),k=new T.Color();
 for(let i=0;i<p.count;i++){const h=p.getY(i)/40;k.copy(h>0?mid:low).lerp(h>0?top:low,Math.min(1,Math.abs(h)*1.3));c.push(k.r,k.g,k.b);}
 g.setAttribute('color',new T.Float32BufferAttribute(c,3));env.add(new T.Mesh(g,new T.MeshBasicMaterial({vertexColors:true,side:T.BackSide})));
 scene.environment=pm.fromScene(env,.04).texture;scene.environmentIntensity=.55;pm.dispose();g.dispose();}
// Outside, seen from a room or a terrace: a sky, the sea to the horizon, a strip of city leaving to the north. It is a
// backdrop drawn by a formula, not the real panorama of the place, and it only shows during a visit on foot.
const vista={uZen:{value:new T.Color()},uHor:{value:new T.Color()},uWarm:{value:new T.Color()},uSea:{value:new T.Color()},uLand:{value:new T.Color()},
 uK:{value:new T.Vector4()},uSun:{value:new T.Vector3(-.635,.559,-.533)},uEye:{value:new T.Vector3(0,150,0)}};
const dome=new T.Mesh(new T.SphereGeometry(320,48,32),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,transparent:true,uniforms:vista,
 vertexShader:`varying vec3 vDir;void main(){vDir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
 fragmentShader:`uniform vec3 uZen,uHor,uWarm,uSea,uLand,uSun,uEye;uniform vec4 uK;varying vec3 vDir;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
void main(){
 vec3 d=normalize(vDir);float h=d.y,toSun=max(dot(normalize(d.xz),normalize(uSun.xz)),0.);
 float glow=pow(toSun,2.5)*.9;vec3 hor=mix(uHor,uWarm,glow),col=mix(mix(uHor,uWarm,glow*exp(-max(h,0.)*7.)),uZen,pow(clamp(h,0.,1.),.45));
 float s=max(dot(d,uSun),0.);col+=uK.z*(vec3(1.,.95,.85)*smoothstep(.9994,.9998,s)*1.5+vec3(1.,.86,.62)*pow(s,40.)*.3);
 if(h>.05){float row=floor(h*330.)/330.;vec2 q=vec2(atan(d.x,d.z)*260.*sqrt(1.-row*row),h*330.),g=floor(q);
  col+=uK.w*step(.9972,hash(g))*(.3+.7*hash(g+3.1))*smoothstep(.45,.08,length(fract(q)-.5))*smoothstep(.05,.4,h)*.9;}
 if(h<0.){
  // the ground under the ray, in metres: x to the east, -y to the north
  float t=uEye.y/max(-h,1e-4);vec2 g=uEye.xz+d.xz*t;float haze=smoothstep(900.,14000.,t),north=-g.y,east=g.x-120.*sin(north*.0007);
  // a strip of land that leaves to the north, the ocean on its east side, a bay on its west and a far shore beyond
  float edge=mix(330.,900.,smoothstep(0.,6000.,north))+60.*sin(north*.0031)+40.*noise(g*.004)-abs(east),tip=north+260.+50.*noise(g*.006),m=min(edge,tip);
  float land=max(smoothstep(0.,18.,m),smoothstep(0.,40.,-g.x-4200.-300.*noise(g*.0006)));
  float beach=smoothstep(0.,14.,m)*smoothstep(95.,55.,edge)*step(0.,east);
  vec3 sea=mix(uSea,uSea*1.7+vec3(0.,.11,.10)*uK.z,smoothstep(-300.,0.,m)*.8)+uWarm*pow(toSun,8.)*smoothstep(-.5,0.,h)*.16;
  vec3 ground=uLand*(.8+.4*noise(g*.012))+vec3(.01,.04,.012)*noise(g*.003)*uK.z;
  ground=mix(ground,vec3(.70,.62,.44)*(.2+.8*uK.z),beach);
  // the lights of the streets at night: points when near, a glow far away
  vec2 cell=g/46.,cf=fract(cell)-.5;float dots=step(.45,hash(floor(cell)))*smoothstep(.2,.02,length(cf))*1.6;
  ground+=uK.y*vec3(1.,.72,.40)*mix(dots,.3,smoothstep(500.,2600.,t))*(.6+.4*noise(g*.0021))*(1.-beach);
  col=mix(mix(sea,ground,land),hor,haze*.92);
 }
 gl_FragColor=vec4(col,uK.x);
 #include <colorspace_fragment>
}`}));
dome.renderOrder=-10;dome.frustumCulled=false;dome.visible=false;scene.add(dome);
// The cut: nothing is drawn above it. It comes down to the ceiling of the storey being looked at, and goes away for a
// visit on foot. A ceiling is only drawn when the eye is under it.
const cut=new T.Plane(new T.Vector3(0,-1,0),14);renderer.clippingPlanes=[cut];

// ---------- storeys. Floors in metres, replaced by those of the manifest.
const levelIds=['L0','L1','L2','L3'],levelY={L0:-3.03,L1:0,L2:3.28,L3:6.15},tops={L0:-.44,L1:2.61,L2:5.8,L3:99};
const levelSay={all:'<b>Tout le penthouse</b>',L0:'<b>Niveau des chambres</b>',L1:'<b>Niveau du séjour</b>',L2:'<b>Bureau et terrasse</b>',L3:'<b>Toit-terrasse</b>'};
const house=new T.Group(),parts=new Map();scene.add(house);
const part=(level,layer='main')=>{const k=level+'|'+layer;if(!parts.has(k)){const g=new T.Group();g.userData={level,ceiling:layer==='ceiling'};house.add(g);parts.set(k,g);}return parts.get(k);};
let storey='all',cutNow=14,cutTo=14;
const cutOf=id=>id==='all'||id==='L3'?14:levelY[levelIds[levelIds.indexOf(id)+1]]-.012;
const shown=level=>level==='T'||cutNow>levelY[level]+.03,topLevel=()=>storey==='all'?'L3':storey;

// ---------- the baked light. Three attributes per vertex, see the header; the uniforms are shared by every material.
// uOpen: the floor of the storey whose lid is off, how much of the open sky it takes, the scale of that layer.
const U={uDay:{value:new T.Color(.085,.075,.125)},uSw:{value:new T.Vector4()},uSw2:{value:new T.Vector2()},uScale:{value:new T.Vector2(4,2)},
 uShape:{value:new T.Vector3(.68,.8,1.5)},uFade:{value:new T.Vector2(-30,-6)},uOpen:{value:new T.Vector3(-99,0,0)}};
function baked(m,tower){
 m.onBeforeCompile=s=>{Object.assign(s.uniforms,U);
  s.vertexShader=s.vertexShader.replace('#include <common>',`#include <common>
attribute vec4 _la;attribute vec4 _lb;attribute vec4 _lc;attribute vec4 _ld;uniform vec3 uDay;uniform vec4 uSw;uniform vec2 uSw2;uniform vec2 uScale;uniform vec3 uShape;uniform vec3 uOpen;varying vec3 vBaked;varying float vOn;varying float vHigh;`)
   .replace('#include <begin_vertex>',`#include <begin_vertex>
vOn=dot(_lc,uSw)+_la.a*uSw2.x+_lb.a*uSw2.y;vHigh=(modelMatrix*vec4(transformed,1.)).y;
vec3 lampL=_la.rgb*_la.rgb*_la.rgb*uScale.x,dayL=_lb.rgb*_lb.rgb*_lb.rgb*uScale.y;
// the rooms of the storey whose lid is off also take the light of the open sky, as a model on a table does
dayL+=_ld.rgb*_ld.rgb*_ld.rgb*(uOpen.z*uOpen.y*_ld.a*smoothstep(uOpen.x-.3,uOpen.x-.1,vHigh));
// a little less contrast than the real thing: the sunny terrace and the depth of a room are seen in the same picture
dayL*=pow(max(dot(dayL,vec3(.2126,.7152,.0722)),1e-4),uShape.x-1.);lampL*=pow(max(dot(lampL,vec3(.2126,.7152,.0722)),1e-4),uShape.y-1.);
vBaked=lampL*vOn+dayL*uDay;`);
  s.fragmentShader=s.fragmentShader.replace('#include <common>',`#include <common>
uniform vec3 uShape;uniform vec2 uFade;varying vec3 vBaked;varying float vOn;varying float vHigh;`)
   .replace('#include <lights_fragment_maps>',`#include <lights_fragment_maps>
irradiance=vBaked*PI;iblIrradiance=vec3(0.);
#if defined( RE_IndirectSpecular )
radiance*=clamp(dot(vBaked,vec3(.2126,.7152,.0722))*uShape.z,.02,1.5);
#endif`)
   .replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
totalEmissiveRadiance*=vOn;`);
  if(tower)s.fragmentShader=s.fragmentShader.replace('#include <dithering_fragment>',`#include <dithering_fragment>
gl_FragColor.a*=smoothstep(uFade.x,uFade.y,vHigh);`);};
 m.customProgramCacheKey=()=>tower?'penthouse-tower':'penthouse';
 if(tower){m.transparent=true;m.depthWrite=true;}
}

const section=new T.MeshBasicMaterial({color:0x242831});
const mats=new Map(),mat=(color,o={})=>{const k=color+JSON.stringify(o);if(!mats.has(k))mats.set(k,new T.MeshStandardMaterial({color,roughness:.8,metalness:0,...o}));return mats.get(k);};
const halo=(()=>{const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d'),r=g.createRadialGradient(64,64,0,64,64,64);r.addColorStop(0,'rgba(255,240,205,1)');r.addColorStop(.22,'rgba(255,214,140,.5)');r.addColorStop(1,'rgba(255,200,120,0)');g.fillStyle=r;g.fillRect(0,0,128,128);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;})();

// ---------- the six lighting zones of the dashboard, in the order of the manifest (light.order)
const zoneList=[{id:'chambres',name:'Chambres'},{id:'sejour',name:'Séjour'},{id:'salon',name:'Grand salon'},{id:'bureau',name:'Bureau et palier'},{id:'terrasse',name:'Terrasse',tone:'orange'},{id:'toit',name:'Toit-terrasse',tone:'orange'}];
const circuits=new Map(zoneList.map(z=>[z.id,{...z,on:false,dim:1,level:0,glows:[]}])),circuitArr=[...circuits.values()];

// ---------- rooms, as in the manifest: an outline [x, z] on the floor of a storey
let rooms=[];
const inside=(poly,x,z)=>{let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const [xi,zi]=poly[i],[xj,zj]=poly[j];if((zi>z)!==(zj>z)&&x<(xj-xi)*(z-zi)/(zj-zi)+xi)c=!c;}return c;};
const roomAt=(level,x,z)=>rooms.find(r=>r.level===level&&inside(r.poly,x,z));

// ---------- people, drawn as in the house: a ring on the floor under each. Simulated. P: a point of the survey (x, y).
const P=(x,y)=>[x,-y];
const halo3=(r,color)=>{const ring=new T.Mesh(new T.TorusGeometry(r,.028,8,40),new T.MeshBasicMaterial({color}));ring.rotation.x=Math.PI/2;ring.position.y=.05;return ring;};
function figure(shirt,hair,size=1,long=false,ring=0x9fd8ff,legs=0x2f3f5c){const g=new T.Group(),m=(geo,c,y)=>{const k=new T.Mesh(geo,mat(c));k.position.y=y*size;g.add(k);return k;};
 m(new T.CapsuleGeometry(.17*size,.5*size,6,12),legs,.5);m(new T.CapsuleGeometry(.2*size,.42*size,6,12),shirt,1.08);m(new T.SphereGeometry(.15*size,18,14),0xe8c0a2,1.56);
 const h=m(new T.SphereGeometry(.165*size,18,14),hair,1.6);h.scale.set(1,long?1.05:.85,1);h.position.z=-.03*size;if(long)h.position.y-=.05*size;g.add(halo3(.42*size,ring));g.userData.tall=1.78*size;return g;}
const staffShirt=0x16181d;
const people=[
 {level:'L1',at:P(12.6,5.5),a:1.9,when:['evening'],label:'Résident',look:[0xe6e2d6,0x4a3326,1,false]},
 {level:'L1',at:P(14.6,12.6),a:.9,when:['evening'],label:'Résidente',look:[0xd77fa1,0x2c1f18,.95,true]},
 {level:'L2',at:P(8.2,3.9),a:-1.4,when:['evening'],label:'Invité',look:[0x7aa2e3,0x6b4a2f,.98,false]},
 {level:'L3',at:P(8.3,7.3),a:-1.6,when:['evening'],label:'Invitée',look:[0xf2c14e,0x3a2a20,.94,true]},
 {level:'L2',at:P(14.2,6.6),a:.6,when:['day'],label:'Résident',look:[0xe6e2d6,0x4a3326,1,false]},
 {level:'L1',at:P(2.1,8.97),a:-1.9,when:['day'],label:'Résidente',look:[0xd77fa1,0x2c1f18,.95,true]},
 {level:'L0',at:P(16.2,11.7),a:2.2,when:['night'],label:'Résident',look:[0xe6e2d6,0x4a3326,1,false]},
 {level:'L0',at:P(15.5,12.4),a:2.4,when:['night'],label:'Résidente',look:[0xd77fa1,0x2c1f18,.95,true]},
 {level:'L1',from:P(7.1,2.7),to:P(7.0,7.6),every:11,when:['day','evening'],label:'Personnel',staff:true,look:[staffShirt,0x2c1f18,1,false,0xffd98a,0x16181d]}
].map(p=>{p.node=figure(...p.look);if(p.at)p.node.position.set(p.at[0],levelY[p.level],p.at[1]);part(p.level).add(p.node);return p;});
// actors of the scenes
const arriver=figure(0xe6e2d6,0x4a3326,1,false);arriver.visible=false;part('L1').add(arriver);
const intruder=new T.Group();{const body=new T.Mesh(new T.CapsuleGeometry(.2,.75,6,12),mat(0x2b2f38));body.position.y=.82;const head=new T.Mesh(new T.SphereGeometry(.16,16,12),mat(0x3a3f4a));head.position.y=1.55;intruder.add(body,head,halo3(.48,0xff8f7d));intruder.visible=false;part('L3').add(intruder);}

// ---------- small labels, as on a dashboard
const tags=[],placed=[];
function tag(text,x,y,z,o={}){const el=document.createElement(o.press?'button':'span');el.className='tag'+(o.alert?' alert':'')+(o.press?' press':'')+(o.cls?' '+o.cls:'');el.textContent=text;if(o.press)el.addEventListener('click',o.press);labelsEl.append(el);
 const t={el,pos:new T.Vector3(x,y,z),show:true,plan:!!o.plan,level:o.level,top:!!o.top,near:o.near,gear:!!o.gear};tags.push(t);return t;}
for(const p of people)p.tag=tag(p.label,0,0,0,{cls:'who-tag'+(p.staff?' staff':''),level:p.level,near:32});
const motionTag=tag('Mouvement',0,0,0,{alert:true,level:'L3'});motionTag.show=false;

// ---------- the camera: an orbit with inertia; on a visit on foot, an eye that stays put while the view turns
const centre=new T.Vector3(11.4,1.6,-9.3),core=[8.9,-8];
const orbit={target:centre.clone(),az:0,pol:.05,dist:80,vaz:0,vpol:0};
const wide=()=>Math.max(1,1.3/camera.aspect);
// Seen from the north-east: the tall glazing of the grand salon in front, the terraces behind.
const HOME=2.6;
const homeOf=id=>id==='all'?{target:new T.Vector3(centre.x,1.4,centre.z),az:HOME,pol:1.04,dist:56*wide()}:
 {target:new T.Vector3(centre.x-.3,levelY[id]+.5,centre.z+.4),az:HOME,pol:id==='L3'?.86:.72,dist:(id==='L3'?46:41)*wide()};
const planOf=()=>({target:new T.Vector3(centre.x,levelY[topLevel()],centre.z),az:0,pol:.03,dist:clamp(Math.max(30/camera.aspect,23)*1.95,44,170)});
let fly=null,focused=null,planView=false,touched=false;
// On foot: the eye, where it is walking to, how far the lens is closed. Open, the lens sees about 86 degrees across.
const eye=new T.Vector3(),EYE=1.6,ARM=.3;let within=false,stride=null,lens=1,onFoot=0;
const lensOf=()=>clamp(2*Math.atan(Math.tan(.75)/camera.aspect)*180/Math.PI,50,82),polOf=()=>within?[.62,2.2]:[.03,1.5];
const turn=a=>a-Math.round(a/(2*Math.PI))*2*Math.PI;                       // the short way round
function flyTo(to,ms=1300){fly={from:{target:orbit.target.clone(),az:orbit.az,pol:orbit.pol,dist:orbit.dist},to:{...to,az:orbit.az+turn(to.az-orbit.az),target:to.target.clone()},t0:performance.now(),ms:reduce?1:ms};orbit.vaz=orbit.vpol=0;}
function lookFrom(from,to,ms=1){const d=new T.Vector3(from[0]-to[0],from[1]-to[1],from[2]-to[2]),dist=d.length();flyTo({target:new T.Vector3(...to),az:Math.atan2(d.x,d.z),pol:Math.acos(clamp(d.y/dist,-1,1)),dist},ms);}
function place(){const s=Math.sin(orbit.pol),c=Math.cos(orbit.pol),x=s*Math.sin(orbit.az),z=s*Math.cos(orbit.az);
 if(within&&!fly){orbit.dist=ARM;orbit.target.set(eye.x-ARM*x,eye.y-ARM*c,eye.z-ARM*z);}
 camera.position.set(orbit.target.x+orbit.dist*x,orbit.target.y+orbit.dist*c,orbit.target.z+orbit.dist*z);camera.lookAt(orbit.target);}
function resize(){const w=stageEl.clientWidth,h=stageEl.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe(stageEl);resize();

const pointers=new Map();let moved=0,pinch=0;
canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});moved=0;if(!within)fly=null;touched=true;canvas.classList.add('dragging');hint();});
canvas.addEventListener('pointermove',e=>{
 const p=pointers.get(e.pointerId);
 if(!p){canvas.classList.toggle('over',!within&&!!pick(e));return;}
 const dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;moved+=Math.abs(dx)+Math.abs(dy);
 if(pointers.size===2){const [a,b]=[...pointers.values()],d=Math.hypot(a.x-b.x,a.y-b.y);if(pinch){if(within)lens=clamp(lens*pinch/d,.5,1.15);else orbit.dist=clamp(orbit.dist*pinch/d,3,170);}pinch=d;pan(dx/2,dy/2);return;}
 if(e.buttons===2||e.shiftKey){pan(dx,dy);return;}
 // around the model the hand turns it; on foot the hand pulls the view, as on a panorama
 if(within){const k=camera.fov*Math.PI/180/Math.max(canvas.clientHeight,1);orbit.vaz=dx*k;orbit.vpol=dy*k;}else{orbit.vaz=-dx*.0052;orbit.vpol=-dy*.0042;}
 const [lo,hi]=polOf();orbit.az+=orbit.vaz;orbit.pol=clamp(orbit.pol+orbit.vpol,lo,hi);
});
// Two fingers, the right button or shift: the model slides; on foot, one walks.
function pan(dx,dy){const rx=Math.cos(orbit.az),rz=-Math.sin(orbit.az),fx=Math.sin(orbit.az),fz=Math.cos(orbit.az);
 if(within){step(eye.x-(rx*dx+fx*dy)*.011,eye.z-(rz*dx+fz*dy)*.011);return;}
 const k=orbit.dist*.0011;orbit.target.x=clamp(orbit.target.x-(rx*dx+fx*dy)*k,-3,26);orbit.target.z=clamp(orbit.target.z-(rz*dx+fz*dy)*k,-20,1);}
const release=e=>{if(!pointers.has(e.pointerId))return;pointers.delete(e.pointerId);pinch=0;canvas.classList.toggle('dragging',pointers.size>0);if(moved<6&&e.type==='pointerup')tap(e);};
canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);
canvas.addEventListener('wheel',e=>{e.preventDefault();touched=true;hint();if(within){lens=clamp(lens*Math.exp(e.deltaY*.0012),.5,1.15);return;}fly=null;orbit.dist=clamp(orbit.dist*Math.exp(e.deltaY*.0012),3,170);},{passive:false});
canvas.addEventListener('contextmenu',e=>e.preventDefault());

// ---------- touching things: the point of a floor under the finger tells the room, the highest floor in sight first
const ray=new T.Raycaster(),ndc=new T.Vector2(),ground=new T.Plane(new T.Vector3(0,1,0),0),hit=new T.Vector3(),solid=[];
const aim=e=>{const r=canvas.getBoundingClientRect();ndc.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(ndc,camera);};
function pick(e){aim(e);
 for(let i=levelIds.indexOf(topLevel());i>=0;i--){const level=levelIds[i];ground.constant=-levelY[level];if(!ray.ray.intersectPlane(ground,hit))continue;const room=roomAt(level,hit.x,hit.z);if(room)return {room};}
 return null;}
function tap(e){if(within){walkTap(e);return;}const h=pick(e);if(h)enter(h.room.id);}
function view(room){return {target:new T.Vector3(room.centre[0],room.y+.9,room.centre[1]),az:orbit.az,pol:Math.min(orbit.pol,.8)<.3?.72:clamp(orbit.pol,.5,.95),dist:clamp(Math.sqrt(room.area)*2.5+8,11,36)*Math.max(1,1.1/camera.aspect)};}
const back=$('back'),stepEl=$('inside'),STEP=['Visite à pied','Quitter la visite'];
const announce=room=>say(`<b>${room.name}</b> · ${Math.round(room.area)} m²`);
// On foot or not: the cut goes away for the visit and comes back after it.
const afoot=on=>{within=on;stride=null;lens=1;cutTo=on?14:cutOf(storey);stepEl.textContent=STEP[on?1:0];stageEl.classList.toggle('afoot',on);};
function enter(id){const room=rooms.find(r=>r.id===id);if(!room)return;manual();if(focused===id&&!within){leave();return;}
 afoot(false);if(room.level!==topLevel())setStorey(room.level,true);focused=id;stepEl.hidden=false;setPlan(false,true);flyTo(view(room));back.hidden=false;announce(room);chips();}
function leave(){focused=null;afoot(false);back.hidden=true;stepEl.hidden=true;flyTo(planView?planOf():homeOf(storey));chips();}
back.addEventListener('click',leave);stepEl.addEventListener('click',()=>{manual();stepIn();});

// ---------- a visit on foot. The outlines of the rooms say where one can stand.
// gap: metres to the nearest side of an outline; reach: metres to the outline along a direction.
const gap=(poly,x,z)=>{let m=1e9;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const ax=poly[j][0],az=poly[j][1],bx=poly[i][0]-ax,bz=poly[i][1]-az,t=clamp(((x-ax)*bx+(z-az)*bz)/(bx*bx+bz*bz||1),0,1);m=Math.min(m,Math.hypot(x-ax-bx*t,z-az-bz*t));}return m;};
const reach=(poly,x,z,dx,dz)=>{let m=60;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const ax=poly[j][0]-x,az=poly[j][1]-z,ex=poly[i][0]-poly[j][0],ez=poly[i][1]-poly[j][1],den=dx*ez-dz*ex;if(Math.abs(den)<1e-9)continue;const t=(ax*ez-az*ex)/den,u=(ax*dz-az*dx)/den;if(t>1e-6&&u>=0&&u<=1)m=Math.min(m,t);}return m;};
const floorAt=(level,x,z,margin=.3)=>rooms.find(r=>r.level===level&&inside(r.poly,x,z)&&gap(r.poly,x,z)>=margin);
// Where to stand in a room, and where to look: far from the walls, then a few steps back along the longest view, rather towards the windows.
function standOf(room){if(room.stand)return room.stand;
 const xs=room.poly.map(p=>p[0]),zs=room.poly.map(p=>p[1]);let best=null;
 for(let x=Math.min(...xs)+.2;x<Math.max(...xs);x+=.35)for(let z=Math.min(...zs)+.2;z<Math.max(...zs);z+=.35){if(!inside(room.poly,x,z))continue;
  const g=gap(room.poly,x,z)-Math.hypot(x-room.centre[0],z-room.centre[1])*.08;if(!best||g>best.g)best={x,z,g};}
 best??={x:room.centre[0],z:room.centre[1]};
 const out=Math.atan2(best.x-core[0],best.z-core[1]);let dir=0,top=-1e9;
 for(let k=0;k<32;k++){const a=k*Math.PI/16,fx=Math.sin(a),fz=Math.cos(a),score=reach(room.poly,best.x,best.z,fx,fz)+.35*reach(room.poly,best.x,best.z,-fx,-fz)+1.2*Math.cos(a-out);if(score>top){top=score;dir=a;}}
 const fx=Math.sin(dir),fz=Math.cos(dir),free=Math.min(1.1,gap(room.poly,best.x,best.z));let backing=clamp(reach(room.poly,best.x,best.z,-fx,-fz)-.7,0,3.2);
 while(backing>0&&gap(room.poly,best.x-fx*backing,best.z-fz*backing)<free)backing=Math.max(0,backing-.2);       // never with a wall at the elbow
 return room.stand={x:best.x-fx*backing,z:best.z-fz*backing,dir};}
// One step: only where a room says one can stand. Going from a room to the next changes the room in hand.
function step(x,z,soft){const from=rooms.find(r=>r.id===focused),room=from&&floorAt(from.level,x,z);if(!room)return false;
 if(soft&&!reduce)stride={from:eye.clone(),to:new T.Vector3(x,room.y+EYE,z),t0:performance.now(),ms:260};else{stride=null;eye.set(x,room.y+EYE,z);}
 if(room.id!==focused){focused=room.id;announce(room);chips();}return true;}
function stepIn(on=!within){const room=rooms.find(r=>r.id===focused);if(!room)return;
 if(!on){afoot(false);flyTo(view(room),1500);announce(room);return;}
 const s=standOf(room),az=s.dir+Math.PI,pol=1.5;setPlan(false,true);afoot(true);eye.set(s.x,room.y+EYE,s.z);hinted=true;hintEl.classList.add('gone');
 flyTo({target:new T.Vector3(eye.x-ARM*Math.sin(pol)*Math.sin(az),eye.y-ARM*Math.cos(pol),eye.z-ARM*Math.sin(pol)*Math.cos(az)),az,pol,dist:ARM},1700);
 say('Glissez pour regarder · Touchez le sol pour avancer');}
// A touch on a floor: go there. On anything else: go towards it and stop a step before. Glass does not stop the finger.
function walkTap(e){if(fly)return;aim(e);const hits=ray.intersectObjects(solid,false),h=hits.find(i=>!i.object.userData.glass)||hits[0],here=rooms.find(r=>r.id===focused);if(!h||!here)return;
 let x=h.point.x,z=h.point.z,level=h.face&&h.face.normal.y>.7?levelIds.find(l=>Math.abs(levelY[l]-h.point.y)<.35):null;
 if(!level){const dx=x-eye.x,dz=z-eye.z,d=Math.hypot(dx,dz);if(d<1.7)return;level=here.level;x-=dx/d*1.3;z-=dz/d*1.3;}
 let room=null;for(let k=0;k<10&&!(room=floorAt(level,x,z));k++){x+=(eye.x-x)*.12;z+=(eye.z-z)*.12;}
 if(!room)return;
 const to=new T.Vector3(x,room.y+EYE,z);stride={from:eye.clone(),to,t0:performance.now(),ms:reduce?1:clamp(eye.distanceTo(to)*230,450,1700)};
 if(room.level!==storey)setStorey(room.level,true);
 if(room.id!==focused){focused=room.id;announce(room);chips();}}

// ---------- state: zones, lift, climate, equipment, ambience, and the dashboard that shows it
const toast=$('toast'),statusEl=$('status'),listEl=$('list'),who=$('who'),roomsEl=$('rooms');let toastTimer=0;
function say(html){toast.innerHTML=html;toast.classList.add('on');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('on'),1900);}
const lift={locked:true,tag:null},clim={on:false,set:23},gear={shown:true,screens:new Map(),list:[]};
const degrees=v=>v.toFixed(1).replace('.',',')+' °C';
function refresh(){
 const n=circuitArr.filter(c=>c.on).length,s=n>1?'s':'';
 statusEl.textContent=`${n} zone${s} éclairée${s} · Ascenseur ${lift.locked?'verrouillé':'ouvert'}`;
 $('count').textContent=`${n}/${circuits.size}`;$('active').textContent=`${n+(clim.on?1:0)+(lift.locked?1:0)} / ${circuits.size+2} actifs`;
 $('lock-state').textContent=lift.locked?'Verrouillé':'Ouvert';$('lock-tile').setAttribute('aria-pressed',String(lift.locked));
 $('gear-state').textContent=gear.shown?'Affichés':'Masqués';$('gear-tile').setAttribute('aria-pressed',String(gear.shown));
 $('clim-state').textContent=clim.on?`En marche · ${clim.set} °C`:'Arrêtée';$('clim-set').textContent=clim.set+' °C';$('clim-power').setAttribute('aria-pressed',String(clim.on));
 for(const b of listEl.querySelectorAll('button')){const c=circuits.get(b.dataset.circuit);b.setAttribute('aria-pressed',String(c.on));b.querySelector('small').textContent=c.on?(c.dim<1?'VEILLEUSE':'ALLUMÉ'):'ÉTEINT';}
 for(const g of gear.list){g.tag.el.textContent=g.text();g.tag.w=0;}
}
function set(id,on,quiet,dim=1){const c=circuits.get(id);if(!c||(c.on===on&&c.dim===dim))return;c.on=on;c.dim=dim;if(!quiet)say(`${c.name} · <b>${on?'Allumé':'Éteint'}</b>`);refresh();}
const toggle=id=>{manual();set(id,!circuits.get(id).on);};
function setLock(locked,quiet){if(lift.locked===!!locked)return;lift.locked=!!locked;if(!quiet)say(`Ascenseur privé · <b>${locked?'Verrouillé':'Ouvert'}</b>`);refresh();}
const toggleLock=()=>{manual();setLock(!lift.locked);};
function setClim(on,quiet){if(clim.on===!!on)return;clim.on=!!on;if(!quiet)say(`Climatisation · <b>${on?'En marche':'Arrêtée'}</b>`);refresh();}
function setGear(on,quiet){gear.shown=!!on;if(!quiet)say(`Équipements · <b>${on?'Affichés':'Masqués'}</b>`);refresh();}
function setPlan(on,quiet){if(planView===!!on)return;planView=!!on;
 for(const b of document.querySelectorAll('[data-view]'))b.setAttribute('aria-pressed',String((b.dataset.view==='plan')===planView));
 if(!quiet){focused=null;afoot(false);back.hidden=true;stepEl.hidden=true;chips();flyTo(planView?planOf():homeOf(storey),1100);say(planView?'<b>Plan</b> · vu du dessus':'<b>Vue 3D</b>');}}
for(const b of document.querySelectorAll('[data-view]'))b.addEventListener('click',()=>{manual();touched=true;setPlan(b.dataset.view==='plan');});
// A storey is chosen: the cut comes down to its ceiling and the view goes to it.
function setStorey(id,quiet){if(id!=='all'&&!levelIds.includes(id))return;storey=id;cutTo=within&&quiet?14:cutOf(id);
 for(const b of document.querySelectorAll('[data-storey]'))b.setAttribute('aria-pressed',String(b.dataset.storey===id));
 if(!quiet){focused=null;afoot(false);back.hidden=true;stepEl.hidden=true;flyTo(planView?planOf():homeOf(id),1500);say(levelSay[id]);}chips();}
for(const b of document.querySelectorAll('[data-storey]'))b.addEventListener('click',()=>{manual();touched=true;setStorey(b.dataset.storey);});
// The rooms of the storey in sight, the largest first.
function chips(){const level=topLevel(),list=rooms.filter(r=>r.level===level).sort((a,b)=>b.area-a.area);$('rooms-of').textContent=storey==='all'?'Toit-terrasse':{L0:'Chambres',L1:'Séjour',L2:'Bureau et terrasse',L3:'Toit-terrasse'}[level];
 roomsEl.replaceChildren(...list.map(r=>{const b=document.createElement('button');b.textContent=r.name;b.dataset.room=r.id;b.setAttribute('aria-pressed',String(focused===r.id));b.addEventListener('click',()=>{touched=true;enter(r.id);});return b;}));}
for(const c of zoneList){const li=document.createElement('li');li.innerHTML=`<button data-circuit="${c.id}" aria-pressed="false"><i${c.tone?` class="${c.tone}"`:''}></i><span>${c.name}<small></small></span></button>`;li.firstChild.addEventListener('click',()=>toggle(c.id));listEl.append(li);}
const allOn=zoneList.map(c=>c.id);
// light: what remains of the daylight (colour and strength); expo: exposure; hemi: light on the people; dim: a zone kept low;
// sky: zenith, horizon, horizon towards the sun, sea, land of the backdrop; far: its street lights, its sun, its stars
const tint=list=>list.map(c=>new T.Color(c));
const modes={day:{light:[1,1,1],expo:.9,hemi:2.3,env:.9,on:[],lock:false,clim:true,temp:24,sky:tint([0x2f6fc8,0xbcd6ee,0xfff1d6,0x175a86,0xa9a79c]),far:[0,1,0]},
 evening:{light:[.085,.075,.125],expo:1,hemi:1.05,env:.55,on:allOn,lock:true,clim:true,temp:23,sky:tint([0x0b1030,0x3b3a6e,0xff9d5c,0x0c1430,0x0d0f1a]),far:[1,0,.22]},
 night:{light:[.022,.028,.055],expo:1.2,hemi:.5,env:.3,on:['chambres'],dim:{chambres:.16},lock:true,clim:false,temp:22.5,sky:tint([0x03050c,0x0c1226,0x1a2244,0x04070f,0x07090f]),far:[.85,0,1]}};
let ambience='evening',expo=1;const dayTo=new T.Color(.085,.075,.125);
function mode(name,quiet){const m=modes[name];if(!m)return;ambience=name;dayTo.setRGB(...m.light);for(const id of circuits.keys())set(id,m.on.includes(id),true,m.dim?.[id]??1);setLock(m.lock,true);setClim(m.clim,true);
 stageEl.classList.toggle('day',name==='day');$('temp').textContent=degrees(m.temp);
 for(const b of document.querySelectorAll('[data-mode]'))b.setAttribute('aria-pressed',String(b.dataset.mode===name));
 if(!quiet)say({day:'Journée · <b>Lumière du jour</b>',evening:'Soirée · <b>Toutes les zones allumées</b>',night:'Nuit · <b>Veilleuse dans les chambres</b>'}[name]);refresh();}
for(const b of document.querySelectorAll('[data-mode]'))b.addEventListener('click',()=>{manual();mode(b.dataset.mode);});
$('lock-tile').addEventListener('click',toggleLock);$('gear-tile').addEventListener('click',()=>setGear(!gear.shown));
$('all-on').addEventListener('click',()=>{manual();for(const id of circuits.keys())set(id,true,true);say('Éclairage · <b>Tout allumé</b>');});
$('all-off').addEventListener('click',()=>{manual();for(const id of circuits.keys())set(id,false,true);say('Éclairage · <b>Tout éteint</b>');});
$('clim-power').addEventListener('click',()=>setClim(!clim.on));
$('clim-less').addEventListener('click',()=>{clim.set=clamp(clim.set-1,18,28);refresh();});$('clim-more').addEventListener('click',()=>{clim.set=clamp(clim.set+1,18,28);refresh();});
const hintEl=$('hint');let hinted=false;function hint(){if(hinted)return;hinted=true;setTimeout(()=>hintEl.classList.add('gone'),2500);}
// Escape steps back; on foot the arrows walk and turn.
addEventListener('keydown',e=>{if(e.key==='Escape'&&focused){within?stepIn(false):leave();return;}
 if(!within||fly)return;const go=e.key==='ArrowUp'?1:e.key==='ArrowDown'?-1:0,side=e.key==='ArrowLeft'?1:e.key==='ArrowRight'?-1:0;if(!go&&!side)return;e.preventDefault();
 if(side)orbit.vaz=side*.04;if(go)step(eye.x-Math.sin(orbit.az)*go*.5,eye.z-Math.cos(orbit.az)*go*.5,true);});

// ---------- scenes: thirty seconds each, played in the penthouse itself
const stroll=(pts,t)=>{const n=pts.length-1,k=clamp(t,0,1)*n,i=Math.min(n-1,Math.floor(k)),f=k-i,a=pts[i],b=pts[i+1];return {x:a[0]+(b[0]-a[0])*f,z:a[1]+(b[1]-a[1])*f,heading:Math.atan2(b[0]-a[0],b[1]-a[1])};};
const walk=(node,pts,t,y)=>{const p=stroll(pts,t);node.position.set(p.x,y+Math.abs(Math.sin(performance.now()*.012))*.04*(t>0&&t<1?1:0),p.z);node.rotation.y=p.heading;};
// from the private lift, along the gallery, through the oak doors, round the stair, to the sofa
const wayIn=[P(5.95,13.7),P(6.7,11.4),P(7.56,9.87),P(8.0,9.3),P(8.9,10.0),P(10.6,9.55),P(12.3,8.6),P(12.5,6.4),P(12.6,5.5)];
// from the head of the outside stair, across the roof deck, towards the bar
const sneak=[P(10.9,1.5),P(11.9,4.0),P(12.3,7.0),P(10.6,9.6),P(9.6,10.4)];
const DURATION=30;
const scenes={
 arrival:{steps:[[0,'21 h 40. Le penthouse est vide, tout est éteint.'],[3,'L’ascenseur privé arrive : la galerie et le séjour s’allument.'],[9,'Le grand salon, puis le bureau s’allument.'],[16,'La climatisation démarre, la terrasse et le toit s’éclairent.'],[23,'L’ascenseur se verrouille. Bonne soirée.']],
  cast:()=>null,
  start(){mode('night',true);set('chambres',false,true);setStorey('L1',true);flyTo({target:new T.Vector3(8.2,1,-10.6),az:2.95,pol:.78,dist:27*wide()},1500);},
  at(t,s){setLock(!(t>3&&t<23),true);arriver.visible=t>3.4;walk(arriver,wayIn,between(t,3.6,15),levelY.L1);
   set('sejour',t>4.2,true);set('salon',t>9.5,true);set('bureau',t>12,true);
   if(t>8.5&&!s.wide){s.wide=true;flyTo(homeOf('L1'),2200);}
   setClim(t>16,true);set('terrasse',t>16.5,true);set('toit',t>18,true);set('chambres',t>20,true);
   if(t>19&&!s.all){s.all=true;setStorey('all',true);flyTo(homeOf('all'),2400);}}},
 goodnight:{steps:[[0,'Minuit. « Bonne nuit » est lancé.'],[3,'Le toit et la terrasse s’éteignent.'],[8,'Le bureau, le grand salon puis le séjour s’éteignent.'],[16,'Les chambres passent en veilleuse.'],[22,'L’ascenseur est verrouillé, les capteurs veillent.']],
  cast:t=>t<12?'evening':t>15?'night':null,
  start(){mode('evening',true);setLock(false,true);setStorey('all',true);flyTo(homeOf('all'),1200);},
  at(t,s){set('toit',t<3,true);set('terrasse',t<5.5,true);set('bureau',t<8.5,true);set('salon',t<11,true);set('sejour',t<13.5,true);
   if(t>14.5&&!s.down){s.down=true;setStorey('L0',true);flyTo(homeOf('L0'),2200);}
   set('chambres',true,true,t>16.5?.16:1);setClim(t<19,true);setLock(t>22,true);}},
 intrusion:{steps:[[0,'Il est 3 h 12. Tout le monde dort.'],[4,'Un mouvement est détecté sur le toit-terrasse.'],[9,'Personne non identifiée : l’alerte est relayée.'],[16,'Le toit et la terrasse s’allument, la caméra enregistre.']],
  cast:()=>'night',
  start(){mode('night',true);setStorey('L3',true);flyTo({target:new T.Vector3(11.2,levelY.L3+.6,-6.4),az:2.35,pol:.9,dist:30*wide()},1800);},
  at(t){intruder.visible=t>4;const p=stroll(sneak,between(t,4,24));intruder.position.set(p.x,levelY.L3,p.z);intruder.rotation.y=p.heading;motionTag.show=t>6;motionTag.pos.set(p.x,levelY.L3+2.1,p.z);
   $('alert').hidden=t<9;set('toit',t>16,true);set('terrasse',t>16.6,true);}}
};
let playing=null;
function play(name){stop(true);setPlan(false,true);const s=scenes[name];afoot(false);playing={name,s,t0:performance.now(),state:{}};focused=null;back.hidden=true;stepEl.hidden=true;touched=true;s.start();$('transport').hidden=false;
 for(const b of document.querySelectorAll('[data-scene]'))b.setAttribute('aria-pressed',String(b.dataset.scene===name));}
function stop(quiet){if(!playing)return;const name=playing.name;playing=null;$('transport').hidden=true;$('alert').hidden=true;arriver.visible=false;intruder.visible=false;motionTag.show=false;
 for(const b of document.querySelectorAll('[data-scene]'))b.setAttribute('aria-pressed','false');
 mode(name==='arrival'?'evening':'night',true);if(!quiet)flyTo(homeOf(storey));}
function manual(){if(playing)stop(true);}
for(const b of document.querySelectorAll('[data-scene]'))b.addEventListener('click',()=>playing?.name===b.dataset.scene?stop():play(b.dataset.scene));
$('stop').addEventListener('click',()=>stop());

// ---------- every frame
const v3=new T.Vector3();let last=performance.now(),ready=false;
function frame(now){
 const dt=clamp((now-last)/1000,0,.05);last=now;let t=0;
 // (a frame can be dated just before the click that started a scene: the time of the scene is never negative)
 if(playing){t=Math.max(0,(now-playing.t0)/1000);playing.s.at(Math.min(t,DURATION),playing.state);$('bar').style.transform=`scaleX(${clamp(t/DURATION,0,1)})`;$('caption').textContent=playing.s.steps.filter(s=>s[0]<=t).pop()[1];if(t>DURATION+1.5)stop();}
 if(fly){const k=ease(clamp((now-fly.t0)/fly.ms,0,1)),a=fly.from,b=fly.to;orbit.target.lerpVectors(a.target,b.target,k);orbit.az=a.az+(b.az-a.az)*k;orbit.pol=a.pol+(b.pol-a.pol)*k;orbit.dist=a.dist+(b.dist-a.dist)*k;if(k>=1)fly=null;}
 else if(!pointers.size&&!reduce){const [lo,hi]=polOf();orbit.az+=orbit.vaz;orbit.pol=clamp(orbit.pol+orbit.vpol,lo,hi);const f=Math.pow(.0015,dt);orbit.vaz*=f;orbit.vpol*=f;}
 // on foot: the eye walks to where it was sent, and the lens opens
 if(stride){const k=ease(clamp((now-stride.t0)/stride.ms,0,1));eye.lerpVectors(stride.from,stride.to,k);if(k>=1)stride=null;}
 {const to=within?lensOf()*lens:30;if(Math.abs(camera.fov-to)>.02){camera.fov+=(to-camera.fov)*Math.min(1,dt*(reduce?60:2.6));camera.near=camera.fov>40?.1:.4;camera.updateProjectionMatrix();}}
 place();
 // the ambience comes in slowly; the zones a little faster
 const m=modes[ambience],k=Math.min(1,dt*(reduce?60:2.2));
 U.uDay.value.lerp(dayTo,k);expo+=(m.expo-expo)*k;renderer.toneMappingExposure=expo;sky.intensity+=(m.hemi-sky.intensity)*k;scene.environmentIntensity+=(m.env-scene.environmentIntensity)*k;
 // the storey whose lid is off takes the light of the open sky; on foot, with the ceilings back, every room keeps a part of it
 U.uOpen.value.x=within?-99:levelY[topLevel()]-.2;U.uOpen.value.y+=((within?.55:1)-U.uOpen.value.y)*k;
 // the backdrop comes with the visit on foot and follows the ambience
 onFoot+=((within?1:0)-onFoot)*Math.min(1,dt*(reduce?60:2.4));dome.visible=onFoot>.01;
 {const v=vista,q=v.uK.value;v.uZen.value.lerp(m.sky[0],k);v.uHor.value.lerp(m.sky[1],k);v.uWarm.value.lerp(m.sky[2],k);v.uSea.value.lerp(m.sky[3],k);v.uLand.value.lerp(m.sky[4],k);
  q.set(onFoot,q.y+(m.far[0]-q.y)*k,q.z+(m.far[1]-q.z)*k,q.w+(m.far[2]-q.w)*k);dome.position.copy(camera.position);v.uEye.value.set(camera.position.x,150+camera.position.y,camera.position.z);}
 for(const c of circuitArr){c.level+=((c.on?c.dim:0)-c.level)*Math.min(1,dt*(reduce?60:3.5));for(const g of c.glows)g.material.opacity=Math.min(1,c.level*1.5)*.7;}
 U.uSw.value.set(circuitArr[0].level,circuitArr[1].level,circuitArr[2].level,circuitArr[3].level);U.uSw2.value.set(circuitArr[4].level,circuitArr[5].level);
 // the cut slides to the ceiling of the storey chosen; a storey entirely above it is not drawn
 cutNow+=(cutTo-cutNow)*Math.min(1,dt*(reduce?60:3.4));if(Math.abs(cutTo-cutNow)<.004)cutNow=cutTo;cut.constant=cutNow;
 for(const g of parts.values())g.visible=shown(g.userData.level)&&!(g.userData.ceiling&&camera.position.y>tops[g.userData.level]);
 // who is there depends on the ambience; a scene brings its own people
 const cast=playing?playing.s.cast(t):ambience;let residents=0,crew=0;
 for(const [i,p] of people.entries()){const here=!!cast&&p.when.includes(cast);p.node.visible=here&&!within;if(!here)continue;p.staff?crew++:residents++;
  if(p.from){const u=reduce?0:((now/1000+i*3.1)%(p.every*2))/p.every,q=u<1?between(u,.1,.9):1-between(u-1,.1,.9),moving=!reduce&&((u%1)>.1&&(u%1)<.9),dir=u<1?1:-1;
   p.node.position.set(p.from[0]+(p.to[0]-p.from[0])*q,levelY[p.level]+(moving?Math.abs(Math.sin(now*.011+i))*.035:0),p.from[1]+(p.to[1]-p.from[1])*q);p.node.rotation.y=Math.atan2((p.to[0]-p.from[0])*dir,(p.to[1]-p.from[1])*dir);}
  else if(!reduce)p.node.rotation.y=p.a+Math.sin(now*.0006+i*2.1)*.3;}
 if(arriver.visible)residents++;
 for(const p of people){p.tag.show=p.node.visible;p.tag.pos.set(p.node.position.x,p.node.position.y+p.node.userData.tall+.3,p.node.position.z);}
 {const text=residents+'·'+crew;if(who.dataset.n!==text){who.dataset.n=text;who.children[0].lastChild.textContent=residents;who.children[1].lastChild.textContent=crew;}}
 renderer.render(scene,camera);if(ready&&!drawn){drawn=true;tell('ready');}
 const w=canvas.clientWidth,h=canvas.clientHeight,top=topLevel();placed.length=0;
 for(const g of tags){v3.copy(g.pos).project(camera);
  const off=!g.show||!ready||(g.level&&!shown(g.level))||(g.top&&g.level!==top)||(g.gear&&(!gear.shown||(within&&g.room!==focused)))||(g.plan&&orbit.pol>.45)||(g.near&&orbit.dist>g.near)||v3.z>1||Math.abs(v3.x)>1.05||Math.abs(v3.y)>1.05;let x=(v3.x+1)/2*w,y=(1-v3.y)/2*h;
  if(g.gear&&!off){const half=(g.w||(g.w=g.el.offsetWidth))/2+3;                  // two labels never sit on each other: the later one steps up
   for(let k=0;k<4&&placed.some(q=>Math.abs(q[0]-x)<q[2]+half&&Math.abs(q[1]-y)<21);k++)y-=22;placed.push([x,y,half]);}
  g.el.style.opacity=off?0:1;g.el.style.pointerEvents=off?'none':'';g.el.style.transform=`translate(-50%,-50%) translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`;}
 requestAnimationFrame(frame);
}

// ---------- the model
async function load(){
 const info=await (await fetch('penthouse/penthouse.json')).json();
 for(const l of info.levels){levelY[l.id]=l.y;if(l.id!=='L3')tops[l.id]=l.top+.02;}
 rooms=info.rooms;U.uScale.value.set(info.light.lamp,info.light.day);U.uOpen.value.z=info.light.open||0;
 if(info.light.sun){const a=info.light.sun.azimuth*Math.PI/180,e=info.light.sun.elevation*Math.PI/180;vista.uSun.value.set(Math.cos(a)*Math.cos(e),Math.sin(e),-Math.sin(a)*Math.cos(e));}
 if(info.light.order.join()!==zoneList.map(z=>z.id).join())throw Error('lighting zones of the model and of the page differ');
 centre.set((info.bounds.min[0]+info.bounds.max[0])/2,1.6,(info.bounds.min[2]+info.bounds.max[2])/2);
 for(const p of people)if(p.at)p.node.position.y=levelY[p.level];
 const gltf=await new GLTFLoader().loadAsync('penthouse/'+info.model,e=>{if(e.total)loadingEl.textContent=`Chargement du penthouse… ${Math.round(e.loaded/e.total*100)} %`;});
 const done=new Set();
 for(const o of [...gltf.scene.children]){if(!o.isMesh)continue;const m=o.material,about=info.materials[m.name]||{};
  if(!done.has(m)){done.add(m);for(const map of [m.map,m.emissiveMap])if(map)map.anisotropy=8;
   if(about.glass){m.transparent=true;m.depthWrite=false;m.roughness=.06;m.envMapIntensity=1.5;}else if(m.name!=='Wall cut')baked(m,o.userData.level==='T');}
  if(m.name==='Wall cut')o.material=section;                             // where a wall is cut: one flat slate, whatever the light
  if(about.glass){o.renderOrder=2;o.userData.glass=true;}
  if(o.userData.level!=='T')solid.push(o);
  o.matrixAutoUpdate=false;o.updateMatrix();part(o.userData.level,o.userData.layer).add(o);}
 // a glow at each lamp, by zone and by storey
 for(const [id,z] of Object.entries(info.zones)){const c=circuits.get(id),by={};
  for(const [x,y,z2] of z.lamps){const level=levelIds.filter(l=>levelY[l]<=y+.05).pop()||'L0';(by[level]??=[]).push(x,y,z2);}
  for(const [level,pts] of Object.entries(by)){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pts,3));
   const cloud=new T.Points(g,new T.PointsMaterial({map:halo,size:.4,sizeAttenuation:true,transparent:true,opacity:0,depthWrite:false,blending:T.AdditiveBlending,color:0xffd9a0}));part(level).add(cloud);c.glows.push(cloud);}}
 // the names of the rooms, read from above; the equipment, read from near
 for(const r of rooms)if(r.area>5)tag(r.name,r.centre[0],r.y+.3,r.centre[1],{cls:'zone',plan:true,level:r.level,top:true});
 for(const d of info.devices){const g={d};
  if(d.type==='lock'){g.text=()=>'Ascenseur privé · '+(lift.locked?'Verrouillé':'Ouvert');g.press=toggleLock;}
  else if(d.type==='tv'){gear.screens.set(d.label,false);g.text=()=>d.label+' · '+(gear.screens.get(d.label)?'Allumé':'Éteint');g.press=()=>{gear.screens.set(d.label,!gear.screens.get(d.label));refresh();};}
  else if(d.type==='thermostat')g.text=()=>d.label+' · '+degrees(modes[ambience].temp-(d.level==='L0'?1:d.level==='L2'?-.5:0));
  else g.text=()=>d.label+' · Active';
  g.tag=tag(g.text(),d.pos[0],d.pos[1]+.28,d.pos[2],{cls:'gear',press:g.press,level:d.level,top:true,near:44,gear:true});gear.list.push(g);
  // the room of an equipment: on foot, only those of the room one stands in are named
  g.tag.room=rooms.filter(r=>r.level===d.level).map(r=>[inside(r.poly,d.pos[0],d.pos[2])?0:gap(r.poly,d.pos[0],d.pos[2]),r.id]).sort((a,b)=>a[0]-b[0])[0]?.[1];}
 ready=true;loadingEl.classList.add('gone');
 // A link can ask for an ambience, a storey, the plan, a room, a visit on foot: ?mode=day|evening|night, ?niveau=L0..L3, ?plan, ?piece=l1-grand-salon, &visite
 const q=new URLSearchParams(location.search);mode(modes[q.get('mode')]?q.get('mode'):'evening',true);
 const asked=q.get('niveau'),room=rooms.find(r=>r.id===q.get('piece'));
 if(room){touched=true;setStorey(room.level,true);cutNow=cutTo;focused=room.id;back.hidden=false;stepEl.hidden=false;orbit.az=HOME;flyTo(view(room),reduce?1:2200);chips();
  if(q.has('visite'))setTimeout(()=>{if(focused===room.id&&!within&&!playing)stepIn(true);},reduce?60:1600);return;}
 if(asked&&(asked==='all'||levelIds.includes(asked))){touched=true;setStorey(asked,true);cutNow=cutTo;}
 if(q.has('plan')){touched=true;setPlan(true,true);flyTo(planOf(),reduce?1:1600);chips();return;}
 chips();
 // The penthouse is first seen whole, from above; the view comes down, then the cut opens the living storey.
 setTimeout(()=>{if(!playing&&!focused&&!planView)flyTo(homeOf(storey),reduce?1:2600);},reduce?0:500);
 if(!asked)setTimeout(()=>{if(!touched&&!playing&&!focused&&!planView&&storey==='all')setStorey('L1');},reduce?600:4200);
}
orbit.target.copy(centre);orbit.dist=clamp(84/Math.min(1.6,camera.aspect),60,150);place();refresh();requestAnimationFrame(frame);
load().catch(error=>{console.error(error);failed();});
// Used by the page's own checks.
window.parks3d={orbit,camera,eye,vista,flyTo,lookFrom,homeOf,enter,leave,stepIn,step,standOf,modes,get within(){return within;},get focused(){return focused;},toggle,set,mode,setStorey,setPlan,setGear,toggleLock,setClim,play,stop,circuits,U,get storey(){return storey;},get rooms(){return rooms;},get ready(){return ready;},get playing(){return playing;},
 info:()=>({calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,textures:renderer.info.memory.textures,geometries:renderer.info.memory.geometries})};
