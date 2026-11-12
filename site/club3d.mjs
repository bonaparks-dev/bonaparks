// The Club space of Parks 3D: a night club on two levels, in three dimensions.
// The model is the clean rebuild of a 3D scan (walls, levels and openings measured on it), loaded as one file:
// club/club.glb, with club/club.json for its levels, rooms, tables, lighting channels and equipment.
// Axes: x, y up, z = minus the y of the survey, metres. The stage is at -x, the street at +x.
// The light is not computed here. It was calculated once, at every vertex, one layer per lighting channel (with white
// lamps), plus the light of an open sky for the model seen from above. The page gives each channel its level and its
// colour, so a channel can be switched, dimmed or tinted. Only the eight moving projectors are lit by the page itself.
// Drag to turn around it, pinch or wheel to zoom, touch a table to see it, sit at it, book it; visit a zone on foot.
// Everything that moves or lights up is simulated: nothing is measured, tracked or controlled. The public, the artists,
// the orders and the bookings are simulated too: no request is sent to anyone and nothing is paid.
import * as T from './vendor/three.module.min.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';

const $=id=>document.getElementById(id),Q=new URLSearchParams(location.search);
// Inside the Bonaparks app the same page is shown: ?app hides the way back to the site, ?vue=scene keeps the club alone.
{const root=document.documentElement;root.classList.toggle('in-app',Q.has('app'));root.classList.toggle('only-scene',Q.get('vue')==='scene');}
const canvas=$('view'),stageEl=$('scene'),labelsEl=$('labels'),loadingEl=$('loading');
// Inside the app, the page says when the club is drawn or when it cannot be, so the app can show something else.
const tell=word=>{try{window.webkit?.messageHandlers?.parks3d?.postMessage(word);}catch{}};
let drawn=false;const failed=()=>{if(drawn)return;tell('failed');loadingEl.textContent='Le club ne peut pas s’afficher sur cet appareil.';loadingEl.classList.add('failed');loadingEl.classList.remove('gone');};
addEventListener('error',failed);addEventListener('unhandledrejection',failed);
const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,coarse=matchMedia('(pointer:coarse)').matches;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),ease=t=>t*t*(3-2*t),between=(t,a,b)=>ease(clamp((t-a)/(b-a),0,1)),mixn=(a,b,t)=>a+(b-a)*t;
const mulberry=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};

let renderer;try{renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});}catch(error){failed();throw error;}
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();failed();});
renderer.setPixelRatio(Math.min(devicePixelRatio,coarse?1.5:2));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;
const scene=new T.Scene(),camera=new T.PerspectiveCamera(30,1,.4,400);scene.background=new T.Color(0x04050a);
// What the gold, the copper and the mirror balls reflect: a dark room with a few patches of coloured light.
{const pm=new T.PMREMGenerator(renderer),env=new T.Scene(),g=new T.SphereGeometry(40,48,24),p=g.attributes.position,c=[],v=new T.Vector3(),k=new T.Color();
 const lobes=[[1,.25,0,0xff5a3c,2.2],[-1,.2,.3,0x3c6cff,2],[0,.3,1,0xffb060,1.6],[0,.35,-1,0xff3ca0,1.8],[0,1,0,0xfff0e0,.9]].map(([x,y,z,col,s])=>({d:new T.Vector3(x,y,z).normalize(),c:new T.Color(col).multiplyScalar(s)}));
 for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).normalize();k.setRGB(.012,.012,.02);for(const l of lobes){const w=Math.pow(Math.max(v.dot(l.d),0),10);k.r+=l.c.r*w;k.g+=l.c.g*w;k.b+=l.c.b*w;}c.push(k.r,k.g,k.b);}
 g.setAttribute('color',new T.Float32BufferAttribute(c,3));env.add(new T.Mesh(g,new T.MeshBasicMaterial({vertexColors:true,side:T.BackSide})));
 scene.environment=pm.fromScene(env,.03).texture;scene.environmentIntensity=.7;pm.dispose();g.dispose();}

// ---------- glow. The picture is first drawn in a wide range of light; what is very bright then bleeds around itself,
// as lamps do in a dark room. With ?fx=0, or on a device that cannot, the picture is drawn plainly.
const stats={calls:0,triangles:0};
const fx=(()=>{if(Q.get('fx')==='0')return null;
 try{
  const soft={type:T.HalfFloatType,depthBuffer:false,magFilter:T.LinearFilter,minFilter:T.LinearFilter};
  const main=new T.WebGLRenderTarget(4,4,{type:T.HalfFloatType,samples:4}),a1=new T.WebGLRenderTarget(4,4,soft),b1=new T.WebGLRenderTarget(4,4,soft),a2=new T.WebGLRenderTarget(4,4,soft),b2=new T.WebGLRenderTarget(4,4,soft);
  const cam=new T.OrthographicCamera(-1,1,1,-1,0,1),quad=new T.Mesh(new T.PlaneGeometry(2,2)),sc=new T.Scene();sc.add(quad);quad.frustumCulled=false;
  const vs='varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',flat={vertexShader:vs,depthTest:false,depthWrite:false};
  const bright=new T.ShaderMaterial({...flat,toneMapped:false,uniforms:{t:{value:null},uCut:{value:1.05}},
   fragmentShader:'uniform sampler2D t;uniform float uCut;varying vec2 vUv;void main(){vec3 c=min(texture2D(t,vUv).rgb,vec3(24.));float l=max(c.r,max(c.g,c.b));gl_FragColor=vec4(c*smoothstep(uCut,uCut*2.6,l),1.);}'});
  const blur=new T.ShaderMaterial({...flat,toneMapped:false,uniforms:{t:{value:null},uDir:{value:new T.Vector2()}},
   fragmentShader:'uniform sampler2D t;uniform vec2 uDir;varying vec2 vUv;void main(){vec3 c=texture2D(t,vUv).rgb*.227;c+=(texture2D(t,vUv+uDir*1.385).rgb+texture2D(t,vUv-uDir*1.385).rgb)*.316;c+=(texture2D(t,vUv+uDir*3.231).rgb+texture2D(t,vUv-uDir*3.231).rgb)*.070;gl_FragColor=vec4(c,1.);}'});
  const mix=new T.ShaderMaterial({...flat,uniforms:{t:{value:null},g1:{value:null},g2:{value:null},uGlow:{value:.75}},
   fragmentShader:`uniform sampler2D t,g1,g2;uniform float uGlow;varying vec2 vUv;
void main(){vec3 c=texture2D(t,vUv).rgb+(texture2D(g1,vUv).rgb*.5+texture2D(g2,vUv).rgb*.85)*uGlow;vec2 q=vUv-.5;c*=1.-dot(q,q)*.42;gl_FragColor=vec4(c,1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`});
  const pass=(material,target)=>{quad.material=material;renderer.setRenderTarget(target);renderer.render(sc,cam);};
  const smear=(a,b,k)=>{blur.uniforms.t.value=a.texture;blur.uniforms.uDir.value.set(k/a.width,0);pass(blur,b);blur.uniforms.t.value=b.texture;blur.uniforms.uDir.value.set(0,k/a.height);pass(blur,a);};
  return {mix,size(w,h){main.setSize(w,h);const w1=Math.max(2,w>>1),h1=Math.max(2,h>>1),w2=Math.max(2,w>>2),h2=Math.max(2,h>>2);a1.setSize(w1,h1);b1.setSize(w1,h1);a2.setSize(w2,h2);b2.setSize(w2,h2);},
   draw(){renderer.setRenderTarget(main);renderer.render(scene,camera);stats.calls=renderer.info.render.calls;stats.triangles=renderer.info.render.triangles;
    bright.uniforms.t.value=main.texture;pass(bright,a1);smear(a1,b1,1);
    blur.uniforms.t.value=a1.texture;blur.uniforms.uDir.value.set(0,0);pass(blur,a2);smear(a2,b2,1);smear(a2,b2,2.2);          // the small picture: a wider halo
    mix.uniforms.t.value=main.texture;mix.uniforms.g1.value=a1.texture;mix.uniforms.g2.value=a2.texture;pass(mix,null);}};
 }catch(error){console.warn('glow unavailable',error);return null;}})();

// ---------- levels. Floors in metres, replaced by those of the manifest. 'F' is the street front.
const levelIds=['L0','L1'],levelY={L0:0,L1:4.2},tops={L0:2.95,L1:6.67};
const levelSay={all:'<b>Tout le club</b>',L0:'<b>La salle</b> · jusqu’à 2,90 m',L1:'<b>Mezzanine</b>'};
const club=new T.Group(),parts=new Map();scene.add(club);
const part=(level,layer='main')=>{const k=level+'|'+layer;if(!parts.has(k)){const g=new T.Group();g.userData={level,ceiling:layer==='ceiling'};club.add(g);parts.set(k,g);}return parts.get(k);};
// The upper level is put away when the room alone is asked for, and while a zone or a table of the room is looked at from near:
// what hangs over the room (the arches, the rig, the upper level) would stand in the way.
let storey='all',within=false,cutaway=false,planAuto=false;
const shown=level=>level!=='L1'||within||(storey!=='L0'&&!cutaway);

// ---------- the baked light. Three attributes per vertex, see the header; the uniforms are shared by every material.
// uCh: colour x level x scale of the eight baked channels. uOpen: how much of the open sky, and the scale of that layer.
// uSpot*: the eight moving projectors. uBall: the large mirror ball (xyz) and its angle.
const vecs=n=>Array.from({length:n},()=>new T.Vector3());
const U={uCh:{value:vecs(8)},uOpen:{value:new T.Vector2(0,1.6)},uShape:{value:new T.Vector3(.86,1,1.5)},
 uSpots:{value:0},uSpotPos:{value:vecs(8)},uSpotDir:{value:vecs(8).map(v=>v.set(0,-1,0))},uSpotCol:{value:vecs(8)},uCone:{value:new T.Vector2(Math.cos(.215),Math.cos(.12))},
 uBall:{value:new T.Vector4(0,-99,0,0)},uBallCol:{value:new T.Vector3()}};
// uSpots: how many projectors are lit (none: nothing is computed for them)
const SPOTS=`for(int i=0;i<uSpots;i++){vec3 d=uSpotPos[i]-vWp;float r2=dot(d,d);vec3 l=d*inversesqrt(r2);`;
function baked(m){
 m.onBeforeCompile=s=>{Object.assign(s.uniforms,U);
  s.vertexShader=s.vertexShader.replace('#include <common>',`#include <common>
attribute vec4 _la;attribute vec4 _lb;attribute vec4 _lc;uniform vec3 uCh[8];uniform vec2 uOpen;uniform vec3 uShape;varying vec3 vBaked;varying vec3 vWp;varying vec3 vWn;varying float vAo;`)
   .replace('#include <begin_vertex>',`#include <begin_vertex>
vec4 la3=_la*_la*_la,lb3=_lb*_lb*_lb;
vBaked=uCh[0]*la3.x+uCh[1]*la3.y+uCh[2]*la3.z+uCh[3]*la3.w+uCh[4]*lb3.x+uCh[5]*lb3.y+uCh[6]*lb3.z+uCh[7]*lb3.w;
// a little less contrast than the real thing: the lit booth and the depth of the room are seen in the same picture
vBaked*=pow(max(dot(vBaked,vec3(.2126,.7152,.0722)),1e-4),uShape.x-1.);
vBaked+=vec3(1.,.97,.93)*(_lc.x*_lc.x*_lc.x*uOpen.y*uOpen.x);
vAo=_lc.y;vWp=(modelMatrix*vec4(transformed,1.)).xyz;vWn=normalize(mat3(modelMatrix)*objectNormal);`);
  s.fragmentShader=s.fragmentShader.replace('#include <common>',`#include <common>
uniform vec3 uShape;uniform int uSpots;uniform vec3 uSpotPos[8];uniform vec3 uSpotDir[8];uniform vec3 uSpotCol[8];uniform vec2 uCone;uniform vec4 uBall;uniform vec3 uBallCol;
varying vec3 vBaked;varying vec3 vWp;varying vec3 vWn;varying float vAo;
float hash21(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}`)
   .replace('#include <lights_fragment_maps>',`#include <lights_fragment_maps>
vec3 wn=normalize(vWn);if(!gl_FrontFacing)wn=-wn;vec3 moving=vec3(0.);
${SPOTS}moving+=uSpotCol[i]*(smoothstep(uCone.x,uCone.y,dot(-l,uSpotDir[i]))*max(dot(wn,l),0.)/max(r2,3.));}
// the mirror ball: a turning grid of small patches of light, thrown from its centre
if(uBallCol.r>.0001){vec3 d=vWp-uBall.xyz;float r2=dot(d,d);vec3 l=d*inversesqrt(r2);float c=cos(uBall.w),sn=sin(uBall.w);vec3 q=vec3(l.x*c+l.z*sn,l.y,-l.x*sn+l.z*c);
 vec2 g=vec2(atan(q.z,q.x)*7.,asin(clamp(q.y,-1.,1.))*9.);float on=step(.4,hash21(floor(g)));
 moving+=uBallCol*(on*smoothstep(.2,.07,length(fract(g)-.5))*max(dot(wn,-l),0.)/max(r2,6.));}
vec3 lit=vBaked+moving*(.3+.7*vAo);
irradiance=lit*PI;iblIrradiance=vec3(0.);
#if defined( RE_IndirectSpecular )
radiance*=clamp(dot(lit,vec3(.2126,.7152,.0722))*uShape.z,.03,1.6);
#endif`);};
 m.customProgramCacheKey=()=>'club';
}
const section=new T.MeshBasicMaterial({color:0x0b0d14});

// ---------- the lighting channels of the dashboard: the eight baked ones in the order of the manifest (light.order), then the projectors
const channelList=[{id:'house',name:'Lumières de service'},{id:'arches',name:'Arches LED'},{id:'wash',name:'Murs'},{id:'tables',name:'Tables'},{id:'stage',name:'Scène'},{id:'screens',name:'Écrans'},{id:'bar',name:'Bar et marches'},{id:'entry',name:'Entrée et mezzanine'},{id:'show',name:'Projecteurs'}];
const circuits=new Map(channelList.map(c=>[c.id,{...c,on:false,dim:1,level:0,mod:1,scale:1,color:new T.Color(1,1,1),base:new T.Color(1,1,1),to:new T.Color(1,1,1),mats:[]}])),circuitArr=[...circuits.values()];
// How bright a glowing surface is drawn. A lamp or a strip keeps its colour (too bright, it would turn white); a picture is a screen.
const shine=a=>a.cast?.6+a.glow*.28:Math.min(.5+a.glow*.1,2.1);

// ---------- rooms, as in the manifest: an outline [x, z] on a floor. The small ones first: a raised zone lies inside the hall.
let rooms=[],bySize=[],tables=[],tiers={},booths=[],poles=[],bar={x0:0,x1:0,front:99,back:99},hall={},stage={wall:-38.8,front:-35.6,apron:-34.5,z:1.61,y:1};
const inside=(poly,x,z)=>{let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const [xi,zi]=poly[i],[xj,zj]=poly[j];if((zi>z)!==(zj>z)&&x<(xj-xi)*(z-zi)/(zj-zi)+xi)c=!c;}return c;};
const roomAt=(level,x,z)=>bySize.find(r=>r.level===level&&inside(r.poly,x,z));
// gap: metres to the nearest side of an outline; reach: metres to the outline along a direction.
const gap=(poly,x,z)=>{let m=1e9;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const ax=poly[j][0],az=poly[j][1],bx=poly[i][0]-ax,bz=poly[i][1]-az,t=clamp(((x-ax)*bx+(z-az)*bz)/(bx*bx+bz*bz||1),0,1);m=Math.min(m,Math.hypot(x-ax-bx*t,z-az-bz*t));}return m;};
const reach=(poly,x,z,dx,dz)=>{let m=60;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const ax=poly[j][0]-x,az=poly[j][1]-z,ex=poly[i][0]-poly[j][0],ez=poly[i][1]-poly[j][1],den=dx*ez-dz*ex;if(Math.abs(den)<1e-9)continue;const t=(ax*ez-az*ex)/den,u=(ax*dz-az*dx)/den;if(t>1e-6&&u>=0&&u<=1)m=Math.min(m,t);}return m;};
const floorAt=(level,x,z,margin=.25)=>{const r=roomAt(level,x,z);return r&&r.kind!=='stair'&&gap(r.poly,x,z)>=margin?r:null;};
// What stands in the way on a floor of height y: the booths, the bar and what is behind it, the podiums.
const blocked=(x,z,y,pad=.05)=>{for(const b of booths)if(Math.abs(b.y-y)<.3&&Math.hypot(x-b.c[0],z-b.c[1])<b.r+pad)return true;
 if(y<.3&&x>bar.x0-.2-pad&&x<bar.x1+.2+pad&&z>bar.front-.28-pad)return true;
 for(const p of poles)if(y<.3&&Math.hypot(x-p[0],z-p[1])<.45+pad)return true;return false;};

// ---------- small labels, as on a dashboard
const tags=[],placed=[];
function tag(text,x,y,z,o={}){const el=document.createElement(o.press?'button':'span');el.className='tag'+(o.press?' press':'')+(o.cls?' '+o.cls:'');el.textContent=text;if(o.press)el.addEventListener('click',o.press);labelsEl.append(el);
 const t={el,pos:new T.Vector3(x,y,z),show:true,plan:!!o.plan,level:o.level,near:o.near,gear:!!o.gear,table:o.table||null};tags.push(t);return t;}

// ---------- the camera: an orbit with inertia; on a visit on foot, an eye that stays put while the view turns
const centre=new T.Vector3(-22,1.6,1.6);
const orbit={target:centre.clone(),az:.55,pol:.05,dist:90,vaz:0,vpol:0};
const wide=()=>Math.max(1,1.3/camera.aspect);
// Seen from the bar side, a little from the street: the stage on the left, the upper level on the right.
const HOME=.55;
// On a tall screen (the scene alone on a telephone) the club is seen along its length, the stage at the top: it fills the screen.
const homeOf=id=>id==='L1'?{target:new T.Vector3(-16.6,levelY.L1+.5,centre.z),az:-.95,pol:.82,dist:27*wide()}:
 camera.aspect<.62?{target:new T.Vector3(-20.9,id==='L0'?.6:1.9,centre.z),az:Math.PI/2,pol:.78,dist:clamp(10.4/camera.aspect/Math.tan(Math.PI/12),60,130)}:
 id==='L0'?{target:new T.Vector3(-24.5,.6,centre.z-.2),az:HOME,pol:.8,dist:42*wide()}:{target:new T.Vector3(-23,1.9,centre.z-.2),az:HOME,pol:.86,dist:48*wide()};
// From above: the stage on the left on a wide screen, at the top on a tall one.
const planOf=()=>{const tall=camera.aspect<1,w=tall?18:39.5,h=tall?39.5:18;return {target:new T.Vector3(-20.9,storey==='L1'?levelY.L1:0,centre.z),az:tall?Math.PI/2:0,pol:.03,dist:clamp(Math.max(w/camera.aspect,h)/2/Math.tan(Math.PI/12)*1.06,30,170)};};
let fly=null,focused=null,planView=false,touched=false;
// On foot: the eye, where it is walking to, how far the lens is closed. Open, the lens sees about 86 degrees across.
const eye=new T.Vector3(),EYE=1.62,SEAT=1.18,ARM=.3;let stride=null,lens=1,seated=false;
const lensOf=()=>clamp(2*Math.atan(Math.tan(.75)/camera.aspect)*180/Math.PI,50,82),polOf=()=>within?[.5,2.3]:[.03,1.5];
const turn=a=>a-Math.round(a/(2*Math.PI))*2*Math.PI;                       // the short way round
function flyTo(to,ms=1300){fly={from:{target:orbit.target.clone(),az:orbit.az,pol:orbit.pol,dist:orbit.dist},to:{...to,az:orbit.az+turn(to.az-orbit.az),target:to.target.clone()},t0:performance.now(),ms:reduce?1:ms};orbit.vaz=orbit.vpol=0;}
function lookFrom(from,to,ms=1){const d=new T.Vector3(from[0]-to[0],from[1]-to[1],from[2]-to[2]),dist=d.length();flyTo({target:new T.Vector3(...to),az:Math.atan2(d.x,d.z),pol:Math.acos(clamp(d.y/dist,-1,1)),dist},ms);}
function place(){const s=Math.sin(orbit.pol),c=Math.cos(orbit.pol),x=s*Math.sin(orbit.az),z=s*Math.cos(orbit.az);
 if(within&&!fly){orbit.dist=ARM;orbit.target.set(eye.x-ARM*x,eye.y-ARM*c,eye.z-ARM*z);}
 camera.position.set(orbit.target.x+orbit.dist*x,orbit.target.y+orbit.dist*c,orbit.target.z+orbit.dist*z);camera.lookAt(orbit.target);}
const v2=new T.Vector2();
function resize(){const w=stageEl.clientWidth,h=stageEl.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();renderer.getDrawingBufferSize(v2);fx?.size(v2.x,v2.y);}
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
function pan(dx,dy){const rx=Math.cos(orbit.az),rz=-Math.sin(orbit.az),fx2=Math.sin(orbit.az),fz=Math.cos(orbit.az);
 if(within){step(eye.x-(rx*dx+fx2*dy)*.011,eye.z-(rz*dx+fz*dy)*.011);return;}
 const k=orbit.dist*.0011;orbit.target.x=clamp(orbit.target.x-(rx*dx+fx2*dy)*k,-42,8);orbit.target.z=clamp(orbit.target.z-(rz*dx+fz*dy)*k,-10,13);}
const release=e=>{if(!pointers.has(e.pointerId))return;pointers.delete(e.pointerId);pinch=0;canvas.classList.toggle('dragging',pointers.size>0);if(moved<6&&e.type==='pointerup')tap(e);};
canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);
canvas.addEventListener('wheel',e=>{e.preventDefault();touched=true;hint();if(within){lens=clamp(lens*Math.exp(e.deltaY*.0012),.5,1.15);return;}fly=null;orbit.dist=clamp(orbit.dist*Math.exp(e.deltaY*.0012),3,170);},{passive:false});
canvas.addEventListener('contextmenu',e=>e.preventDefault());

// ---------- touching things: a table first (its top under the finger), then the floor of a zone
const ray=new T.Raycaster(),ndc=new T.Vector2(),ground=new T.Plane(new T.Vector3(0,1,0),0),hit=new T.Vector3(),solid=[];
const aim=e=>{const r=canvas.getBoundingClientRect();ndc.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(ndc,camera);};
let tableMap=true;
function pick(e){aim(e);
 if(tableMap){let best=null;for(const t of tables){ground.constant=-(t.pos[1]+.74);if(!ray.ray.intersectPlane(ground,hit))continue;const d=Math.hypot(hit.x-t.pos[0],hit.z-t.pos[2]);if(d<t.r+.34&&(!best||d<best.d))best={t,d};}if(best)return {table:best.t};}
 for(const level of storey==='L0'?['L0']:['L1','L0'])for(const r of bySize){if(r.level!==level||r.kind==='stair')continue;ground.constant=-r.y;if(ray.ray.intersectPlane(ground,hit)&&inside(r.poly,hit.x,hit.z)&&roomAt(level,hit.x,hit.z)===r)return {room:r};}
 return null;}
function tap(e){if(within){walkTap(e);return;}const h=pick(e);if(h?.table)selectTable(h.table.id);else if(h?.room)enter(h.room.id);}
function view(room){return {target:new T.Vector3(room.centre[0],room.y+.9,room.centre[1]),az:orbit.az,pol:Math.min(orbit.pol,.8)<.3?.72:clamp(orbit.pol,.5,.95),dist:clamp(Math.sqrt(room.area)*2.3+8,11,34)*Math.max(1,1.1/camera.aspect)};}
const back=$('back'),stepEl=$('inside'),STEP=['Visite à pied','Quitter la visite'];
const announce=room=>say(`<b>${room.name}</b> · ${Math.round(room.area)} m²`);
const afoot=on=>{within=on;stride=null;lens=1;if(!on)seated=false;stepEl.textContent=STEP[on?1:0];stageEl.classList.toggle('afoot',on);};
function enter(id){const room=rooms.find(r=>r.id===id);if(!room)return;manual();if(focused===id&&!within){leave();return;}
 afoot(false);setPlan(false,true);if(room.level==='L1'&&storey==='L0')setStorey('all',true);cutaway=room.level==='L0';focused=id;stepEl.hidden=false;flyTo(view(room));back.hidden=false;announce(room);chips();}
function leave(){focused=null;cutaway=false;afoot(false);back.hidden=true;stepEl.hidden=true;if(chosen){chosen=null;$('bk-form').hidden=true;paintTables();}flyTo(planView?planOf():homeOf(storey));chips();}
back.addEventListener('click',leave);stepEl.addEventListener('click',()=>{manual();stepIn();});

// ---------- a visit on foot. The outlines of the zones say where one can stand; the booths and the bar stand in the way.
// Where to stand in a zone, and where to look: far from the walls, towards the stage (from the stage, towards the room).
function standOf(room){if(room.stand)return room.stand;
 const xs=room.poly.map(p=>p[0]),zs=room.poly.map(p=>p[1]);let best=null;
 for(let x=Math.min(...xs)+.2;x<Math.max(...xs);x+=.35)for(let z=Math.min(...zs)+.2;z<Math.max(...zs);z+=.35){if(floorAt(room.level,x,z,.4)!==room||blocked(x,z,room.y,.45))continue;
  const g=Math.min(gap(room.poly,x,z),2.2)-Math.hypot(x-room.centre[0],z-room.centre[1])*.06;if(!best||g>best.g)best={x,z,g};}
 best??={x:room.centre[0],z:room.centre[1]};
 const out=room.kind==='stage'?Math.PI/2:Math.atan2(stage.wall+2.4-best.x,stage.z-best.z);let dir=0,top=-1e9;
 for(let k=0;k<32;k++){const a=k*Math.PI/16,score=Math.min(reach(room.poly,best.x,best.z,Math.sin(a),Math.cos(a)),12)*.5+3*Math.cos(a-out);if(score>top){top=score;dir=a;}}
 return room.stand={x:best.x,z:best.z,dir};}
// One step: only where a zone says one can stand. Going from a zone to the next changes the zone in hand; the eye follows the floor.
function step(x,z,soft){const from=rooms.find(r=>r.id===focused),room=from&&floorAt(from.level,x,z);if(!room)return false;
 if(!seated&&blocked(x,z,room.y)&&!blocked(eye.x,eye.z,room.y))return false;seated=false;
 const to=new T.Vector3(x,room.y+EYE,z);if(soft&&!reduce)stride={from:eye.clone(),to,t0:performance.now(),ms:260};else{stride=null;eye.copy(to);}
 if(room.id!==focused){focused=room.id;announce(room);chips();}return true;}
const facing=(az,pol)=>({target:new T.Vector3(eye.x-ARM*Math.sin(pol)*Math.sin(az),eye.y-ARM*Math.cos(pol),eye.z-ARM*Math.sin(pol)*Math.cos(az)),az,pol,dist:ARM});
function stepIn(on=!within){const room=rooms.find(r=>r.id===focused);if(!room)return;
 if(!on){afoot(false);cutaway=room.level==='L0';flyTo(view(room),1500);announce(room);return;}
 const s=standOf(room);setPlan(false,true);afoot(true);eye.set(s.x,room.y+EYE,s.z);hinted=true;hintEl.classList.add('gone');
 flyTo(facing(s.dir+Math.PI,1.5),1700);say('Glissez pour regarder · Touchez le sol pour avancer');}
// A touch on a floor: go there. On anything else: go towards it and stop a step before. Glass does not stop the finger.
function walkTap(e){if(fly)return;aim(e);const hits=ray.intersectObjects(solid,false),h=hits.find(i=>!i.object.userData.glass)||hits[0],here=rooms.find(r=>r.id===focused);if(!h||!here)return;
 let x=h.point.x,z=h.point.z,level=h.point.y>3.6?'L1':'L0';const flat=h.face&&h.face.normal.y>.7;
 if(!flat){const dx=x-eye.x,dz=z-eye.z,d=Math.hypot(dx,dz);if(d<1.7)return;x-=dx/d*1.3;z-=dz/d*1.3;}
 let room=null;for(let k=0;k<12;k++){room=floorAt(level,x,z);if(room&&!blocked(x,z,room.y,.2))break;room=null;x+=(eye.x-x)*.12;z+=(eye.z-z)*.12;}
 if(!room)return;seated=false;
 const to=new T.Vector3(x,room.y+EYE,z);stride={from:eye.clone(),to,t0:performance.now(),ms:reduce?1:clamp(eye.distanceTo(to)*230,450,1900)};
 if(room.id!==focused){focused=room.id;announce(room);chips();}}

// ---------- state: channels, door, sound, equipment, ambience, and the dashboard that shows it
const toast=$('toast'),statusEl=$('status'),listEl=$('list'),who=$('who'),roomsEl=$('rooms');let toastTimer=0;
function say(html){toast.innerHTML=html;toast.classList.add('on');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('on'),2100);}
const door={locked:false},gear={shown:false,list:[]},headcount={guests:0,staff:0};
const degrees=v=>v.toFixed(1).replace('.',',')+' °C',whole=n=>n.toLocaleString('fr-FR'),dollars=n=>whole(n)+' $';
function refresh(){
 const n=circuitArr.filter(c=>c.on).length,s=n>1?'x':'',taken=tables.filter(t=>t.state!=='free').length;
 statusEl.textContent=`${n} cana${n>1?'ux':'l'} allumé${n>1?'s':''} · Porte ${door.locked?'fermée':'ouverte'}`;
 $('active').textContent=`${n}/${circuits.size} canaux de lumière`;$('taken').textContent=`${taken}/${tables.length}`;$('free').textContent=tables.length?`${tables.length-taken} libres ce soir · simulation`:'';
 $('lock-state').textContent=door.locked?'Fermée':'Ouverte';$('lock-tile').setAttribute('aria-pressed',String(door.locked));
 $('gear-state').textContent=gear.shown?'Affichés':'Masqués';$('gear-tile').setAttribute('aria-pressed',String(gear.shown));
 $('map-state').textContent=tableMap?'Affiché':'Masqué';$('map-tile').setAttribute('aria-pressed',String(tableMap));
 $('sound-state').textContent=sound?'En marche':'Coupé';$('sound-tile').setAttribute('aria-pressed',String(!!sound));
 for(const b of listEl.querySelectorAll('button')){const c=circuits.get(b.dataset.circuit);b.setAttribute('aria-pressed',String(c.on));b.querySelector('small').textContent=c.on?(c.dim<.95?'TAMISÉ':'ALLUMÉ'):'ÉTEINT';}
 for(const g of gear.list){g.tag.el.textContent=g.text();g.tag.w=0;}
 {const live=artist,now=ambience==='house'?-1:live?1:0;[...$('lineup').children].forEach((li,i)=>li.classList.toggle('now',i===now));$('stage-state').textContent=ambience==='house'?'Programme simulé · avant l’ouverture':live?'Live en cours · simulation':'DJ résident aux platines · simulation';}
}
function set(id,on,quiet,dim=1){const c=circuits.get(id);if(!c||(c.on===on&&c.dim===dim))return;c.on=on;c.dim=dim;if(!quiet)say(`${c.name} · <b>${on?'Allumé':'Éteint'}</b>`);refresh();}
const toggle=id=>{manual();set(id,!circuits.get(id).on);};
function setLock(locked,quiet){if(door.locked===!!locked)return;door.locked=!!locked;if(!quiet)say(`Porte d’entrée · <b>${locked?'Fermée':'Ouverte'}</b>`);refresh();}
function setGear(on,quiet){gear.shown=!!on;if(!quiet)say(`Équipements · <b>${on?'Affichés':'Masqués'}</b>`);refresh();}
function setMap(on,quiet){tableMap=!!on;if(!quiet)say(`Plan de tables · <b>${on?'Affiché':'Masqué'}</b>`);refresh();}
// The plan is the plan of one level: asked for while the whole club is shown, it is the plan of the room, and the whole club comes back after it.
function setPlan(on,quiet){if(planView===!!on)return;planView=!!on;cutaway=false;
 if(planView&&storey==='all'){setStorey('L0',true);planAuto=true;}else if(!planView&&planAuto){planAuto=false;if(storey==='L0')setStorey('all',true);}
 for(const b of document.querySelectorAll('[data-view]'))b.setAttribute('aria-pressed',String((b.dataset.view==='plan')===planView));
 if(!quiet){focused=null;afoot(false);back.hidden=true;stepEl.hidden=true;chips();flyTo(planView?planOf():homeOf(storey),1100);say(planView?'<b>Plan</b> · vu du dessus':'<b>Vue 3D</b>');}}
for(const b of document.querySelectorAll('[data-view]'))b.addEventListener('click',()=>{manual();touched=true;setPlan(b.dataset.view==='plan');});
// A level is chosen: the room alone (what is above 2.90 m is put away), the upper level, or everything.
function setStorey(id,quiet){if(id!=='all'&&!levelIds.includes(id))return;storey=id;planAuto=false;
 for(const b of document.querySelectorAll('[data-storey]'))b.setAttribute('aria-pressed',String(b.dataset.storey===id));
 if(!quiet){focused=null;cutaway=false;afoot(false);back.hidden=true;stepEl.hidden=true;flyTo(planView?planOf():homeOf(id),1500);say(levelSay[id]);}chips();}
for(const b of document.querySelectorAll('[data-storey]'))b.addEventListener('click',()=>{manual();touched=true;setStorey(b.dataset.storey);});
// The zones one can go to, from the stage to the street.
function chips(){const list=rooms.filter(r=>r.kind!=='stair'&&r.kind!=='bar'&&(storey!=='L0'||r.level==='L0')).sort((a,b)=>a.centre[0]-b.centre[0]);$('rooms-of').textContent=storey==='L0'?'La salle':'Salle et mezzanine';
 roomsEl.replaceChildren(...list.map(r=>{const b=document.createElement('button');b.textContent=r.name;b.dataset.room=r.id;b.setAttribute('aria-pressed',String(focused===r.id));b.addEventListener('click',()=>{touched=true;enter(r.id);});return b;}));}
for(const c of channelList){const li=document.createElement('li');li.innerHTML=`<button data-circuit="${c.id}" aria-pressed="false"><i></i><span>${c.name}<small></small></span></button>`;li.firstChild.addEventListener('click',()=>toggle(c.id));listEl.append(li);}
// level: the level of each channel (0: off); expo: exposure; fill: how full the room is; energy: how much the public moves;
// open: the share of open-sky light that keeps the model readable from above; vol: loudness of the page's own loop
const modes={house:{level:{house:1,arches:.25,wash:.25,tables:.6,stage:.4,screens:.5,bar:.8,entry:.7,show:0},expo:1.5,fill:0,energy:0,open:.05,lock:true,vol:0,temp:21,say:'Avant l’ouverture · <b>Lumières de service</b>'},
 evening:{level:{house:0,arches:.55,wash:.8,tables:1,stage:.5,screens:.8,bar:1,entry:.5,show:0},expo:1.25,fill:.5,energy:.45,open:.035,lock:false,vol:.55,temp:22.5,say:'Soirée · <b>La salle s’installe</b>'},
 show:{level:{house:0,arches:1,wash:1,tables:1,stage:1,screens:1,bar:1,entry:.45,show:1},expo:1.12,fill:1,energy:1,open:.03,lock:false,vol:.8,temp:23.5,say:'Show · <b>Artiste sur scène, projecteurs</b>'}};
let ambience='evening',expo=1,artist=false,fillOver=null,energyNow=0;
function mode(name,quiet){const m=modes[name];if(!m)return;ambience=name;for(const [id,v] of Object.entries(m.level))set(id,v>0,true,v>0?v:1);setLock(m.lock,true);artist=name==='show';
 for(const b of document.querySelectorAll('[data-mode]'))b.setAttribute('aria-pressed',String(b.dataset.mode===name));
 if(!quiet)say(m.say);refresh();}
for(const b of document.querySelectorAll('[data-mode]'))b.addEventListener('click',()=>{manual();mode(b.dataset.mode);});
$('lock-tile').addEventListener('click',()=>{manual();setLock(!door.locked);});$('gear-tile').addEventListener('click',()=>setGear(!gear.shown));$('map-tile').addEventListener('click',()=>setMap(!tableMap));
$('all-on').addEventListener('click',()=>{manual();for(const id of circuits.keys())set(id,true,true);say('Éclairage · <b>Tout allumé</b>');});
$('all-off').addEventListener('click',()=>{manual();for(const id of circuits.keys())set(id,false,true);say('Éclairage · <b>Tout éteint</b>');});
const hintEl=$('hint');let hinted=false;function hint(){if(hinted)return;hinted=true;setTimeout(()=>hintEl.classList.add('gone'),2500);}
if(coarse)hintEl.textContent='Glissez pour tourner · Pincez pour zoomer · Touchez une table';
// Escape steps back; on foot the arrows walk and turn.
addEventListener('keydown',e=>{if(e.target instanceof HTMLInputElement)return;if(e.key==='Escape'&&focused){within?stepIn(false):leave();return;}
 if(!within||fly)return;const go=e.key==='ArrowUp'?1:e.key==='ArrowDown'?-1:0,side=e.key==='ArrowLeft'?1:e.key==='ArrowRight'?-1:0;if(!go&&!side)return;e.preventDefault();
 if(side)orbit.vaz=side*.04;if(go)step(eye.x-Math.sin(orbit.az)*go*.5,eye.z-Math.cos(orbit.az)*go*.5,true);});

// ---------- sound. A loop made here by the page (a kick, a hat, a bass, a chord): no recording, nobody's music.
// The beat also drives the lights; without sound it runs on the clock.
const BPM=124,SPB=60/BPM;let sound=null;
function makeSound(){const ac=new (window.AudioContext||window.webkitAudioContext)(),out=ac.createGain(),low=ac.createBiquadFilter(),comp=ac.createDynamicsCompressor();
 low.type='lowpass';low.frequency.value=18000;out.gain.value=0;out.connect(low);low.connect(comp);comp.connect(ac.destination);
 const noise=ac.createBuffer(1,ac.sampleRate/2,ac.sampleRate);{const d=noise.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;}
 const hiss=(t,type,f,v,d)=>{const s=ac.createBufferSource(),fl=ac.createBiquadFilter(),g=ac.createGain();s.buffer=noise;fl.type=type;fl.frequency.value=f;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+d);s.connect(fl).connect(g).connect(out);s.start(t);s.stop(t+d+.02);};
 const kick=t=>{const o=ac.createOscillator(),g=ac.createGain();o.frequency.setValueAtTime(150,t);o.frequency.exponentialRampToValueAtTime(42,t+.12);g.gain.setValueAtTime(.95,t);g.gain.exponentialRampToValueAtTime(.001,t+.3);o.connect(g).connect(out);o.start(t);o.stop(t+.32);};
 const tone=(t,f,d,v,cut)=>{const o=ac.createOscillator(),fl=ac.createBiquadFilter(),g=ac.createGain();o.type='sawtooth';o.frequency.value=f;fl.type='lowpass';fl.frequency.setValueAtTime(cut,t);fl.frequency.exponentialRampToValueAtTime(cut*.35,t+d);
  g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(v,t+.012);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(fl).connect(g).connect(out);o.start(t);o.stop(t+d+.02);};
 const hz=n=>440*Math.pow(2,(n-69)/12),roots=[45,45,41,43],chords=[[57,60,64],[57,60,64],[53,57,60],[55,59,62]];
 const t0=ac.currentTime+.1;let next=t0,n=0;
 const tick=()=>{while(next<ac.currentTime+.2){const s=n%16,b=(n>>4)%4;                 // sixteenth notes, four bars
   if(s%4===0)kick(next);if(s%4===2)hiss(next,'highpass',7500,.15,.06);else if(s%2===1)hiss(next,'highpass',9000,.05,.04);if(s===4||s===12)hiss(next,'bandpass',1500,.3,.16);
   if(s%4===2||s===7||s===15)tone(next,hz(roots[b]),SPB*.45,.32,420);
   if(s===0||s===6||s===11)for(const k of chords[b])tone(next,hz(k),SPB*.6,.05,1900);
   next+=SPB/4;n++;}};
 const timer=setInterval(tick,50);tick();
 return {ac,out,low,t0,stop(){clearInterval(timer);ac.close();}};}
function setSound(on,quiet){if(!!sound===!!on)return;if(on){try{sound=makeSound();}catch{sound=null;say('Son indisponible sur cet appareil');return;}}else{sound.stop();sound=null;}
 if(!quiet)say(`Son de la page · <b>${on?'En marche':'Coupé'}</b>`+(on&&ambience==='house'?' · il démarre avec la soirée':''));refresh();}
$('sound-tile').addEventListener('click',()=>setSound(!sound));
const beatAt=now=>sound?Math.max(0,(sound.ac.currentTime-sound.t0)/SPB):now/1000/SPB;

// ---------- tables. The map, the categories and their minimums are indicative figures read online; who sits where tonight is drawn by lot.
// state of a table: 'free', 'taken' (simulated), 'mine' (the visitor's own simulated booking)
const zoneSay={salle:'Salle',scene:'Sur scène',arriere:'Fond de salle',vip:'Carré VIP',estrade:'Estrade',alcove:'Salon privé'};
const stateSay={free:'Libre',taken:'Prise ce soir',mine:'Votre réservation'};
let chosen=null,tierFilter=null,party=4,arrival='23 h',tablesKey=0;
const css=c=>`rgb(${c.map(v=>Math.round(v*255)).join(',')})`;
const rings=new T.Group();scene.add(rings);
function tablesUi(){
 $('tiers').replaceChildren(...Object.entries(tiers).sort((a,b)=>a[1].minimum-b[1].minimum).map(([id,t])=>{const b=document.createElement('button');b.dataset.tier=id;b.style.setProperty('--tier',css(t.color));b.setAttribute('aria-pressed','false');
  b.innerHTML=`<i></i><b>${t.name}</b><span></span>`;b.addEventListener('click',()=>{tierFilter=tierFilter===id?null:id;paintTables();});return b;}));
 $('tables').replaceChildren(...tables.map(t=>{const li=document.createElement('li'),b=document.createElement('button');b.textContent=t.id;b.dataset.table=t.id;b.style.setProperty('--tier',css(tiers[t.tier].color));b.addEventListener('click',()=>{touched=true;selectTable(t.id);});li.append(b);return li;}));
 for(const t of tables){const col=new T.Color().setRGB(...tiers[t.tier].color,T.SRGBColorSpace);
  t.ring=new T.Mesh(new T.TorusGeometry(t.r+.035,.02,6,40),new T.MeshBasicMaterial({color:col.clone()}));t.ring.rotation.x=Math.PI/2;t.ring.position.set(t.pos[0],t.pos[1]+.715,t.pos[2]);t.col=col;rings.add(t.ring);
  // its label stands a little away from the middle of its booth: two tables of one booth are then read apart
  const b=booths.filter(b=>Math.abs(b.y-t.pos[1])<.3).map(b=>[Math.hypot(t.pos[0]-b.c[0],t.pos[2]-b.c[1]),b]).sort((p,q)=>p[0]-q[0])[0],d=b&&b[0]<b[1].r&&b[0]>.05?.34/b[0]:0;
  t.tag=tag(t.id,t.pos[0]+(d?(t.pos[0]-b[1].c[0])*d:0),t.pos[1]+1.05,t.pos[2]+(d?(t.pos[2]-b[1].c[1])*d:0),{cls:'table',press:()=>{touched=true;selectTable(t.id);},level:'L0',table:t});t.tag.el.style.setProperty('--tier',css(tiers[t.tier].color));}
 paintTables();}
function paintTables(){tablesKey++;
 for(const b of $('tiers').children){const id=b.dataset.tier,free=tables.filter(t=>t.tier===id&&t.state==='free').length;b.setAttribute('aria-pressed',String(tierFilter===id));b.lastChild.textContent=`${dollars(tiers[id].minimum)} · ${free} libre${free>1?'s':''}`;}
 for(const li of $('tables').children){const b=li.firstChild,t=tables.find(t=>t.id===b.dataset.table);li.hidden=!!tierFilter&&t.tier!==tierFilter;b.dataset.state=t.state;b.setAttribute('aria-pressed',String(chosen===t));}
 for(const t of tables){t.tag.el.dataset.state=t.state;t.tag.el.classList.toggle('chosen',chosen===t);t.tag.dim=!!tierFilter&&t.tier!==tierFilter;}
 const card=$('booking');card.hidden=!chosen;
 if(chosen){const t=chosen,tier=tiers[t.tier];card.style.setProperty('--tier',css(tier.color));$('bk-name').textContent=`Table ${t.id} · ${tier.name}`;$('bk-zone').textContent=zoneSay[t.zone]||'Salle';$('bk-state').textContent=stateSay[t.state];
  $('bk-min').textContent=dollars(tier.minimum);$('bk-guests').textContent=`${tier.guests} personnes`;
  const book=$('bk-book');book.textContent=t.state==='mine'?'Annuler':t.state==='taken'?'Indisponible':'Réserver';book.disabled=t.state==='taken';book.classList.toggle('primary',t.state==='free');
  if(t.state!=='free')$('bk-form').hidden=true;party=clamp(party,1,tier.guests);$('bk-n').textContent=party;
  const done=$('bk-done');done.hidden=t.state!=='mine';if(t.state==='mine')done.textContent=`Réservation simulée au nom de ${t.booking.who} · ${t.booking.n} personne${t.booking.n>1?'s':''} · arrivée ${t.booking.time}.`;}
 refresh();}
function selectTable(id,quiet){const t=tables.find(t=>t.id===id);if(!t)return;if(!quiet)manual();if(chosen!==t)$('bk-form').hidden=true;chosen=t;paintTables();
 if(!quiet){say(`Table <b>${t.id}</b> · ${tiers[t.tier].name} · ${stateSay[t.state]}`);
  // its card is at the top of the dashboard: bring it into view
  {const smooth=reduce?'auto':'smooth';document.querySelector('.panel').scrollTo({top:0,behavior:smooth});if(matchMedia('(max-width:700px)').matches)scrollTo({top:0,behavior:smooth});}
  if(!planView&&!within){focused=null;cutaway=true;back.hidden=false;stepEl.hidden=true;chips();flyTo({target:new T.Vector3(t.pos[0],t.pos[1]+.8,t.pos[2]),az:orbit.az,pol:clamp(orbit.pol,.6,.95),dist:14*wide()},1100);}}}
// The card of a table is closed: the table is no longer in hand.
function unselect(){if(!chosen)return;chosen=null;$('bk-form').hidden=true;paintTables();if(cutaway&&!focused&&!within)leave();}
// The seat of a table: the eye sits behind it as the stage sees it, and looks at the stage.
function sit(id){const t=tables.find(t=>t.id===id),room=t&&roomAt('L0',t.pos[0],t.pos[2]);if(!t||!room)return;manual();chosen=t;paintTables();setPlan(false,true);focused=room.id;back.hidden=false;stepEl.hidden=false;afoot(true);seated=true;lens=.74;chips();            // a longer lens than on foot: the stage as the eye sees it
 // the seat is a little behind the place given by the model: against the back of the bench, the table in front
 {const ex=t.eye[0]-t.pos[0],ez=t.eye[2]-t.pos[2],k=.2/(Math.hypot(ex,ez)||1);eye.set(t.eye[0]+ex*k,t.eye[1],t.eye[2]+ez*k);}
 const d=new T.Vector3(stage.wall+2.6-eye.x,2.3-eye.y,stage.z-eye.z).normalize();hinted=true;hintEl.classList.add('gone');
 flyTo(facing(Math.atan2(-d.x,-d.z),Math.acos(clamp(-d.y,-1,1))),1700);say(`Vue depuis la table <b>${t.id}</b>`);}
function book(id,o={}){const t=tables.find(t=>t.id===id);if(!t||t.state!=='free')return false;const tier=tiers[t.tier];
 t.state='mine';t.booking={who:String(o.who||'').trim().slice(0,24)||'Invité',n:clamp(Math.round(o.n||party),1,tier.guests),time:o.time||arrival};$('bk-form').hidden=true;paintTables();
 say(`Table <b>${t.id}</b> · Réservation simulée`);return true;}
function cancel(id){const t=tables.find(t=>t.id===id);if(!t||t.state!=='mine')return;t.state='free';t.booking=null;paintTables();say(`Table <b>${t.id}</b> · Réservation annulée`);}
$('bk-sit').addEventListener('click',()=>{if(chosen){touched=true;sit(chosen.id);}});$('bk-close').addEventListener('click',unselect);
$('bk-book').addEventListener('click',()=>{if(!chosen)return;if(chosen.state==='mine'){cancel(chosen.id);return;}if(chosen.state!=='free')return;const f=$('bk-form');f.hidden=!f.hidden;if(!f.hidden)$('bk-who').focus({preventScroll:true});});
$('bk-less').addEventListener('click',()=>{party=clamp(party-1,1,chosen?tiers[chosen.tier].guests:15);$('bk-n').textContent=party;});
$('bk-more').addEventListener('click',()=>{party=clamp(party+1,1,chosen?tiers[chosen.tier].guests:15);$('bk-n').textContent=party;});
for(const b of $('bk-times').children)b.addEventListener('click',()=>{arrival=b.dataset.time;for(const k of $('bk-times').children)k.setAttribute('aria-pressed',String(k===b));});
$('bk-form').addEventListener('submit',e=>{e.preventDefault();if(chosen)book(chosen.id,{who:$('bk-who').value,n:party,time:arrival});});

// ---------- the public and the staff: plain figures, all drawn at once. Simulated: nobody is counted, named or followed.
const MAXP=440;
const crowd=(()=>{
 // a plain figure: a turned torso (hips, waist, shoulders, neck) made flatter from front to back, two legs, two arms and a head.
 // part: 0 the torso, 1 a leg, 2 an arm, 3 the head
 const piece=(geo,part)=>{geo.deleteAttribute('uv');geo.setAttribute('part',new T.BufferAttribute(new Float32Array(geo.attributes.position.count).fill(part),1));return geo;};
 const limb=(r,x0,y0,x1,y1)=>{const h=Math.hypot(x1-x0,y1-y0),q=new T.CylinderGeometry(r,r*.8,h,6,1);q.translate(0,-h/2,0);q.rotateZ(Math.atan2(x1-x0,y0-y1));q.translate(x0,y0,0);return q;};
 const torso=new T.LatheGeometry([[.12,.8],[.158,.93],[.135,1.08],[.198,1.33],[.2,1.41],[.12,1.47],[.062,1.5],[.055,1.56]].map(([r,y])=>new T.Vector2(r,y)),10);torso.scale(1,1,.6);
 const head=new T.SphereGeometry(.105,8,6);head.translate(0,1.63,0);
 const base=mergeGeometries([piece(torso,0),piece(limb(.08,-.08,.9,-.08,0),1),piece(limb(.08,.08,.9,.08,0),1),piece(limb(.046,-.218,1.37,-.25,.8),2),piece(limb(.046,.218,1.37,.25,.8),2),piece(head,3)]);
 const g=new T.InstancedBufferGeometry();g.index=base.index;for(const k of ['position','normal','part'])g.setAttribute(k,base.attributes[k]);
 // aAt: where and the heading; aLook: size, a number of its own, how much it dances, 1 in the entry and upstairs; aCol: clothes, and how close to a table lamp
 const at=new T.InstancedBufferAttribute(new Float32Array(MAXP*4),4),look=new T.InstancedBufferAttribute(new Float32Array(MAXP*4),4),col=new T.InstancedBufferAttribute(new Float32Array(MAXP*4),4);
 at.setUsage(T.DynamicDrawUsage);g.setAttribute('aAt',at);g.setAttribute('aLook',look);g.setAttribute('aCol',col);g.instanceCount=0;
 const uniforms={uBeat:{value:0},uEnergy:{value:0},uNear:{value:new T.Vector2()},uHall:{value:new T.Vector3()},uWash:{value:new T.Vector3()},uArch:{value:new T.Vector3()},uWarm:{value:new T.Vector3()},uEntry:{value:new T.Vector3()},
  uSpots:U.uSpots,uSpotPos:U.uSpotPos,uSpotDir:U.uSpotDir,uSpotCol:U.uSpotCol,uCone:U.uCone};
 const mesh=new T.Mesh(g,new T.ShaderMaterial({uniforms,side:T.DoubleSide,
  vertexShader:`attribute vec4 aAt;attribute vec4 aLook;attribute vec4 aCol;attribute float part;uniform float uBeat;uniform float uEnergy;uniform vec2 uNear;
varying vec3 vWp;varying vec3 vWn;varying vec4 vCol;varying vec4 vK;varying float vPart;
void main(){float dance=aLook.z*uEnergy,ph=aLook.y;vec3 p=position;vK=vec4(p.y,ph,aLook.w,p.z);vPart=part;p.y*=aLook.x;
 p.x+=sin((uBeat*.5+ph)*6.2832)*.09*dance*(p.y/1.6);p.y+=abs(sin((uBeat+ph*.22)*3.14159))*.05*dance;
 float c=cos(aAt.w),s=sin(aAt.w);vec3 w=vec3(p.x*c+p.z*s,p.y,-p.x*s+p.z*c)+aAt.xyz;
 // nobody stands in the eye of the visitor (uNear: how near somebody sitting, somebody standing, may be drawn)
 if(distance(aAt.xz,cameraPosition.xz)<(aLook.z>.5?uNear.y:uNear.x))w=vec3(0.,-99.,0.);
 vWn=vec3(normal.x*c+normal.z*s,normal.y,-normal.x*s+normal.z*c);vWp=w;vCol=aCol;gl_Position=projectionMatrix*viewMatrix*vec4(w,1.);}`,
  fragmentShader:`uniform vec3 uHall;uniform vec3 uWash;uniform vec3 uArch;uniform vec3 uWarm;uniform vec3 uEntry;uniform int uSpots;uniform vec3 uSpotPos[8];uniform vec3 uSpotDir[8];uniform vec3 uSpotCol[8];uniform vec2 uCone;
varying vec3 vWp;varying vec3 vWn;varying vec4 vCol;varying vec4 vK;varying float vPart;
void main(){vec3 n=normalize(vWn),v=normalize(cameraPosition-vWp);
 vec3 skin=mix(vec3(.62,.42,.31),vec3(.22,.13,.09),fract(vK.y*7.31)),hair=mix(vec3(.03,.025,.02),vec3(.3,.2,.09),step(.8,fract(vK.y*13.7))),base=vCol.rgb;
 if(vPart>2.5)base=(vK.x>1.675||(vK.w<-.03&&vK.x>1.575))?hair:skin;                               // the head: hair on top and behind
 else if(vPart>1.5){if(vK.x<.87||(vK.x<1.17&&fract(vK.y*3.71)>.55))base=skin;}                   // an arm: the hand, and for some the forearm
 else if(vPart>.5){if(fract(vK.y*5.3)>.42)base=vec3(.02,.02,.025);}                               // the legs: often dark
 float under=smoothstep(-25.8,-28.2,vWp.x)*smoothstep(-36.4,-34.2,vWp.x);                       // under the arches
 vec3 amb=mix(uHall+uWash*(1.-.5*under)+uArch*(.1+.9*under)+uWarm*vCol.a,uEntry,vK.z);
 // lit from above and from the sides, and a bright edge: in the dark of a club, people are outlines
 vec3 light=amb*(.3+.5*max(n.y,0.)+.2*abs(n.x)+1.3*pow(1.-abs(dot(n,v)),2.6));
 ${SPOTS}light+=uSpotCol[i]*(smoothstep(uCone.x,uCone.y,dot(-l,uSpotDir[i]))*(.25+.75*max(dot(n,l),0.))/max(r2,3.));}
 gl_FragColor=vec4(base*light,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`}));
 mesh.frustumCulled=false;scene.add(mesh);
 return {g,at,look,col,uniforms,n:0,key:''};})();
const spots=[],walkers=[];                                         // where somebody can be; who is walking in a scene
// clothes of a night out: mostly dark, some white, a few colours
const cloth=r=>{const u=r();return u<.44?[.018,.018,.022]:u<.6?[.42,.42,.42]:u<.68?[.1,.1,.12]:[[.42,.03,.05],[.05,.09,.34],[.46,.08,.24],[.05,.24,.13],[.24,.05,.36],[.08,.17,.36],[.3,.02,.1]][Math.floor(r()*7)];};
const STAFF=[.011,.011,.013];
function people(){const r=mulberry(11),add=(x,y,z,o)=>spots.push({x,y,z,a:0,h:.94+r()*.13,ph:r(),u:r(),dance:1,zone:0,warm:.12,level:'L0',col:o.kind==='staff'||o.kind==='dj'?STAFF:cloth(r),...o});
 const toStage=(x,z)=>Math.atan2(stage.wall+2-x,stage.z-z);
 for(const t of tables){const [tx,ty,tz]=t.pos;t.seats.forEach(([sx,sz],i)=>add(sx,ty-.46,sz,{kind:'seat',table:t,i,a:Math.atan2(tx-sx,tz-sz),dance:.3,warm:1}));
  let n=0;for(let k=0;k<30&&n<3;k++){const a=r()*6.283,d=1.15+r()*.7,x=tx+Math.cos(a)*d,z=tz+Math.sin(a)*d,room=floorAt('L0',x,z,.3);if(!room||Math.abs(room.y-ty)>.01||blocked(x,z,room.y,.25)||spots.some(s=>Math.hypot(s.x-x,s.z-z)<.5))continue;add(x,room.y,z,{kind:'near',table:t,i:t.seats.length+n++,a:Math.atan2(tx-x,tz-z),dance:.7,warm:.55});}}
 const floor=new Set(['l0-salle','l0-fond-de-salle']);let n=0;
 for(let k=0;k<9000&&n<150;k++){const x=mixn(stage.apron+.3,hall.balcony+1,r()),z=mixn(hall.right+.35,hall.left-.35,r()),room=floorAt('L0',x,z,.3);
  if(!room||!floor.has(room.id)||blocked(x,z,0,.3)||spots.some(s=>Math.abs(s.y-0)<.6&&Math.hypot(s.x-x,s.z-z)<.62))continue;add(x,0,z,{kind:'floor',a:toStage(x,z)+(r()-.5)*1.1});n++;}
 for(let k=0;k<6;k++)add(mixn(bar.x0+.45,bar.x1-.45,k/5),-.22,bar.front-.5,{kind:'stool',a:0,dance:.25,warm:.6});
 const mezz=rooms.find(q=>q.id==='l1-mezzanine');n=0;
 if(mezz)for(let k=0;k<2000&&n<16;k++){const x=mixn(hall.balcony+.5,-13.4,r()),z=mixn(hall.right+.6,hall.left-.6,r());if(!inside(mezz.poly,x,z)||gap(mezz.poly,x,z)<.55||spots.some(s=>s.level==='L1'&&Math.hypot(s.x-x,s.z-z)<.7))continue;add(x,mezz.y,z,{kind:'mezz',level:'L1',zone:1,a:Math.PI*1.5+(r()-.5)*.8,dance:.6,warm:.5});n++;}
 const cz=hall.corridor_z;for(let k=0;k<6;k++)add(-4.2-k*.85,0,cz+1.15+(k%2)*.3,{kind:'queue',zone:1,a:-Math.PI/2,dance:.15});
 // the staff: three behind the bar, a host at the desk, two at the doors, three in the room, the DJ; then the artist
 for(let k=0;k<3;k++)add(mixn(bar.x0+.7,bar.x1-.7,k/2),0,bar.back+.32,{kind:'staff',a:Math.PI,dance:.2,warm:.6});
 add(-9.95,0,cz,{kind:'staff',zone:1,a:Math.PI/2,dance:.1});add(-3.4,0,cz-1.2,{kind:'staff',zone:1,a:Math.PI/2,dance:.05});add(hall.door_in[0]-1.3,0,hall.door_in[1]+.9,{kind:'staff',a:-Math.PI/2,dance:.05});
 add(-26.2,0,hall.left-1.75,{kind:'staff',a:Math.PI,dance:.2});add(-23.1,0,hall.right+1.35,{kind:'staff',a:0,dance:.2});add(stage.apron+.9,0,stage.z+2.5,{kind:'staff',a:Math.PI/2,dance:.1});
 // behind the desk of the booth: the DJ, and beside, when there is a live, the artist in white
 add(stage.wall+3.3,stage.y,stage.z+.5,{kind:'dj',a:Math.PI/2,dance:.8,warm:.5});
 add(stage.wall+3.2,stage.y,stage.z-.85,{kind:'artist',a:Math.PI/2,dance:1,col:[.86,.86,.9],h:1.04,warm:.3,ph:.9});}
const isStaff=s=>s.kind==='staff'||s.kind==='dj'||s.kind==='artist';
function inPlace(s,fill){if(s.level==='L1'&&!shown('L1'))return false;
 if(s.kind==='staff')return true;if(s.kind==='dj')return ambience!=='house'||fill>0;if(s.kind==='artist')return artist;
 if(fill<=0)return false;
 if(s.table){const t=s.table;if(t.state==='free')return false;if(t.state==='mine')return s.i<t.booking.n;return s.i<Math.ceil((t.seats.length+3)*Math.min(1,fill*1.4));}
 return s.u<({floor:.92,stool:1,mezz:.9,queue:1}[s.kind]??1)*fill;}
function put(i,s,x=s.x,y=s.y,z=s.z,a=s.a){const {at,look,col}=crowd;at.array.set([x,y,z,a],i*4);look.array.set([s.h,s.ph,s.dance,s.zone],i*4);col.array.set([s.col[0],s.col[1],s.col[2],s.warm||0],i*4);}
function fillCrowd(fill){let i=0,guests=0,staff=0;for(const s of spots){if(i>=MAXP-16||!inPlace(s,fill))continue;put(i++,s);isStaff(s)?staff++:guests++;}
 crowd.n=i;crowd.look.needsUpdate=crowd.col.needsUpdate=crowd.at.needsUpdate=true;headcount.guests=guests;headcount.staff=staff;}

// ---------- the eight projectors: a cone of light in the haze for each, and the patch it throws (see the baked light)
const beams=[],DOWN=new T.Vector3(0,-1,0),focus={on:false,at:new T.Vector3()};
function makeBeams(devices){const geo=new T.ConeGeometry(1,1,20,1,true);geo.translate(0,-.5,0);
 for(const d of devices.filter(d=>d.type==='projector').slice(0,8)){const uniforms={uColor:{value:new T.Color()},uLevel:{value:0}};
  const mesh=new T.Mesh(geo,new T.ShaderMaterial({uniforms,transparent:true,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide,
   vertexShader:'varying float vT;varying vec3 vN;varying vec3 vV;void main(){vT=-position.y;vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalMatrix*normal;vV=-mv.xyz;gl_Position=projectionMatrix*mv;}',
   fragmentShader:'uniform vec3 uColor;uniform float uLevel;varying float vT;varying vec3 vN;varying vec3 vV;void main(){float rim=abs(dot(normalize(vN),normalize(vV))),k=1.-vT;gl_FragColor=vec4(uColor*(pow(rim,2.4)*k*(.1+.9*k*k)*uLevel),1.);}'}));
  mesh.frustumCulled=false;mesh.renderOrder=5;mesh.visible=false;scene.add(mesh);
  beams.push({mesh,uniforms,pos:new T.Vector3(d.pos[0],d.pos[1]-.42,d.pos[2]),base:new T.Vector3(...d.target),to:new T.Vector3(...d.target),goal:new T.Vector3(),dir:new T.Vector3(0,-1,0)});}}
// What the projectors, the arches and the walls do through a show: four looks, sixteen beats each.
const cues=[{arches:[1,.16,.05],wash:[.16,.22,1],show:[.85,.25,1]},{arches:[1,.05,.35],wash:[.45,.12,1],show:[.2,.75,1]},{arches:[1,.45,.08],wash:[.05,.45,.9],show:[1,.55,.15]},{arches:[.9,.1,.9],wash:[.1,.2,1],show:[1,.9,.8]}];
const archMats=[];let ballTurn=0;
// The name of the place, written by the page where the model keeps a blank: the desk, the edge of the upper level, the street front.
const signs=[];
function makeSigns(list,name){for(const s of list){const c=document.createElement('canvas');c.width=1024;c.height=Math.max(64,Math.round(1024*s.height/s.width));const g=c.getContext('2d');
  let px=c.height*.62;const face='"Segoe Script","Snell Roundhand","Brush Script MT","Apple Chancery",cursive';g.font=`600 ${px}px ${face}`;px*=Math.min(1,c.width*.86/g.measureText(name).width);
  g.fillStyle='#000';g.fillRect(0,0,c.width,c.height);g.font=`600 ${px}px ${face}`;g.textAlign='center';g.textBaseline='middle';g.shadowColor='#fff';
  for(const blur of [px*.28,px*.1,0]){g.shadowBlur=blur;g.fillStyle=blur?'rgba(255,255,255,.55)':'#fff';g.fillText(name,c.width/2,c.height*.52);}
  const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.anisotropy=8;
  const mesh=new T.Mesh(new T.PlaneGeometry(s.width,s.height),new T.MeshBasicMaterial({map,transparent:true,depthWrite:false,blending:T.AdditiveBlending}));
  mesh.position.set(s.pos[0]+s.facing[0]*.012,s.pos[1],s.pos[2]+s.facing[1]*.012);mesh.rotation.y=Math.atan2(s.facing[0],s.facing[1]);part(s.id==='balcony'?'L1':s.id==='front'?'F':'L0').add(mesh);signs.push(mesh);}}
// Sparklers of a bottle parade: a few bright points over each bearer.
const sparks=new T.Points(new T.BufferGeometry(),new T.PointsMaterial({size:.13,sizeAttenuation:true,transparent:true,depthWrite:false,blending:T.AdditiveBlending,color:new T.Color(6,4.6,2.2),map:(()=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),q=g.createRadialGradient(32,32,0,32,32,32);q.addColorStop(0,'#fff');q.addColorStop(.25,'rgba(255,230,170,.7)');q.addColorStop(1,'rgba(255,200,120,0)');g.fillStyle=q;g.fillRect(0,0,64,64);return new T.CanvasTexture(c);})()}));
sparks.geometry.setAttribute('position',new T.BufferAttribute(new Float32Array(90),3));sparks.geometry.setDrawRange(0,0);sparks.frustumCulled=false;sparks.renderOrder=6;scene.add(sparks);

// ---------- scenes: thirty seconds each, played in the club itself
// A walk along a path, at an even pace whatever the length of its legs.
const stroll=(pts,t)=>{const len=[];let total=0;for(let i=1;i<pts.length;i++){len.push(Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1],pts[i][2]-pts[i-1][2]));total+=len[i-1];}
 let d=clamp(t,0,1)*total,i=0;while(i<len.length-1&&d>len[i])d-=len[i++];const f=len[i]?Math.min(1,d/len[i]):0,a=pts[i],b=pts[i+1];
 return {x:a[0]+(b[0]-a[0])*f,y:a[1]+(b[1]-a[1])*f,z:a[2]+(b[2]-a[2])*f,heading:Math.atan2(b[0]-a[0],b[2]-a[2])};};
const DURATION=30;let wayIn=[],order=null,orderWas=null;
// Who walks in a scene: a path, when, how long. They are drawn after the ones who stand.
const walker=(path,t0,dur,o={})=>({path,t0,dur,h:1,ph:Math.random(),dance:.1,zone:0,col:STAFF,...o});
const scenes={
 doors:{steps:[[0,'22 h 55. Le personnel est en place, les lumières de service sont allumées.'],[4,'23 h. Les lumières de service s’éteignent, la salle prend ses couleurs.'],[9,'La porte s’ouvre : les premières entrées sont comptées.'],[17,'Les tables réservées s’installent.'],[24,'La soirée est lancée.']],
  end:'evening',
  start(){mode('house',true);fillOver=0;setStorey('all',true);flyTo(homeOf('all'),1200);const r=mulberry(5);
   for(let k=0;k<12;k++){const off=(r()-.5)*.44;walkers.push(walker(wayIn.map(p=>[p[0],p[1],p[2]+off]),9.2+k*.65,13,{col:cloth(r),zone:1,guest:true}));}},
  at(t,s){set('house',t<4,true);set('arches',true,true,t>4.6?.55:.25);set('wash',true,true,t>5.2?.8:.25);set('tables',true,true,t>5.8?1:.6);set('screens',true,true,t>6.4?.8:.5);set('bar',true,true,t>4?1:.8);set('entry',true,true,t>4?1:.8);
   setLock(t<9,true);fillOver=t<9?0:.5*between(t,11,27);
   if(t>8&&!s.door){s.door=true;flyTo({target:new T.Vector3(-8.6,.8,hall.corridor_z),az:.95,pol:.72,dist:23*wide()},2400);}      // over the entry, from the street
   if(t>17&&!s.room){s.room=true;flyTo(homeOf('L0'),2600);}}},
 live:{steps:[[0,'0 h 30. La salle est pleine, le DJ résident termine son set.'],[3,'Noir salle : les arches et les murs s’éteignent.'],[7,'L’artiste entre en scène, les projecteurs s’allument.'],[14,'Les arches suivent le rythme, les écrans passent sur la scène.'],[23,'Le show se voit de chaque table, la sienne comprise.']],
  end:'show',
  start(){mode('evening',true);fillOver=1;artist=false;setStorey('all',true);lookFrom([hall.balcony+.5,levelY.L1+2.2,stage.z+2.3],[stage.wall+4,2.2,stage.z-.3],1500);},
  at(t,s){const dark=t>3&&t<8;set('arches',!dark,true,t>8?1:.55);set('wash',!dark,true,t>8?1:.8);set('screens',true,true,dark?.25:1);set('stage',true,true,t>7?1:.5);set('show',t>7.4,true);artist=t>7;
   if(t>13&&!s.near){s.near=true;lookFrom([-28.2,2.5,stage.z-2.6],[stage.apron-.4,2.2,stage.z+.2],2600);}
   if(t>22&&!s.wide){s.wide=true;flyTo(homeOf('L0'),2800);}}},
 parade:{steps:[[0,'Une commande arrive : des bouteilles, parade demandée.'],[4,'Le bar prépare, la table est signalée sur le plan.'],[9,'La parade traverse la salle, cierges allumés.'],[19,'Les projecteurs saluent la table.'],[25,'Commande servie : l’addition de la table est mise à jour.']],
  end:'show',
  // The table served is the visitor's own if one is booked; otherwise one near the stage, taken for the time of the scene.
  start(){mode('show',true);const t=tables.find(t=>t.state==='mine')||tables.find(t=>t.id==='207')||tables[0];orderWas=t.state;if(t.state==='free')t.state='taken';order=t;selectTable(t.id,true);setStorey('all',true);
   // three bearers leave the bar (or the back of the room for the tables of the other side), follow the aisle and stop at the edge of the booth
   const [tx,ty,tz]=t.pos,left=tz>stage.z-.2,from=left?[bar.x1+.6,0,bar.front-.75]:[hall.balcony-2.7,0,hall.right+.9],lane=left?bar.front-1.25:hall.right+1.2;
   const booth=booths.find(b=>Math.abs(b.y-ty)<.3&&Math.hypot(b.c[0]-tx,b.c[1]-tz)<b.r),ux=from[0]-tx,uz=from[2]-tz,ul=Math.hypot(ux,uz)||1,far=(booth?booth.r:t.r+.8)+.45;
   const end=[tx+ux/ul*far,0,tz+uz/ul*far];end[1]=floorAt('L0',end[0],end[2],0)?.y??0;
   for(let k=0;k<3;k++){const o=(k-1)*.5,px=-uz/ul*o,pz=ux/ul*o;walkers.push(walker([[from[0]+px,0,from[2]+pz],[mixn(from[0],end[0],.45)+px,0,lane+pz],[end[0]+px,end[1],end[2]+pz]],9+k*.5,8.5,{spark:true,dance:.5,stay:true}));}
   $('order-title').textContent=`Table ${t.id} · ${tiers[t.tier].name} : 2 bouteilles, parade demandée.`;
   flyTo({target:new T.Vector3(mixn(from[0],tx,.5),1,mixn(from[2],tz,.5)),az:HOME,pol:.8,dist:26*wide()},1600);},
  at(t,s){$('alert').hidden=false;$('order-bar').textContent=t<4?'Commande reçue':t<9?'Préparation':t<19?'En route':'Servie';$('order-light').textContent=t<9?'En attente':t<19?'Table signalée':'Projecteurs sur la table';$('order-bill').textContent=t<25?'Mise à jour à la livraison':'Mise à jour · simulation';
   focus.on=t>18.5&&t<28;if(order)focus.at.set(order.pos[0],order.pos[1]+.8,order.pos[2]);
   // then the table is seen from inside the room, over the heads, from the side of the middle of the room
   if(t>17&&!s.near&&order){s.near=true;const [tx,ty,tz]=order.pos,cx=-25-tx,cz=stage.z-tz,cl=Math.hypot(cx,cz),k=cl>3?4.6/cl:0;lookFrom([tx+(k?cx*k:4.6),ty+2.7,tz+cz*k],[tx,ty+1,tz],2600);}}}
};
let playing=null;
function play(name){stop(true);setPlan(false,true);const s=scenes[name];afoot(false);cutaway=false;playing={name,s,t0:performance.now(),state:{}};focused=null;back.hidden=true;stepEl.hidden=true;touched=true;hinted=true;hintEl.classList.add('gone');s.start();$('transport').hidden=false;
 for(const b of document.querySelectorAll('[data-scene]'))b.setAttribute('aria-pressed',String(b.dataset.scene===name));}
function stop(quiet){if(!playing)return;const s=playing.s;playing=null;$('transport').hidden=true;$('alert').hidden=true;walkers.length=0;fillOver=null;focus.on=false;
 if(order&&orderWas==='free'&&order.state==='taken')order.state='free';order=orderWas=null;                // the table of the scene is free again
 for(const b of document.querySelectorAll('[data-scene]'))b.setAttribute('aria-pressed','false');
 mode(s.end,true);paintTables();if(!quiet){cutaway=false;back.hidden=true;flyTo(homeOf(storey));}}
function manual(){if(playing)stop(true);}
for(const b of document.querySelectorAll('[data-scene]'))b.addEventListener('click',()=>playing?.name===b.dataset.scene?stop():play(b.dataset.scene));
$('stop').addEventListener('click',()=>stop());

// ---------- every frame
const v3=new T.Vector3(),tmp=new T.Color(),TAGS=38;let last=performance.now(),ready=false,openNow=0,ringT=0;        // TAGS: pixels per metre from which the tables are named
// A device that cannot keep up draws a smaller picture: the page stays fluid, the picture is a little softer.
// (26: under the thirty pictures per second to which some phones hold a page to save their battery)
const pace={n:0,ms:0,ratio:renderer.getPixelRatio(),floor:Math.max(.7,renderer.getPixelRatio()/2)};
function keepUp(ms){
 if(!ready||document.hidden||ms>250){pace.n=pace.ms=0;return;}
 pace.n++;pace.ms+=ms;if(pace.ms<1600)return;
 const rate=pace.n*1000/pace.ms;pace.n=pace.ms=0;
 if(rate<26&&pace.ratio>pace.floor){pace.ratio=Math.max(pace.floor,pace.ratio*.82);renderer.setPixelRatio(pace.ratio);resize();}}
function frame(now){
 const dt=clamp((now-last)/1000,0,.05);keepUp(now-last);last=now;let t=0;const m=modes[ambience],k=Math.min(1,dt*(reduce?60:2.2));
 // (a frame can be dated just before the click that started a scene: the time of the scene is never negative)
 if(playing){t=Math.max(0,(now-playing.t0)/1000);playing.s.at(Math.min(t,DURATION),playing.state);$('bar').style.transform=`scaleX(${clamp(t/DURATION,0,1)})`;$('caption').textContent=playing.s.steps.filter(s=>s[0]<=t).pop()[1];if(t>DURATION+1.5)stop();}
 if(fly){const q=ease(clamp((now-fly.t0)/fly.ms,0,1)),a=fly.from,b=fly.to;orbit.target.lerpVectors(a.target,b.target,q);orbit.az=a.az+(b.az-a.az)*q;orbit.pol=a.pol+(b.pol-a.pol)*q;orbit.dist=a.dist+(b.dist-a.dist)*q;if(q>=1)fly=null;}
 else if(!pointers.size&&!reduce){const [lo,hi]=polOf();orbit.az+=orbit.vaz;orbit.pol=clamp(orbit.pol+orbit.vpol,lo,hi);const f=Math.pow(.0015,dt);orbit.vaz*=f;orbit.vpol*=f;}
 // on foot: the eye walks to where it was sent, and the lens opens
 if(stride){const q=ease(clamp((now-stride.t0)/stride.ms,0,1));eye.lerpVectors(stride.from,stride.to,q);if(q>=1)stride=null;}
 {const to=within?lensOf()*lens:30;if(Math.abs(camera.fov-to)>.02){camera.fov+=(to-camera.fov)*Math.min(1,dt*(reduce?60:2.6));camera.near=camera.fov>40?.08:.4;camera.updateProjectionMatrix();}}
 place();
 // the beat: from the loop when it plays, from the clock otherwise. pulse falls from 1 to 0 over each beat.
 const beat=beatAt(now),showing=circuits.get('show').level>.02&&!reduce,pulse=reduce?0:Math.pow(1-beat%1,2),cue=cues[ambience==='show'&&!reduce?Math.floor(beat/16)%cues.length:0];
 expo+=(m.expo-expo)*k;renderer.toneMappingExposure=expo*(planView?1.15:1);
 // seen from above the model keeps a little of the open sky so that it can be read; more of it on the plan
 openNow+=((within?0:planView?.3:m.open)-openNow)*k;U.uOpen.value.x=openNow;
 // the channels: level, colour, and what the beat does to them
 let archSum=0;
 for(let i=0;i<archMats.length;i++){const a=archMats[i],p=(beat/2)%1*archMats.length,d=Math.abs(i-p),near=Math.min(d,archMats.length-d);a.k=showing&&ambience==='show'?.42+1.25*Math.exp(-near*near/2.2):.92+.08*Math.sin(now*.0011+i*.7);archSum+=a.k;}
 for(const [i,c] of circuitArr.entries()){c.level+=((c.on?c.dim:0)-c.level)*Math.min(1,dt*(reduce?60:3.5));
  if(cue[c.id])c.to.setRGB(...cue[c.id]);else c.to.copy(c.base);c.color.lerp(c.to,Math.min(1,dt*(reduce?60:1.6)));
  c.mod=c.id==='arches'&&archMats.length?archSum/archMats.length:c.id==='wash'?1+.14*pulse*(showing?1:0):c.id==='screens'?1+.07*pulse:1;
  if(i<8)U.uCh.value[i].set(c.color.r,c.color.g,c.color.b).multiplyScalar(c.level*c.mod*c.scale);
  for(const g of c.mats){g.m.emissiveIntensity=g.glow*c.level*(g.arch?g.arch.k:c.mod);if(g.tint)g.m.emissive.copy(c.color);}}
 // the light on the public: what each channel gives to somebody standing in the room, at a table, under the arches, in the entry
 {const u=crowd.uniforms,lit=(v,id,f)=>{const c=circuits.get(id);return v.set(c.color.r,c.color.g,c.color.b).multiplyScalar(c.level*c.mod*f);};
  lit(u.uArch.value,'arches',.55);lit(u.uWash.value,'wash',.3);lit(u.uWarm.value,'tables',.42);
  lit(u.uHall.value,'house',.95).addScalar(.006).add(lit(v3,'screens',.07)).add(lit(v3,'stage',.05));
  lit(u.uEntry.value,'entry',.4).addScalar(.006).add(lit(v3,'house',.5));}
 {const e=circuits.get('entry');for(const sgn of signs)sgn.material.color.copy(e.color).multiplyScalar(e.level*2.6).addScalar(e.level*.5);}
 // the projectors: where each one points, its colour, and the patch of light it throws
 {const c=circuits.get('show'),lvl=c.level;U.uSpots.value=lvl>.01?beams.length:0;ballTurn+=dt*(reduce?0:.25);const st=circuits.get('stage');U.uBall.value.w=ballTurn;U.uBallCol.value.set(1,.92,.85).multiplyScalar((st.level*.9+lvl*1.4)*(ambience==='house'?0:1));
  for(const [i,b] of beams.entries()){
   if(focus.on)b.goal.copy(focus.at);else if(artist&&i>5)b.goal.set(stage.wall+3.2,stage.y+1.2,stage.z-.85);
   else if(showing){const ph=i*1.7,wd=1.6+Math.sin(beat*.049+i)*.9;b.goal.set(b.base.x+Math.cos(beat*Math.PI/4+ph)*wd*1.4,b.base.y,b.base.z+Math.sin(beat*Math.PI/8+ph*1.3)*wd);}else b.goal.copy(b.base);
   b.to.lerp(b.goal,Math.min(1,dt*(reduce?60:2.2)));b.dir.subVectors(b.to,b.pos);const len=b.dir.length();b.dir.multiplyScalar(1/len);
   const col=tmp.copy(c.color);if(i%2&&!focus.on)col.lerp(circuits.get('arches').color,.6);const gain=lvl*(1+.18*pulse);
   b.mesh.visible=lvl>.01;b.mesh.position.copy(b.pos);b.mesh.quaternion.setFromUnitVectors(DOWN,b.dir);b.mesh.scale.set(len*.2,len*1.04,len*.2);b.uniforms.uColor.value.copy(col);b.uniforms.uLevel.value=gain*.3;
   U.uSpotPos.value[i].copy(b.pos);U.uSpotDir.value[i].copy(b.dir);U.uSpotCol.value[i].set(col.r,col.g,col.b).multiplyScalar(gain*24);}}
 // a level put away is not drawn; a ceiling is only drawn when the eye is under it
 for(const g of parts.values())g.visible=g.userData.level==='F'||(shown(g.userData.level)&&!(g.userData.ceiling&&camera.position.y>tops[g.userData.level]));
 // the public: who is there depends on the ambience, on the tables taken and on the scene being played
 {const fill=fillOver??m.fill,key=[ambience,Math.round(fill*20),shown('L1'),artist,tablesKey].join();if(key!==crowd.key){crowd.key=key;fillCrowd(fill);}
  energyNow+=((playing?.name==='live'&&t>7?1:m.energy)-energyNow)*k;crowd.uniforms.uBeat.value=reduce?0:beat;crowd.uniforms.uEnergy.value=reduce?0:energyNow;crowd.uniforms.uNear.value.set(within?(seated?1.1:.8):0,within?(seated?2.4:.8):0);     // from a seat, the view of the stage is kept clear
  let n=crowd.n,walking=0,sp=0;const pa=sparks.geometry.attributes.position;
  for(const w of walkers){const u=(t-w.t0)/w.dur;if(u<=0||(u>=1&&!w.stay))continue;const p=stroll(w.path,u),bob=u<1&&!reduce?Math.abs(Math.sin(now*.011+w.ph*9))*.035:0;put(n++,w,p.x,p.y+bob,p.z,p.heading);if(w.guest)walking++;
   // a sparkler held over the head: a handful of bright points that never stay in place (one steady point when motion is to be spared)
   if(w.spark&&u>.02)for(let q=0;q<(reduce?1:10)&&sp<30;q++){const j=reduce?0:1;pa.setXYZ(sp++,p.x+(Math.random()-.5)*.2*j,p.y+2.02+Math.random()*.34*j,p.z+(Math.random()-.5)*.2*j);}}
  if(walkers.length||crowd.g.instanceCount!==n){crowd.at.needsUpdate=crowd.look.needsUpdate=crowd.col.needsUpdate=true;}
  crowd.g.instanceCount=n;sparks.geometry.setDrawRange(0,sp);if(sp)pa.needsUpdate=true;
  const text=(headcount.guests+walking)+'·'+headcount.staff;if(who.dataset.n!==text){who.dataset.n=text;who.children[0].lastChild.textContent=headcount.guests+walking;who.children[1].lastChild.textContent=headcount.staff;$('count').textContent=whole(headcount.guests+walking);}}
 // the tables on the map: the colour of their category; taken, they fade; the one in hand and the visitor's own beat
 ringT+=dt;rings.visible=tableMap;
 for(const tb of tables){const sel=tb===chosen,mine=tb.state==='mine',f=(tb.state==='taken'?.16:1.5)*(tb.tag.dim?.25:1)*(sel||mine||tb===order?1.6+.9*Math.sin(ringT*5):1);
  tb.ring.material.color.copy(mine?tmp.setRGB(1,.72,.3):tb.col).multiplyScalar(f);const sc=sel?1.12:1;tb.ring.scale.set(sc,sc,1);}
 if(sound){const g=sound.out.gain,to=m.vol*.5,inEntry=within&&['entry'].includes(rooms.find(r=>r.id===focused)?.kind);g.value+=(to-g.value)*k;sound.low.frequency.value+=((inEntry?380:18000)-sound.low.frequency.value)*k;}
 if(fx)fx.draw();else{renderer.render(scene,camera);stats.calls=renderer.info.render.calls;stats.triangles=renderer.info.render.triangles;}
 if(ready&&!drawn){drawn=true;tell('ready');}
 // From far, a table is a dot of the colour of its category and the zones are named; from near, the tables are named.
 const w=canvas.clientWidth,h=canvas.clientHeight,close=h/2/Math.tan(camera.fov*Math.PI/360)/Math.max(orbit.dist,1)>=TAGS;placed.length=0;
 for(const g of tags){v3.copy(g.pos).project(camera);
  const off=!g.show||!ready||(g.level&&!shown(g.level))||(g.gear&&(!gear.shown||(within&&g.room!==focused)))||(g.plan&&(orbit.pol>.45||(g.covered&&storey!=='L0')||(tableMap&&close)))||(g.table&&(!tableMap||within||(playing&&g.table!==order)))||(g.near&&orbit.dist>g.near)||v3.z>1||Math.abs(v3.x)>1.05||Math.abs(v3.y)>1.05;let x=(v3.x+1)/2*w,y=(1-v3.y)/2*h;
  if(g.table){const far=!close&&g.table!==chosen&&g.table.state!=='mine';if(far!==g.far){g.far=far;g.el.classList.toggle('far',far);}}
  if(g.gear&&!off){const half=(g.w||(g.w=g.el.offsetWidth))/2+3;                  // two labels never sit on each other: the later one steps up
   for(let q=0;q<4&&placed.some(p=>Math.abs(p[0]-x)<p[2]+half&&Math.abs(p[1]-y)<21);q++)y-=22;placed.push([x,y,half]);}
  g.el.style.opacity=off?0:g.dim?.22:1;g.el.style.pointerEvents=off?'none':'';g.el.style.transform=`translate(-50%,-50%) translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`;}
 requestAnimationFrame(frame);
}

// ---------- the model
async function load(){
 const info=await (await fetch('club/club.json')).json();
 for(const l of info.levels){levelY[l.id]=l.y;tops[l.id]=l.top+.02;}
 rooms=info.rooms;bySize=[...rooms].sort((a,b)=>a.area-b.area);tiers=info.tiers;booths=info.booths;poles=info.poles;bar=info.bar;hall=info.hall;stage=info.stage;
 if(info.light.order.join()!==channelList.slice(0,8).map(c=>c.id).join())throw Error('lighting channels of the model and of the page differ');
 U.uOpen.value.y=info.light.open;U.uBall.value.set(info.ball[0],info.ball[1],info.ball[2],0);
 for(const ch of info.channels){const c=circuits.get(ch.id);if(!c)continue;c.base.setRGB(...ch.color);c.color.copy(c.base);c.to.copy(c.base);c.scale=ch.scale||1;
  const dot=listEl.querySelector(`[data-circuit="${ch.id}"]`);if(dot)dot.style.setProperty('--c',css(ch.color.map(v=>Math.pow(clamp(v,0,1),1/2.2))));}
 centre.set(-22,1.6,stage.z);$('club-name').textContent=info.name;
 // who has a table tonight is drawn by lot (always the same draw); every category keeps a free one
 const r=mulberry(20261112),drawnLots=info.tables.map(t=>({...t,state:r()<.56?'taken':'free',booking:null}));
 for(const id of Object.keys(tiers)){const mine=drawnLots.filter(t=>t.tier===id);if(mine.length&&!mine.some(t=>t.state==='free'))mine[0].state='free';}
 // the way in: from the pavement through the lobby, past the desk, through the door of the room (it stands at an angle), between the booths
 {const cz=hall.corridor_z,[dx,dz]=hall.door_in;wayIn=[[-.6,0,cz],[-2.6,0,cz],[-5.6,0,cz+.7],[-9.6,0,cz+1.35],[-13,0,cz+.6],[dx+.67,0,dz-.6],[dx,0,dz],[dx-.67,0,dz+.6],[dx-1.4,0,dz+1.41],[-18.4,0,4.65],[-20.6,0,4.7]];}
 const gltf=await new GLTFLoader().loadAsync('club/'+info.model,e=>{if(e.total)loadingEl.textContent=`Chargement du club… ${Math.round(e.loaded/e.total*100)} %`;});
 const done=new Set();
 for(const o of [...gltf.scene.children]){if(!o.isMesh)continue;const m=o.material,about=info.materials[m.name]||{};
  if(!done.has(m)){done.add(m);for(const map of [m.map,m.emissiveMap])if(map)map.anisotropy=8;
   if(about.glass){m.transparent=true;m.depthWrite=false;m.roughness=.06;m.envMapIntensity=1.2;}else if(m.name!=='Wall cut')baked(m);
   if(about.channel){const c=circuits.get(about.channel),g={m,glow:shine(about),tint:about.tint};const a=/^Arch LED (\d+)$/.exec(m.name);if(a){g.arch={k:1};archMats[+a[1]]=g.arch;}c.mats.push(g);m.emissiveIntensity=0;}
   else if(about.glow>0)m.emissiveIntensity=shine(about);}
  if(o.userData.level==='F'){const a=o.geometry.attributes._lc;for(let i=0;i<a.count;i++)a.setX(i,0);}   // the street is in the night: no open sky on it
  if(m.name==='Wall cut')o.material=section;                             // where a wall is cut: one flat slate, whatever the light
  if(about.glass){o.renderOrder=2;o.userData.glass=true;}
  solid.push(o);o.matrixAutoUpdate=false;o.updateMatrix();part(o.userData.level,o.userData.layer).add(o);}
 tables=drawnLots;makeBeams(info.devices);makeSigns(info.signs,info.name);tablesUi();people();              // the tables come with the model: until then the frame has none to draw
 // the names of the zones, read from above; the equipment, read from near
 // (a zone that lies under the upper level is named only when the room is seen alone)
 for(const r of rooms)if(r.area>9&&r.kind!=='stair')tag(r.name,r.centre[0],r.y+.3,r.centre[1],{cls:'zone',plan:true,level:r.level}).covered=r.level==='L0'&&rooms.some(q=>q.level==='L1'&&inside(q.poly,r.centre[0],r.centre[1]));
 const text={speaker:d=>d.label+' · '+(ambience==='house'?'Veille':ambience==='show'?'102 dB':'96 dB'),projector:d=>d.label+' · '+(circuits.get('show').on?'Actif':'Veille'),camera:d=>d.label+' · Active',
  terminal:d=>d.label+' · '+(ambience==='house'?'Prête':'En service'),counter:d=>d.label+' · '+whole(headcount.guests),lock:d=>d.label+' · '+(door.locked?'Fermée':'Ouverte'),thermostat:d=>d.label+' · '+degrees(modes[ambience].temp-(d.level==='L1'?-.8:0)),
  smoke:d=>d.label+' · '+(circuits.get('show').on?'En marche':'Prête'),fridge:d=>d.label+' · 6,0 °C',dj:d=>d.label+' · '+(ambience==='house'?'Veille':BPM+' BPM'),screen:d=>d.label+' · '+(circuits.get('screens').on?'Allumé':'Éteint')};
 for(const d of info.devices){const g={d,text:()=>(text[d.type]||(q=>q.label))(d)};if(d.type==='lock')g.press=()=>{manual();setLock(!door.locked);};
  g.tag=tag(g.text(),d.pos[0],d.pos[1]+.28,d.pos[2],{cls:'gear',press:g.press,level:d.level,near:80,gear:true});gear.list.push(g);
  // the zone of an equipment: on foot, only those of the zone one stands in are named
  g.tag.room=rooms.filter(r=>r.level===d.level).map(r=>[inside(r.poly,d.pos[0],d.pos[2])?0:gap(r.poly,d.pos[0],d.pos[2]),r.id]).sort((a,b)=>a[0]-b[0])[0]?.[1];}
 ready=true;loadingEl.classList.add('gone');
 // A link can ask for an ambience, a level, the plan, a zone, a visit on foot, a table and its seat:
 // ?mode=house|evening|show, ?niveau=L0|L1|all, ?plan, ?piece=l0-salle (&visite), ?table=N204 (&place)
 mode(modes[Q.get('mode')]?Q.get('mode'):'evening',true);
 const asked=Q.get('niveau'),room=rooms.find(r=>r.id===Q.get('piece')),tb=tables.find(t=>t.id===Q.get('table'));
 if(asked&&(asked==='all'||levelIds.includes(asked))){touched=true;setStorey(asked,true);}
 if(tb){touched=true;orbit.az=HOME;if(Q.has('place'))sit(tb.id);else{flyTo(homeOf(storey),1);selectTable(tb.id);}chips();return;}
 if(room){touched=true;focused=room.id;back.hidden=false;stepEl.hidden=false;orbit.az=HOME;flyTo(view(room),reduce?1:2200);chips();
  if(Q.has('visite'))setTimeout(()=>{if(focused===room.id&&!within&&!playing)stepIn(true);},reduce?60:1600);return;}
 if(Q.has('plan')){touched=true;setPlan(true,true);if(asked==='all')setStorey('all',true);flyTo(planOf(),reduce?1:1600);chips();return;}
 chips();
 // The club is first seen whole, from above; then the view comes down to it.
 setTimeout(()=>{if(!playing&&!focused&&!planView&&!within)flyTo(homeOf(storey),reduce?1:2600);},reduce?0:500);
}
orbit.target.copy(centre);orbit.dist=clamp(96/Math.min(1.6,camera.aspect),70,160);place();refresh();requestAnimationFrame(frame);
load().catch(error=>{console.error(error);failed();});
// Used by the page's own checks.
window.parks3d={orbit,camera,eye,flyTo,lookFrom,homeOf,planOf,enter,leave,stepIn,step,standOf,modes,scenes,circuits,U,crowd,beams,pace,headcount,toggle,set,mode,setStorey,setPlan,setGear,setMap,setLock,setSound,selectTable,sit,book,cancel,play,stop,
 get within(){return within;},get focused(){return focused;},get storey(){return storey;},get rooms(){return rooms;},get tables(){return tables;},get chosen(){return chosen;},get ambience(){return ambience;},get ready(){return ready;},get playing(){return playing;},get glow(){return !!fx;},
 info:()=>({calls:stats.calls,triangles:stats.triangles,textures:renderer.info.memory.textures,geometries:renderer.info.memory.geometries,people:crowd.g.instanceCount})};
