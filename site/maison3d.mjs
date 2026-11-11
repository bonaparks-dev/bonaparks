// The pilot house in three dimensions. Built from boxes, to the measures read on the straight render of the
// property (studio-overview-projection.mjs space: 1000 x 1000 over 4096 x 2560 px, about 120 px per metre).
// Drag to turn around it, pinch or wheel to zoom, touch a room to enter it, touch a lamp to switch it.
// Everything is simulated: nothing is measured, tracked or controlled.
import * as T from './vendor/three.module.min.js';

const canvas=document.getElementById('view'),stageEl=document.getElementById('scene'),labelsEl=document.getElementById('labels');
const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
const X=u=>(u-470)*0.03396,Z=v=>(v-470)*0.021227;            // render units to metres, the house near the middle
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),ease=t=>t*t*(3-2*t);

const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;
const scene=new T.Scene(),camera=new T.PerspectiveCamera(32,1,.5,400);
const sky=new T.HemisphereLight(0x8fa4ff,0x262b4a,1),sun=new T.DirectionalLight(0xfff1d6,0);sun.position.set(-14,30,12);scene.add(sky,sun);

// ---------- building blocks
const mats=new Map(),mat=(color,o={})=>{const k=color+JSON.stringify(o);if(!mats.has(k))mats.set(k,new T.MeshStandardMaterial({color,roughness:.86,metalness:0,...o}));return mats.get(k);};
const house=new T.Group();scene.add(house);
/** A box over a rectangle of the render, from y0 up to y0 + h metres. */
function box(u0,v0,u1,v1,h,y0,color,o){const w=Math.abs(X(u1)-X(u0)),d=Math.abs(Z(v1)-Z(v0)),m=new T.Mesh(new T.BoxGeometry(w,h,d),typeof color==='number'?mat(color,o):color);m.position.set((X(u0)+X(u1))/2,y0+h/2,(Z(v0)+Z(v1))/2);house.add(m);return m;}
const cyl=(u,v,r,h,y0,color,o)=>{const m=new T.Mesh(new T.CylinderGeometry(r,r,h,20),mat(color,o));m.position.set(X(u),y0+h/2,Z(v));house.add(m);return m;};
const WALL=1.25,wall=(u0,v0,u1,v1,h=WALL)=>box(u0,v0,u1,v1,h,0,0xe6ebf4);
const T_=3;                                                     // wall thickness, in render units across (0.1 m)
const wallH=(u0,u1,v,h)=>wall(u0,v-2.4,u1,v+2.4,h),wallV=(u,v0,v1,h)=>wall(u-T_/2,v0,u+T_/2,v1,h);

// ---------- the land
box(0,60,1000,950,.3,-.3,0x24352a);                                              // the plot
const lawn=box(10,66,990,945,.06,0,0x4f8f3e);lawn.userData.room='garden';
box(47,66,294,612,.07,0,0xb9b2a3);box(294,66,985,205,.07,0,0xb9b2a3);              // gravel: entrance and the lane behind the hedge
box(288,205,616,692,.09,0,0xc9c6bf);box(674,680,952,925,.09,0,0xc9c6bf);box(600,640,690,700,.09,0,0xc9c6bf);   // paving round the house and the pool
for(const [a,b,c,d] of [[0,60,1000,68],[0,942,1000,950],[0,60,8,950],[992,60,1000,950]])box(a,b,c,d,.7,0,0xd9d5cc);     // boundary wall
const hedge=(a,b,c,d,h=1.1)=>box(a,b,c,d,h,0,0x2f6d36,{roughness:1});
hedge(12,205,44,940);hedge(44,915,985,940);hedge(955,215,985,915);hedge(314,196,985,214,1.3);                         // hedges, the back one at the gate
wallH(47,84,200,1);wallH(174,300,200,1);                                                                             // the wall each side of the gate
const tree=(u,v,s=1)=>{cyl(u,v,.12*s,1.4*s,0,0x6b4a32);const m=new T.Mesh(new T.IcosahedronGeometry(1.05*s,1),mat(0x3b8742,{roughness:1,flatShading:true}));m.position.set(X(u),1.9*s,Z(v));house.add(m);};
tree(270,150,1);tree(262,330,.9);tree(262,430,.9);tree(640,700,.7);tree(600,772,.7);
// carport: four posts and a slatted roof
for(const v of [215,600])for(const u of [52,112])cyl(u,v,.07,2.2,0,0xc9a36b);
for(let v=220;v<600;v+=28)box(50,v,114,v+14,.06,2.2,0xd8b98a);
// gazebo by the pool
for(const [u,v] of [[578,645],[612,645],[578,690],[612,690]])cyl(u,v,.06,2.3,0,0xc9a36b);
{const m=new T.Mesh(new T.ConeGeometry(1.25,.5,4),mat(0xf1ece2,{flatShading:true}));m.position.set(X(595),2.55,Z(667));m.rotation.y=Math.PI/4;house.add(m);}

// ---------- the house: ground floor, walls cut at 1.25 m
const rooms={
 kitchen:{name:'Cuisine',rect:[329,227,449,315],floor:0xd7d9dd},
 living:{name:'Séjour',rect:[449,227,569,463],floor:0xd7d9dd},
 hall:{name:'Entrée',rect:[385,315,449,463],floor:0xd7d9dd},
 bath:{name:'Salle d’eau',rect:[329,315,385,463],floor:0xbccbd9},
 laundry:{name:'Buanderie',rect:[329,469,569,581],floor:0xc98b6c},
 terrace:{name:'Terrasse',rect:[300,581,570,690],floor:0xcbc7bf},
 garden:{name:'Jardin',rect:[640,230,950,660]},
 pool:{name:'Piscine',rect:[690,690,940,880]},
 entry:{name:'Entrée du terrain',rect:[50,90,290,600]}
};
for(const [id,r] of Object.entries(rooms)){if(!r.floor)continue;const [a,b,c,d]=r.rect,m=box(a,b,c,d,.04,.09,r.floor);m.userData.room=id;}
wallH(325,573,224);wallV(327,224,584);wallV(571,224,584);                      // back, left, right
wallH(325,497,466);wallH(541,573,466);                                          // between the living room and the laundry, with its door
wallV(385,315,400);wallV(385,430,466);wallH(327,385,315);                       // the shower room, with its door
// outside stairs to the upper floor
for(let i=0;i<14;i++)box(574,640-i*24,612,640-i*24+24,.19*(i+1),0,0xdcdfe6);
// kitchen: worktop along the back wall, hob, sink, and the fridge beside the sink
box(331,229,426,258,.9,0,0xf1f3f6);box(352,231,378,256,.03,.9,0x1d2530);box(388,232,412,254,.04,.9,0xaab4bf,{metalness:.6,roughness:.3});
box(428,229,449,258,1.85,0,0xc9d0d8,{metalness:.35,roughness:.4});
// dining table and chairs
box(478,330,506,398,.06,.72,0xc89a62);for(const [u,v] of [[481,334],[503,334],[481,394],[503,394]])cyl(u,v,.04,.72,0,0x9a744a);
for(const [u,v] of [[468,348],[468,380],[516,348],[516,380]])box(u-7,v-10,u+7,v+10,.45,0,0xb78752);
// sofa, low table, TV
box(540,300,566,400,.42,0,0x9aa6b8);box(558,300,566,400,.4,.42,0x8794a8);box(538,288,566,300,.62,0,0x8794a8);box(538,400,566,412,.62,0,0x8794a8);
box(514,338,530,372,.36,0,0xb78752);
box(486,229,522,244,.5,0,0x9b7a55);box(488,230,520,233,.55,.55,0x10151d,{emissive:0x3d6cff,emissiveIntensity:0});
// shower room
box(333,345,358,395,.82,0,0xd9b98f);box(336,352,355,388,.1,.82,0xffffff);box(333,412,352,446,.42,0,0xffffff);box(331,318,352,340,.05,.13,0xa8c7dc);
// laundry: sink, washing machine, bar and stools on the terrace side
box(333,472,362,500,.82,0,0xd9b98f);box(336,476,359,496,.1,.82,0xffffff);box(368,472,392,502,.85,0,0xf2f4f6);
box(333,576,430,588,1.05,0,0xe2ddd4);for(const u of [352,380,408])cyl(u,600,.17,.65,0,0x3f8e94);
box(432,604,472,640,.06,.72,0xb5895a);for(const [u,v] of [[435,607],[469,607],[435,637],[469,637]])cyl(u,v,.04,.72,0,0x8a6944);

// ---------- pool with a rounded end, and the spa
const basin=g=>{const s=new T.Shape(),x0=X(760),x1=X(903)+g,z0=Z(723)-g,z1=Z(846)+g,r=(z1-z0)/2,c=.35+g;s.moveTo(x0,-z1);s.absarc(x0,-(z0+z1)/2,r,-Math.PI/2,Math.PI/2,true);s.lineTo(x1-c,-z0);s.quadraticCurveTo(x1,-z0,x1,-z0-c);s.lineTo(x1,-z1+c);s.quadraticCurveTo(x1,-z1,x1-c,-z1);s.lineTo(x0,-z1);return new T.ShapeGeometry(s,40);};
const rim=new T.Mesh(basin(.32),mat(0xe9e6df));rim.rotation.x=-Math.PI/2;rim.position.y=.13;house.add(rim);
const water=new T.Mesh(basin(0),new T.MeshStandardMaterial({color:0x2aa7df,roughness:.25,emissive:0x1fb6ff,emissiveIntensity:.15}));water.rotation.x=-Math.PI/2;water.position.y=.16;water.userData.room='pool';house.add(water);
cyl(801,683,.95,.55,0,0xe9e6df);const spa=cyl(801,683,.72,.05,.53,0x38b8e6,{roughness:.25,emissive:0x1fb6ff,emissiveIntensity:.15});

// ---------- gate and car
const gate={open:0,target:0,leaves:[]};
for(const u of [84,174])box(u-4,194,u+4,206,1.5,0,0xd9d5cc);
for(const side of [0,1]){const pivot=new T.Group();pivot.position.set(X(side?174:84),0,Z(200));const w=(X(174)-X(84))/2-.06,m=new T.Mesh(new T.BoxGeometry(w,1.2,.07),mat(0xa8845a));m.position.set(side?-w/2:w/2,.72,0);m.userData.gate=true;pivot.add(m);house.add(pivot);gate.leaves.push(pivot);}
const car=new T.Group();{const b=new T.Mesh(new T.BoxGeometry(1.75,.55,4.2),mat(0x2f4f86,{roughness:.45,metalness:.3}));b.position.y=.6;const c=new T.Mesh(new T.BoxGeometry(1.55,.5,2.1),mat(0x16233a,{roughness:.3}));c.position.set(0,1.1,-.2);car.add(b,c);
 for(const [x,z] of [[-.85,1.3],[.85,1.3],[-.85,-1.3],[.85,-1.3]]){const w=new T.Mesh(new T.CylinderGeometry(.33,.33,.22,16),mat(0x15181d));w.rotation.z=Math.PI/2;w.position.set(x,.33,z);car.add(w);}
 for(const x of [-.6,.6]){const l=new T.Mesh(new T.BoxGeometry(.32,.14,.05),new T.MeshBasicMaterial({color:0xfff3cf}));l.position.set(x,.68,2.11);car.add(l);}
 car.position.set(X(178),0,Z(520));house.add(car);}

// ---------- lamps: a ball on its wire is the switch, and it really lights the room
const halo=(()=>{const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d'),r=g.createRadialGradient(64,64,0,64,64,64);r.addColorStop(0,'rgba(255,236,190,1)');r.addColorStop(.25,'rgba(255,214,140,.55)');r.addColorStop(1,'rgba(255,200,120,0)');g.fillStyle=r;g.fillRect(0,0,128,128);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;})();
const lampList=[
 {id:'kitchen',name:'Cuisine',at:[388,272],h:1.9,power:9},{id:'living',name:'Séjour',at:[530,345],h:1.9,power:12},{id:'dining',name:'Salle à manger',at:[492,364],h:1.7,power:9},
 {id:'bath',name:'Salle d’eau',at:[357,392],h:1.9,power:7},{id:'laundry',name:'Buanderie',at:[440,522],h:1.9,power:11},{id:'terrace',name:'Terrasse',at:[450,632],h:2,power:11},
 {id:'stairs',name:'Escalier extérieur',at:[593,470],h:3.1,power:8},{id:'entry',name:'Portail',at:[129,235],h:1.7,power:12},{id:'garage',name:'Garage',at:[82,400],h:2,power:11},
 {id:'garden1',name:'Jardin · haut',at:[760,300],h:.7,power:9,low:true},{id:'garden2',name:'Jardin · bas',at:[850,560],h:.7,power:9,low:true},{id:'gazebo',name:'Gazebo',at:[595,667],h:2,power:8},
 {id:'pool',name:'Piscine',at:[830,784],h:-.5,power:14,cool:true}
];
const lamps=new Map(),hits=[];
for(const def of lampList){
 const g=new T.Group(),x=X(def.at[0]),z=Z(def.at[1]);g.position.set(x,def.h,z);
 const ball=new T.Mesh(new T.SphereGeometry(def.low?.14:.17,24,16),new T.MeshBasicMaterial({color:0x7d8796}));
 const glow=new T.Sprite(new T.SpriteMaterial({map:halo,color:def.cool?0x7fe3ff:0xffffff,transparent:true,opacity:0,depthWrite:false,blending:T.AdditiveBlending}));glow.scale.setScalar(def.cool?5:2.6);
 const light=new T.PointLight(def.cool?0x58d4ff:0xffd9a0,0,def.cool?9:8.5,1.6);
 if(def.cool){ball.visible=false;}else if(def.low){const stake=new T.Mesh(new T.CylinderGeometry(.03,.03,def.h,8),mat(0x1a1f27));stake.position.y=-def.h/2;g.add(stake);}
 else{const wire=new T.Mesh(new T.CylinderGeometry(.012,.012,1.1,6),mat(0x0b0e13));wire.position.y=.55+.17;g.add(wire);}
 const hit=new T.Mesh(new T.SphereGeometry(def.cool?1.6:.5,12,8),new T.MeshBasicMaterial({visible:false}));hit.userData.lamp=def.id;
 g.add(ball,glow,light,hit);house.add(g);hits.push(hit);
 lamps.set(def.id,{...def,group:g,ball,glow,light,on:false,level:0,pulse:0});
}

// ---------- small labels, as on a dashboard: a few readings, no more
const tags=[];
function tag(text,u,v,h,o={}){const el=document.createElement(o.press?'button':'span');el.className='tag'+(o.alert?' alert':'')+(o.press?' press':'');el.textContent=text;if(o.press)el.addEventListener('click',o.press);labelsEl.append(el);const t={el,pos:new T.Vector3(X(u),h,Z(v))};tags.push(t);return t;}
const gateTag=tag('Portail · Fermé',129,200,2.1,{press:()=>toggleGate()});
tag('24,5°',500,290,1.9);tag('68 %',345,425,1.7);const motionTag=tag('Mouvement',880,430,1.2,{alert:true});

// ---------- the camera: an orbit with inertia
const orbit={target:new T.Vector3(X(470),.4,Z(470)),az:0,pol:.06,dist:52,vaz:0,vpol:0};
const home={target:new T.Vector3(X(500),.4,Z(500)),az:-.62,pol:.9,dist:40};
let fly=null,focused=null;
function flyTo(to,ms=1300){fly={from:{target:orbit.target.clone(),az:orbit.az,pol:orbit.pol,dist:orbit.dist},to:{...to,target:to.target.clone()},t0:performance.now(),ms:reduce?1:ms};orbit.vaz=orbit.vpol=0;}
function place(){const s=Math.sin(orbit.pol),c=Math.cos(orbit.pol);camera.position.set(orbit.target.x+orbit.dist*s*Math.sin(orbit.az),orbit.target.y+orbit.dist*c,orbit.target.z+orbit.dist*s*Math.cos(orbit.az));camera.up.set(0,1,0);camera.lookAt(orbit.target);if(orbit.pol<.02){camera.up.set(-Math.sin(orbit.az),0,-Math.cos(orbit.az));camera.lookAt(orbit.target);}}
function resize(){const w=stageEl.clientWidth,h=stageEl.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();home.dist=clamp(40*Math.max(1,1.35/camera.aspect),38,120);}
addEventListener('resize',resize);resize();

const pointers=new Map();let moved=0,pinch=0,lastTap=null;
canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});moved=0;fly=null;canvas.classList.add('dragging');hint();});
canvas.addEventListener('pointermove',e=>{
 const p=pointers.get(e.pointerId);
 if(!p){const hit=pick(e);canvas.classList.toggle('over',!!hit);return;}
 const dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;moved+=Math.abs(dx)+Math.abs(dy);
 if(pointers.size===2){const [a,b]=[...pointers.values()],d=Math.hypot(a.x-b.x,a.y-b.y);if(pinch)orbit.dist=clamp(orbit.dist*pinch/d,7,130);pinch=d;pan(dx/2,dy/2);return;}
 if(e.buttons===2||e.shiftKey){pan(dx,dy);return;}
 orbit.vaz=-dx*.0052;orbit.vpol=-dy*.0042;orbit.az+=orbit.vaz;orbit.pol=clamp(orbit.pol+orbit.vpol,.03,1.2);
});
function pan(dx,dy){const k=orbit.dist*.0011,right=new T.Vector3(Math.cos(orbit.az),0,-Math.sin(orbit.az)),fwd=new T.Vector3(Math.sin(orbit.az),0,Math.cos(orbit.az));orbit.target.addScaledVector(right,-dx*k).addScaledVector(fwd,-dy*k);orbit.target.x=clamp(orbit.target.x,-17,18);orbit.target.z=clamp(orbit.target.z,-9,10);}
const release=e=>{if(!pointers.has(e.pointerId))return;pointers.delete(e.pointerId);pinch=0;canvas.classList.toggle('dragging',pointers.size>0);if(moved<6&&e.type==='pointerup')tap(e);};
canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);
canvas.addEventListener('wheel',e=>{e.preventDefault();fly=null;orbit.dist=clamp(orbit.dist*Math.exp(e.deltaY*.0012),7,130);hint();},{passive:false});
canvas.addEventListener('contextmenu',e=>e.preventDefault());

// ---------- touching things
const ray=new T.Raycaster(),ndc=new T.Vector2();
function pick(e){const r=canvas.getBoundingClientRect();ndc.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(ndc,camera);
 const lamp=ray.intersectObjects(hits,false)[0];if(lamp)return {lamp:lamp.object.userData.lamp};
 for(const h of ray.intersectObjects(house.children,true)){const d=h.object.userData;if(d.gate)return {gate:true};if(d.room)return {room:d.room};}
 return null;}
function tap(e){const hit=pick(e);if(!hit)return;if(hit.lamp)toggle(hit.lamp);else if(hit.gate)toggleGate();else if(hit.room)enter(hit.room);}
function enter(id){const r=rooms[id];if(!r)return;if(focused===id){leave();return;}focused=id;const [a,b,c,d]=r.rect,w=Math.abs(X(c)-X(a)),dz=Math.abs(Z(d)-Z(b));
 flyTo({target:new T.Vector3((X(a)+X(c))/2,.6,(Z(b)+Z(d))/2),az:orbit.az,pol:clamp(orbit.pol,.55,.85),dist:clamp(Math.max(w,dz)*2.6/Math.min(1,camera.aspect),11,34)});
 back.hidden=false;say(`<b>${r.name}</b>`);}
function leave(){focused=null;back.hidden=true;flyTo(home);}
const back=document.getElementById('back');back.addEventListener('click',leave);

// ---------- state: lamps, gate, ambiance
const toast=document.getElementById('toast'),statusEl=document.getElementById('status'),listEl=document.getElementById('list');let toastTimer=0;
function say(html){toast.innerHTML=html;toast.classList.add('on');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('on'),1900);}
function status(){const n=[...lamps.values()].filter(l=>l.on).length;statusEl.textContent=`${n} lumière${n>1?'s':''} allumée${n>1?'s':''} · Portail ${gate.target?'ouvert':'fermé'} · 24,5°`;
 for(const b of listEl.querySelectorAll('button'))b.setAttribute('aria-pressed',String(lamps.get(b.dataset.lamp).on));}
function set(id,on,quiet){const l=lamps.get(id);if(!l||l.on===on)return;l.on=on;l.pulse=1;if(!quiet)say(`${l.name} · <b>${on?'Allumée':'Éteinte'}</b>`);status();}
const toggle=id=>set(id,!lamps.get(id).on);
function toggleGate(){gate.target=gate.target?0:1;gateTag.el.textContent='Portail · '+(gate.target?'Ouvert':'Fermé');say(`Portail · <b>${gate.target?'Ouvert':'Fermé'}</b>`);status();}
for(const l of lampList){const li=document.createElement('li');li.innerHTML=`<button data-lamp="${l.id}" aria-pressed="false"><i></i><span>${l.name}</span></button>`;li.firstChild.addEventListener('click',()=>toggle(l.id));listEl.append(li);}
const modes={day:{night:0,on:[]},evening:{night:1,on:['kitchen','living','dining','laundry','terrace','garden1','garden2','pool','entry']},night:{night:1,on:['entry']}};
let night=1,nightTarget=1;
function mode(name,quiet){const m=modes[name];nightTarget=m.night;for(const id of lamps.keys())set(id,m.on.includes(id),true);stageEl.classList.toggle('day',!m.night);
 for(const b of document.querySelectorAll('[data-mode]'))b.setAttribute('aria-pressed',String(b.dataset.mode===name));
 if(!quiet)say({day:'Bonjour · <b>Lumière du jour</b>',evening:'Soirée · <b>Lumières douces</b>',night:'Bonne nuit · <b>Tout s’éteint</b>'}[name]);status();}
for(const b of document.querySelectorAll('[data-mode]'))b.addEventListener('click',()=>mode(b.dataset.mode));
const hintEl=document.getElementById('hint');let hinted=false;function hint(){if(hinted)return;hinted=true;setTimeout(()=>hintEl.classList.add('gone'),2500);}
addEventListener('keydown',e=>{if(e.key==='Escape'&&focused)leave();});

// ---------- every frame
const v3=new T.Vector3();let last=performance.now();
function frame(now){
 const dt=Math.min(.05,(now-last)/1000);last=now;
 if(fly){const k=ease(clamp((now-fly.t0)/fly.ms,0,1)),a=fly.from,b=fly.to;orbit.target.lerpVectors(a.target,b.target,k);orbit.az=a.az+(b.az-a.az)*k;orbit.pol=a.pol+(b.pol-a.pol)*k;orbit.dist=a.dist+(b.dist-a.dist)*k;if(k>=1)fly=null;}
 else if(!pointers.size&&!reduce){orbit.az+=orbit.vaz;orbit.pol=clamp(orbit.pol+orbit.vpol,.03,1.2);const f=Math.pow(.0015,dt);orbit.vaz*=f;orbit.vpol*=f;}
 place();
 night+=(nightTarget-night)*Math.min(1,dt*2.2);
 sky.intensity=1.3+1.1*(1-night);sky.color.setHex(0x8fa4ff).lerp(new T.Color(0xffffff),1-night);sun.intensity=2.6*(1-night);renderer.toneMappingExposure=.92+.12*(1-night);
 for(const l of lamps.values()){
  l.level+=((l.on?1:0)-l.level)*Math.min(1,dt*(reduce?60:5));l.pulse*=Math.pow(.004,dt);
  const k=l.level;l.light.intensity=l.power*.42*k*(.35+.65*night);l.glow.material.opacity=k*(l.cool?.5:.95)*(.45+.55*night);
  l.ball.material.color.setRGB(.49+.51*k,.53+.42*k,.59+.19*k);l.ball.scale.setScalar(1+.45*l.pulse);
 }
 water.material.emissiveIntensity=.12+.9*lamps.get('pool').level;spa.material.emissiveIntensity=.12+.7*lamps.get('pool').level;
 gate.open+=(gate.target-gate.open)*Math.min(1,dt*(reduce?60:2.6));gate.leaves[0].rotation.y=gate.open*Math.PI/2*-1;gate.leaves[1].rotation.y=gate.open*Math.PI/2;
 renderer.render(scene,camera);
 const w=canvas.clientWidth,h=canvas.clientHeight;
 for(const t of tags){v3.copy(t.pos).project(camera);const off=v3.z>1||Math.abs(v3.x)>1.05||Math.abs(v3.y)>1.05;t.el.style.opacity=off?0:1;t.el.style.transform=`translate(-50%,-50%) translate(${((v3.x+1)/2*w).toFixed(1)}px,${((1-v3.y)/2*h).toFixed(1)}px)`;}
 motionTag.el.style.visibility=night>.5?'visible':'hidden';
 requestAnimationFrame(frame);
}
mode('evening',true);place();requestAnimationFrame(frame);
// The house is first seen from above, like a plan, then the view comes down to three quarters.
setTimeout(()=>flyTo(home,reduce?1:2600),reduce?0:500);
// Used by the page's own checks.
window.parks3d={orbit,flyTo,home,enter,leave,toggle,mode,toggleGate};
