// The Business space of Parks 3D: a rooftop bar in three dimensions.
// The model is the clean rebuild of a 3D scan (walls, furniture and planting measured on it), loaded as one file:
// business/rooftop.glb, with business/rooftop.json for its areas and light circuits. Axes: x east, y up, z south, metres.
// Drag to turn around it, pinch or wheel to zoom, touch an area to go there.
// Everything that moves or lights up is simulated: nothing is measured, tracked or controlled.
import * as T from './vendor/three.module.min.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';

const $=id=>document.getElementById(id);
// Inside the Bonaparks app the same page is shown: ?app hides the way back to the site, ?vue=scene keeps the rooftop alone.
{const q=new URLSearchParams(location.search),root=document.documentElement;root.classList.toggle('in-app',q.has('app'));root.classList.toggle('only-scene',q.get('vue')==='scene');}
const canvas=$('view'),stageEl=$('scene'),labelsEl=$('labels'),loadingEl=$('loading');
// Inside the app, the page says when the rooftop is drawn or when it cannot be, so the app can show something else.
const tell=word=>{try{window.webkit?.messageHandlers?.parks3d?.postMessage(word);}catch{}};
let drawn=false;const failed=()=>{if(drawn)return;tell('failed');loadingEl.textContent='Le rooftop ne peut pas s’afficher sur cet appareil.';loadingEl.classList.add('failed');loadingEl.classList.remove('gone');};
addEventListener('error',failed);addEventListener('unhandledrejection',failed);
const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),ease=t=>t*t*(3-2*t),between=(t,a,b)=>ease(clamp((t-a)/(b-a),0,1));

let renderer;try{renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true});}catch(error){failed();throw error;}
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();failed();});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
const scene=new T.Scene(),camera=new T.PerspectiveCamera(32,1,.5,500);
const centre=new T.Vector3(-7.5,.4,10.6);                                   // middle of the terrace
const sky=new T.HemisphereLight(0x8fa4ff,0x262b4a,1),sun=new T.DirectionalLight(0xfff1d6,0);
const small=Math.min(innerWidth,innerHeight)<500;
sun.position.set(centre.x-20,34,centre.z+19);sun.target.position.copy(centre);sun.castShadow=true;sun.shadow.mapSize.set(small?1024:2048,small?1024:2048);sun.shadow.bias=-.0005;sun.shadow.normalBias=.05;sun.shadow.radius=4;
Object.assign(sun.shadow.camera,{left:-27,right:27,top:19,bottom:-19,near:1,far:100});sun.shadow.camera.updateProjectionMatrix();scene.add(sky,sun,sun.target);
// A plain sky to mirror in the steel, the glass and the bottles.
{const pm=new T.PMREMGenerator(renderer),env=new T.Scene(),g=new T.SphereGeometry(40,24,12),p=g.attributes.position,c=[],top=new T.Color(0x9fb6e0),mid=new T.Color(0xd8dde6),low=new T.Color(0x23262e),k=new T.Color();
 for(let i=0;i<p.count;i++){const h=p.getY(i)/40;k.copy(h>0?mid:low).lerp(h>0?top:low,Math.min(1,Math.abs(h)*1.4));c.push(k.r,k.g,k.b);}
 g.setAttribute('color',new T.Float32BufferAttribute(c,3));env.add(new T.Mesh(g,new T.MeshBasicMaterial({vertexColors:true,side:T.BackSide})));
 scene.environment=pm.fromScene(env,.03).texture;scene.environmentIntensity=.2;pm.dispose();g.dispose();}

const rooftop=new T.Group();scene.add(rooftop);
const mats=new Map(),mat=(color,o={})=>{const k=color+JSON.stringify(o);if(!mats.has(k))mats.set(k,new T.MeshStandardMaterial({color,roughness:.8,metalness:0,...o}));return mats.get(k);};
const halo=(()=>{const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d'),r=g.createRadialGradient(64,64,0,64,64,64);r.addColorStop(0,'rgba(255,240,205,1)');r.addColorStop(.22,'rgba(255,214,140,.5)');r.addColorStop(1,'rgba(255,200,120,0)');g.fillStyle=r;g.fillRect(0,0,128,128);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;})();

// ---------- the eight light circuits of the dashboard. mats: lit surfaces of the model; glow: bulbs listed in the manifest;
// lights: [x, y, z, power, colour] of the lamps that really light the place.
const circuitList=[
 {id:'festoon',name:'Guirlandes',mats:['Light festoon'],glow:['festoon'],lights:[[-21.5,2.3,14.3,10],[-13.5,2.3,14.3,10],[-5.5,2.3,14.3,10],[3,2.3,14.3,10],[9.5,1.7,11,8]],color:0xffc88a},
 {id:'wash',name:'Fresques',mats:['Light wash'],lights:[[-20.5,3,7.9,13],[-12.5,3,7.9,13],[-4.5,3,7.9,13],[5.6,4.1,8.2,15]],color:0xffe4c0},
 {id:'bar',name:'Bar',tone:'violet',mats:['Light bar glow','Light bar shelf','Light fridge'],lights:[[-10.7,.55,9.95,8,0x8a5cff],[-11,2.2,7.3,9,0xffc98a]]},
 {id:'entrance',name:'Entrée',tone:'violet',mats:['Light neon pink','Light neon cyan','Light hall'],lights:[[-.05,3.4,-2.2,15,0x7a45ff],[-.05,2.2,5.9,7,0x8a55ff]]},
 {id:'stage',name:'Scène',tone:'orange',mats:['Light stage'],lights:[[-24.1,1.4,10.6,11,0xff7a2a]]},
 {id:'lounge',name:'Salon',tone:'teal',mats:[],lights:[[-3.9,.8,7.1,10,0x35e0b0]]},
 {id:'candles',name:'Bougies et cocons',mats:['Light lantern','Light pod'],glow:['candles','pods'],lights:[[5.2,1.1,8.4,5,0xffb46a],[7.6,.9,12.4,5,0xffb46a]]},
 {id:'fairy',name:'Mâts et palmiers',tone:'orange',mats:['Light fairy'],lights:[[9.9,.7,11,9,0xff8a3c]]}
];
const strength={'Light bar glow':.95,'Light fridge':.9,'Light stage':1.5,'Light neon pink':2.1,'Light neon cyan':1.5,'Light hall':2.2,'Light bar shelf':1.7};
const circuits=new Map();
for(const def of circuitList){
 const lights=def.lights.map(([x,y,z,power,color])=>{const l=new T.PointLight(color??def.color??0xffd9a0,0,10,1.6);l.position.set(x,y,z);l.userData.power=power;rooftop.add(l);return l;});
 circuits.set(def.id,{...def,lights,materials:[],glows:[],on:false,level:0});
}

// ---------- areas, as in the manifest: [x0, z0, x1, z1] on the floor
let zones={};const zoneOrder=['stage','bar','lounge','entrance','sunset','vip','terrace'];
const zoneAt=(x,z)=>zoneOrder.find(id=>{const r=zones[id]?.rect;return r&&x>=r[0]&&x<=r[2]&&z>=r[1]&&z<=r[3];});

// ---------- people, drawn as in the house: a ring on the floor under each. Simulated.
const halo3=(r,color)=>{const ring=new T.Mesh(new T.TorusGeometry(r,.028,8,40),new T.MeshBasicMaterial({color}));ring.rotation.x=Math.PI/2;ring.position.y=.13;return ring;};
function figure(shirt,hair,size=1,long=false,ring=0x9fd8ff,legs=0x2f3f5c){const g=new T.Group(),m=(geo,c,y)=>{const k=new T.Mesh(geo,mat(c));k.position.y=y*size;k.castShadow=true;g.add(k);return k;};
 m(new T.CapsuleGeometry(.17*size,.5*size,6,12),legs,.5);m(new T.CapsuleGeometry(.2*size,.42*size,6,12),shirt,1.08);m(new T.SphereGeometry(.15*size,18,14),0xe8c0a2,1.56);
 const h=m(new T.SphereGeometry(.165*size,18,14),hair,1.6);h.scale.set(1,long?1.05:.85,1);h.position.z=-.03*size;if(long)h.position.y-=.05*size;g.add(halo3(.42*size,ring));g.userData.tall=1.78*size;return g;}
const guestSpots=[[-12.2,9.72,3.14],[-10.3,9.75,3.3],[-4.6,9.05,2.6],[5.7,10.1,.6],[-13.1,12.3,-1.9],[-9.3,9.7,2.9],[-2.1,9.7,3.4],[3.1,11.3,.9],[-19.3,10.5,-2.4],[-7.3,13.25,0],[-21.2,11.0,-.9]];
const shirts=[0x6fb5a0,0xe88f6f,0x7aa2e3,0xf2c14e,0xd77fa1,0x9a8fe0,0xe6e2d6,0x4fa3a5,0xc95f4a,0x86b56a,0xb7bcc8],hairs=[0x4a3326,0x2c1f18,0x6b4a2f,0x3a2a20,0x8a6a3c,0x1d1a18];
const guests=guestSpots.map(([x,z,a],i)=>{const node=figure(shirts[i%shirts.length],hairs[i%hairs.length],.94+(i%3)*.04,i%2===1);node.position.set(x,0,z);node.rotation.y=a;rooftop.add(node);return {node,label:'Client',x,z,a};});
const staffShirt=0x16181d;
const barman={node:figure(staffShirt,0x2c1f18,1,false,0xffd98a,0x16181d),label:'Équipe',a:[-12.4,7.6],b:[-9.5,7.6],every:8,staff:true};
const waiter={node:figure(staffShirt,0x4a3326,.97,true,0xffd98a,0x16181d),label:'Équipe',a:[-20.5,10.6],b:[6.6,10.75],every:26,staff:true};
const staff=[barman,waiter];for(const s of staff)rooftop.add(s.node);
// actors of the scenes
const manager=figure(staffShirt,0x3a2a20,1,false,0xffd98a,0x16181d);manager.visible=false;rooftop.add(manager);
const arrivals=[0,1,2].map(i=>{const n=figure(shirts[i+3],hairs[i+2],.96,i===1);n.visible=false;rooftop.add(n);return n;});
const intruder=new T.Group();{const body=new T.Mesh(new T.CapsuleGeometry(.2,.75,6,12),mat(0x2b2f38));body.position.y=.82;const head=new T.Mesh(new T.SphereGeometry(.16,16,12),mat(0x3a3f4a));head.position.y=1.55;body.castShadow=head.castShadow=true;intruder.add(body,head,halo3(.48,0xff8f7d));intruder.visible=false;rooftop.add(intruder);}

// ---------- the rope across the doorway: the access to the rooftop
const door={open:0,target:0,pivot:new T.Group()};{
 const brass=mat(0xc9a24a,{metalness:1,roughness:.3});
 for(const x of [-.78,.72]){const post=new T.Mesh(new T.CylinderGeometry(.028,.028,.95,12),brass);post.position.set(x,.475,6.9);post.castShadow=true;const foot=new T.Mesh(new T.CylinderGeometry(.16,.17,.03,20),brass);foot.position.set(x,.015,6.9);const knob=new T.Mesh(new T.SphereGeometry(.05,12,10),brass);knob.position.set(x,.97,6.9);rooftop.add(post,foot,knob);}
 const rope=new T.Mesh(new T.CylinderGeometry(.022,.022,1.5,10),mat(0x9c1322,{roughness:.9}));rope.rotation.z=Math.PI/2;rope.position.set(.75,0,0);rope.castShadow=true;
 door.pivot.position.set(-.78,.86,6.9);door.pivot.add(rope);rooftop.add(door.pivot);}

// ---------- music: a soft pulse at each loudspeaker when it plays
const music={on:false,level:60,pulses:[]};
function speakerPulse(x,y,z){const s=new T.Sprite(new T.SpriteMaterial({map:halo,color:0x8fd8ff,transparent:true,opacity:0,depthWrite:false,blending:T.AdditiveBlending}));s.position.set(x,y,z);rooftop.add(s);music.pulses.push(s);}

// ---------- small labels, as on a dashboard
const tags=[];
function tag(text,x,y,z,o={}){const el=document.createElement(o.press?'button':'span');el.className='tag'+(o.alert?' alert':'')+(o.press?' press':'')+(o.cls?' '+o.cls:'');el.textContent=text;if(o.press)el.addEventListener('click',o.press);labelsEl.append(el);const t={el,pos:new T.Vector3(x,y,z),show:true,plan:!!o.plan};tags.push(t);return t;}
for(const p of [...guests,...staff]){p.tag=tag(p.label,0,0,0,{cls:'who-tag'+(p.staff?' staff':'')});}
const doorTag=tag('Accès · Fermé',0,2.9,6.6,{press:()=>toggleDoor()});
const musicTag=tag('Musique · Coupée',-24.2,2.6,10.6,{press:()=>toggleMusic()});musicTag.solid=true;
const fridgeTag=tag('Frigos · 3 °C',-11.2,1.35,7.2);fridgeTag.near=true;fridgeTag.solid=true;
const motionTag=tag('Mouvement',0,2.1,0,{alert:true});motionTag.show=false;

// ---------- the camera: an orbit with inertia
const orbit={target:centre.clone(),az:0,pol:.05,dist:60,vaz:0,vpol:0};
const home={target:centre.clone(),az:-.5,pol:.95,dist:46};
let fly=null,focused=null,planView=false;
function flyTo(to,ms=1300){fly={from:{target:orbit.target.clone(),az:orbit.az,pol:orbit.pol,dist:orbit.dist},to:{...to,target:to.target.clone()},t0:performance.now(),ms:reduce?1:ms};orbit.vaz=orbit.vpol=0;}
function place(){const s=Math.sin(orbit.pol),c=Math.cos(orbit.pol);camera.position.set(orbit.target.x+orbit.dist*s*Math.sin(orbit.az),orbit.target.y+orbit.dist*c,orbit.target.z+orbit.dist*s*Math.cos(orbit.az));camera.lookAt(orbit.target);}
// A long terrace: wide screens see it from the front, tall ones along its length.
function resize(){const w=stageEl.clientWidth,h=stageEl.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
 if(camera.aspect<.95){home.az=-1.22;home.pol=1.02;home.dist=clamp(36/Math.max(.45,camera.aspect)*.62,34,70);home.target.set(-10,.4,10.6);}
 else{home.az=-.5;home.pol=.95;home.dist=clamp(46*Math.max(1,1.6/camera.aspect),42,95);home.target.copy(centre);}}
new ResizeObserver(resize).observe(stageEl);resize();
const planOf=()=>({target:new T.Vector3(-7.5,0,8.2),az:0,pol:.03,dist:clamp(Math.max(44/camera.aspect,24)*1.75,40,150)});

const pointers=new Map();let moved=0,pinch=0;
canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});moved=0;fly=null;canvas.classList.add('dragging');hint();});
canvas.addEventListener('pointermove',e=>{
 const p=pointers.get(e.pointerId);
 if(!p){canvas.classList.toggle('over',!!pick(e));return;}
 const dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;moved+=Math.abs(dx)+Math.abs(dy);
 if(pointers.size===2){const [a,b]=[...pointers.values()],d=Math.hypot(a.x-b.x,a.y-b.y);if(pinch)orbit.dist=clamp(orbit.dist*pinch/d,4,150);pinch=d;pan(dx/2,dy/2);return;}
 if(e.buttons===2||e.shiftKey){pan(dx,dy);return;}
 orbit.vaz=-dx*.0052;orbit.vpol=-dy*.0042;orbit.az+=orbit.vaz;orbit.pol=clamp(orbit.pol+orbit.vpol,.03,1.46);
});
function pan(dx,dy){const k=orbit.dist*.0011,right=new T.Vector3(Math.cos(orbit.az),0,-Math.sin(orbit.az)),fwd=new T.Vector3(Math.sin(orbit.az),0,Math.cos(orbit.az));orbit.target.addScaledVector(right,-dx*k).addScaledVector(fwd,-dy*k);orbit.target.x=clamp(orbit.target.x,-28,13);orbit.target.z=clamp(orbit.target.z,-4,18);}
const release=e=>{if(!pointers.has(e.pointerId))return;pointers.delete(e.pointerId);pinch=0;canvas.classList.toggle('dragging',pointers.size>0);if(moved<6&&e.type==='pointerup')tap(e);};
canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);
canvas.addEventListener('wheel',e=>{e.preventDefault();fly=null;orbit.dist=clamp(orbit.dist*Math.exp(e.deltaY*.0012),4,150);hint();},{passive:false});
canvas.addEventListener('contextmenu',e=>e.preventDefault());

// ---------- touching things: the point of the floor under the finger tells the area
const ray=new T.Raycaster(),ndc=new T.Vector2(),ground=new T.Plane(new T.Vector3(0,1,0),0),hit=new T.Vector3();
function pick(e){const r=canvas.getBoundingClientRect();ndc.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(ndc,camera);
 if(!ray.ray.intersectPlane(ground,hit))return null;const zone=zoneAt(hit.x,hit.z);return zone?{zone}:null;}
function tap(e){const h=pick(e);if(h)enter(h.zone);}
// Each area has its best side: the hall is seen from the terrace, through its doorway.
const zoneViews={entrance:{az:0,pol:1.46,dist:7.6,at:[0,1.2,3.4]},stage:{az:-1.2,pol:1.12,dist:14},vip:{az:-.75,pol:1.02,dist:23},bar:{az:-.18,pol:1.2,dist:16},lounge:{az:.16,pol:1.2,dist:14.5},terrace:{az:.05,pol:1.02,dist:26},sunset:{az:.6,pol:1.08,dist:21}};
function view(id){const [a,b,c,d]=zones[id].rect,o=zoneViews[id]||{},wide=Math.max(1,1.15/camera.aspect);return {target:o.at?new T.Vector3(...o.at):new T.Vector3((a+c)/2,.8,(b+d)/2),az:o.az??orbit.az,pol:o.pol??1,dist:(o.dist??22)*(id==='entrance'?1:wide)};}
function enter(id){if(!zones[id])return;manual();if(focused===id){leave();return;}focused=id;setPlan(false,true);flyTo(view(id));back.hidden=false;say(`<b>${zones[id].name}</b>`);}
function leave(){focused=null;back.hidden=true;flyTo(planView?planOf():home);}
const back=$('back');back.addEventListener('click',leave);

// ---------- state: circuits, access, music, sails, ambience, and the dashboard that shows it
const toast=$('toast'),statusEl=$('status'),listEl=$('list'),who=$('who');let toastTimer=0;
function say(html){toast.innerHTML=html;toast.classList.add('on');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('on'),1900);}
const sails={shown:true,meshes:[]};
function refresh(){
 const n=[...circuits.values()].filter(c=>c.on).length,s=n>1?'s':'';
 statusEl.textContent=`${n} ambiance${s} allumée${s} · Accès ${door.target?'ouvert':'fermé'}`;
 $('count').textContent=`${n}/${circuits.size}`;$('active').textContent=`${n+(door.target?1:0)+(music.on?1:0)} / ${circuits.size+2} actifs`;
 $('door-state').textContent=door.target?'Ouvert':'Fermé';$('door-tile').setAttribute('aria-pressed',String(!!door.target));doorTag.el.textContent='Accès · '+(door.target?'Ouvert':'Fermé');
 $('sail-state').textContent=sails.shown?'Affichées':'Masquées';$('sail-tile').setAttribute('aria-pressed',String(sails.shown));
 $('music-state').textContent=music.on?`En cours · ${music.level} %`:'Coupée';$('music-set').textContent=music.level+' %';$('music-power').setAttribute('aria-pressed',String(music.on));musicTag.el.textContent='Musique · '+(music.on?music.level+' %':'Coupée');
 for(const b of listEl.querySelectorAll('button')){const c=circuits.get(b.dataset.circuit);b.setAttribute('aria-pressed',String(c.on));b.querySelector('small').textContent=c.on?'ALLUMÉ':'ÉTEINT';}
}
function set(id,on,quiet){const c=circuits.get(id);if(!c||c.on===on)return;c.on=on;if(!quiet)say(`${c.name} · <b>${on?'Allumé':'Éteint'}</b>`);refresh();}
const toggle=id=>{manual();set(id,!circuits.get(id).on);};
function setDoor(open,quiet){if(!!door.target===!!open)return;door.target=open?1:0;if(!quiet)say(`Accès · <b>${open?'Ouvert':'Fermé'}</b>`);refresh();}
const toggleDoor=()=>{manual();setDoor(!door.target);};
function setMusic(on,quiet){if(music.on===!!on)return;music.on=!!on;if(!quiet)say(`Musique · <b>${on?'En cours':'Coupée'}</b>`);refresh();}
const toggleMusic=()=>{manual();setMusic(!music.on);};
function setSails(shown,quiet){sails.shown=!!shown;for(const m of sails.meshes)m.visible=sails.shown&&!planView;if(!quiet)say(`Voiles d’ombrage · <b>${shown?'Affichées':'Masquées'}</b>`);refresh();}
function setPlan(on,quiet){if(planView===!!on)return;planView=!!on;for(const m of sails.meshes)m.visible=sails.shown&&!planView;
 for(const b of document.querySelectorAll('[data-view]'))b.setAttribute('aria-pressed',String((b.dataset.view==='plan')===planView));
 if(!quiet){focused=null;back.hidden=true;flyTo(planView?planOf():home,1100);say(planView?'<b>Plan</b> · vu du dessus':'<b>Vue 3D</b>');}}
for(const b of document.querySelectorAll('[data-view]'))b.addEventListener('click',()=>{manual();setPlan(b.dataset.view==='plan');});
for(const c of circuitList){const li=document.createElement('li');li.innerHTML=`<button data-circuit="${c.id}" aria-pressed="false"><i${c.tone?` class="${c.tone}"`:''}></i><span>${c.name}<small></small></span></button>`;li.firstChild.addEventListener('click',()=>toggle(c.id));listEl.append(li);}
const allOn=circuitList.map(c=>c.id);
const modes={day:{night:0,gloom:0,on:[],door:true,music:false,temp:'29,0 °C'},evening:{night:1,gloom:0,on:allOn,door:true,music:true,temp:'27,5 °C'},closed:{night:1,gloom:1,on:[],door:false,music:false,temp:'25,0 °C'}};
let night=1,nightTarget=1,gloom=0,gloomTarget=0,ambience='evening';
function mode(name,quiet){const m=modes[name];ambience=name;nightTarget=m.night;gloomTarget=m.gloom;for(const id of circuits.keys())set(id,m.on.includes(id),true);setDoor(m.door,true);setMusic(m.music,true);stageEl.classList.toggle('day',!m.night);$('temp').textContent=m.temp;
 for(const b of document.querySelectorAll('[data-mode]'))b.setAttribute('aria-pressed',String(b.dataset.mode===name));
 if(!quiet)say({day:'Journée · <b>Lumière du jour</b>',evening:'Soirée · <b>Toutes les ambiances</b>',closed:'Fermé · <b>Le rooftop veille</b>'}[name]);refresh();}
for(const b of document.querySelectorAll('[data-mode]'))b.addEventListener('click',()=>{manual();mode(b.dataset.mode);});
$('door-tile').addEventListener('click',toggleDoor);$('sail-tile').addEventListener('click',()=>{manual();setSails(!sails.shown);});
$('all-on').addEventListener('click',()=>{manual();for(const id of circuits.keys())set(id,true,true);say('Éclairage · <b>Tout allumé</b>');});
$('all-off').addEventListener('click',()=>{manual();for(const id of circuits.keys())set(id,false,true);say('Éclairage · <b>Tout éteint</b>');});
$('music-power').addEventListener('click',toggleMusic);
$('music-less').addEventListener('click',()=>{music.level=clamp(music.level-10,10,100);refresh();});$('music-more').addEventListener('click',()=>{music.level=clamp(music.level+10,10,100);refresh();});
const hintEl=$('hint');let hinted=false;function hint(){if(hinted)return;hinted=true;setTimeout(()=>hintEl.classList.add('gone'),2500);}
addEventListener('keydown',e=>{if(e.key==='Escape'&&focused)leave();});

// ---------- scenes: thirty seconds each, played on the rooftop itself
const stroll=(pts,t)=>{const n=pts.length-1,k=clamp(t,0,1)*n,i=Math.min(n-1,Math.floor(k)),f=k-i,a=pts[i],b=pts[i+1];return {x:a[0]+(b[0]-a[0])*f,z:a[1]+(b[1]-a[1])*f,heading:Math.atan2(b[0]-a[0],b[1]-a[1])};};
const walk=(node,pts,t)=>{const p=stroll(pts,t);node.position.set(p.x,Math.abs(Math.sin(performance.now()*.012))*.04*(t>0&&t<1?1:0),p.z);node.rotation.y=p.heading;};
const hallIn=[[0,-1.6],[0,5.6],[-.1,8.4]];
const toBar=[...hallIn,[-6.8,10.2],[-14.3,10.1],[-13.7,8.25],[-12.2,7.6]];
const seats=[[...hallIn,[-6.5,10.2],[-9.3,9.78]],[...hallIn,[-2.6,10.4],[-3.3,9.95]],[...hallIn,[3.6,10.5],[4.7,10.2]]];
const sneak=[[-25.0,7.1],[-23.6,8.7],[-18.5,10.5],[-14.6,10.3],[-11.4,9.95]];
const DURATION=30;
const barView=()=>({target:new T.Vector3(-10.5,.9,9),az:-.3,pol:.98,dist:24});
const scenes={
 opening:{steps:[[0,'18 h 30. Le rooftop est encore fermé.'],[3,'Le responsable arrive : l’entrée s’allume.'],[9,'Le bar, les guirlandes et les fresques s’allument.'],[16,'La musique démarre. L’accès est ouvert.'],[22,'Les premiers clients s’installent. Bonne soirée.']],
  start(){mode('closed',true);flyTo(view('entrance'),1500);},
  at(t,s){set('entrance',t>3,true);manager.visible=t>2.5;walk(manager,toBar,between(t,3,13.5));
   if(t>7.5&&!s.bar){s.bar=true;flyTo(barView(),1800);}
   set('bar',t>9,true);set('festoon',t>10.5,true);set('wash',t>11.5,true);set('fairy',t>12.5,true);set('candles',t>13.5,true);set('lounge',t>14.2,true);set('stage',t>15,true);setMusic(t>16,true);setDoor(t>17,true);
   if(t>17.5&&!s.wide){s.wide=true;flyTo(home,2000);}
   arrivals.forEach((n,i)=>{n.visible=t>18+i*1.3;walk(n,seats[i],between(t,18+i*1.3,26+i*1.2));});}},
 closing:{steps:[[0,'Dernier service. Les clients quittent la terrasse.'],[8,'La musique s’arrête, la scène s’éteint.'],[13,'Les lumières s’éteignent zone par zone.'],[21,'L’équipe sort. L’accès se ferme.'],[26,'Le rooftop est sous surveillance.']],
  start(){mode('evening',true);flyTo(home,1200);},
  at(t,s){arrivals.forEach((n,i)=>{n.visible=t<11+i;walk(n,[...seats[i]].reverse(),between(t,1+i*1.2,10+i));});
   setMusic(t<8,true);set('stage',t<8.5,true);set('candles',t<13,true);set('lounge',t<14,true);set('wash',t<15.5,true);set('festoon',t<17,true);set('fairy',t<18,true);set('bar',t<19.5,true);
   manager.visible=t>18.5&&t<25.6;walk(manager,[...toBar].reverse(),between(t,19.5,25.5));
   if(t>20&&!s.out){s.out=true;flyTo(view('entrance'),1800);}
   setDoor(t<24.5,true);set('entrance',t<26.5,true);if(t>26.5&&!s.dark){s.dark=true;gloomTarget=1;}}},
 intrusion:{steps:[[0,'Il est 3 h 12. Le rooftop est fermé.'],[4,'Une personne passe par le portillon de service.'],[9,'Individu non identifié : l’alerte est relayée.'],[16,'Les projecteurs s’allument. La séquence est enregistrée.']],
  start(){mode('closed',true);flyTo({target:new T.Vector3(-18.5,.6,9.6),az:-.85,pol:.98,dist:27},1800);},
  at(t){intruder.visible=t>4;const p=stroll(sneak,between(t,4,24));intruder.position.set(p.x,0,p.z);intruder.rotation.y=p.heading;motionTag.show=t>6;motionTag.pos.set(p.x,2.1,p.z);
   $('alert').hidden=t<9;set('wash',t>16,true);set('festoon',t>16.6,true);}}
};
let playing=null;
function play(name){stop(true);setPlan(false,true);const s=scenes[name];playing={name,s,t0:performance.now(),state:{}};focused=null;back.hidden=true;s.start();$('transport').hidden=false;
 for(const b of document.querySelectorAll('[data-scene]'))b.setAttribute('aria-pressed',String(b.dataset.scene===name));}
function stop(quiet){if(!playing)return;const name=playing.name;playing=null;$('transport').hidden=true;$('alert').hidden=true;manager.visible=false;intruder.visible=false;motionTag.show=false;for(const n of arrivals)n.visible=false;
 for(const b of document.querySelectorAll('[data-scene]'))b.setAttribute('aria-pressed','false');
 mode(name==='opening'?'evening':'closed',true);if(!quiet)flyTo(home);}
function manual(){if(playing)stop(true);}
for(const b of document.querySelectorAll('[data-scene]'))b.addEventListener('click',()=>playing?.name===b.dataset.scene?stop():play(b.dataset.scene));
$('stop').addEventListener('click',()=>stop());

// ---------- every frame
const v3=new T.Vector3(),white=new T.Color(0xffffff),moon=new T.Color(0x9db4ff),noon=new T.Color(0xfff1d6);let last=performance.now(),ready=false;
function frame(now){
 const dt=clamp((now-last)/1000,0,.05);last=now;
 // (a frame can be dated just before the click that started a scene: the time of the scene is never negative)
 if(playing){const t=Math.max(0,(now-playing.t0)/1000);playing.s.at(Math.min(t,DURATION),playing.state);$('bar').style.transform=`scaleX(${clamp(t/DURATION,0,1)})`;$('caption').textContent=playing.s.steps.filter(s=>s[0]<=t).pop()[1];if(t>DURATION+1.5)stop();}
 if(fly){const k=ease(clamp((now-fly.t0)/fly.ms,0,1)),a=fly.from,b=fly.to;orbit.target.lerpVectors(a.target,b.target,k);orbit.az=a.az+(b.az-a.az)*k;orbit.pol=a.pol+(b.pol-a.pol)*k;orbit.dist=a.dist+(b.dist-a.dist)*k;if(k>=1)fly=null;}
 else if(!pointers.size&&!reduce){orbit.az+=orbit.vaz;orbit.pol=clamp(orbit.pol+orbit.vpol,.03,1.46);const f=Math.pow(.0015,dt);orbit.vaz*=f;orbit.vpol*=f;}
 place();
 night+=(nightTarget-night)*Math.min(1,dt*2.2);gloom+=(gloomTarget-gloom)*Math.min(1,dt*1.6);
 sky.intensity=1.2-.55*gloom*night+1.05*(1-night);sky.color.setHex(0x8fa4ff).lerp(white,1-night);
 sun.intensity=(.6-.3*gloom)*night+2.8*(1-night);sun.color.copy(moon).lerp(noon,1-night);
 scene.environmentIntensity=(.2-.1*gloom)*night+.85*(1-night);renderer.toneMappingExposure=.95+.1*(1-night);
 for(const c of circuits.values()){
  c.level+=((c.on?1:0)-c.level)*Math.min(1,dt*(reduce?60:4));const k=c.level;
  for(const l of c.lights)l.intensity=l.userData.power*.5*k*(.3+.7*night);
  for(const m of c.materials)m.emissiveIntensity=m.userData.glow*k;
  for(const g of c.glows)g.material.opacity=k*.8*(.4+.6*night);
 }
 door.open+=(door.target-door.open)*Math.min(1,dt*(reduce?60:3));door.pivot.rotation.y=door.open*1.45;
 for(const [i,s] of music.pulses.entries()){const beat=.5+.5*Math.sin(now*.0105+i*1.7);s.material.opacity=music.on?(.16+.2*beat)*music.level/100:0;s.scale.setScalar(1.1+.6*beat);}
 // who is there depends on the ambience; nobody when a scene plays, except those it brings in
 const count={day:3,evening:guests.length,closed:0}[ambience],team=ambience==='closed'?0:staff.length;let clients=0,crew=0;
 for(const [i,g] of guests.entries()){const here=!playing&&i<count||playing?.name==='closing'&&i<count&&(now-playing.t0)/1000<2+i*.9;g.node.visible=here;if(!here)continue;clients++;
  if(!reduce)g.node.rotation.y=g.a+Math.sin(now*.0006+i*2.1)*.35;}
 for(const [i,s] of staff.entries()){const here=!playing&&i<team||playing?.name==='closing'&&(now-playing.t0)/1000<18;s.node.visible=here;if(!here)continue;crew++;
  const t=reduce?0:((now/1000+i*3.1)%(s.every*2))/s.every,k=t<1?between(t,.1,.9):1-between(t-1,.1,.9),moving=!reduce&&((t%1)>.1&&(t%1)<.9);
  s.node.position.set(s.a[0]+(s.b[0]-s.a[0])*k,moving?Math.abs(Math.sin(now*.011+i))*.035:0,s.a[1]+(s.b[1]-s.a[1])*k);const dir=t<1?1:-1;s.node.rotation.y=Math.atan2((s.b[0]-s.a[0])*dir,(s.b[1]-s.a[1])*dir);}
 for(const n of arrivals)if(n.visible)clients++;if(manager.visible)crew++;
 for(const p of [...guests,...staff]){p.tag.show=p.node.visible&&orbit.dist<(camera.aspect<1?20:30);p.tag.pos.set(p.node.position.x,p.node.userData.tall+.3,p.node.position.z);}
 {const text=clients+'·'+crew;if(who.dataset.n!==text){who.dataset.n=text;who.children[0].lastChild.textContent=clients;who.children[1].lastChild.textContent=crew;}}
 renderer.render(scene,camera);if(ready&&!drawn){drawn=true;tell('ready');}
 const w=canvas.clientWidth,h=canvas.clientHeight;
 for(const t of tags){v3.copy(t.pos).project(camera);const off=!t.show||!ready||(t.plan&&orbit.pol>.4)||(t.solid&&orbit.pol<.4)||(t.near&&orbit.dist>34)||v3.z>1||Math.abs(v3.x)>1.05||Math.abs(v3.y)>1.05;t.el.style.opacity=off?0:1;t.el.style.pointerEvents=off?'none':'';t.el.style.transform=`translate(-50%,-50%) translate(${((v3.x+1)/2*w).toFixed(1)}px,${((1-v3.y)/2*h).toFixed(1)}px)`;}
 requestAnimationFrame(frame);
}

// ---------- the model
async function load(){
 const info=await (await fetch('business/rooftop.json')).json();zones=info.zones;
 const gltf=await new GLTFLoader().loadAsync('business/'+info.model,e=>{if(e.total)loadingEl.textContent=`Chargement du rooftop… ${Math.round(e.loaded/e.total*100)} %`;});
 const byName=new Map();
 gltf.scene.traverse(o=>{if(!o.isMesh)return;const m=o.material,name=m.name;byName.set(name,m);
  o.castShadow=!name.startsWith('Light ')&&!['Pavers','Pavers tile','Hall floor'].includes(name);o.receiveShadow=!name.startsWith('Light ');o.matrixAutoUpdate=false;o.updateMatrix();
  for(const map of [m.map,m.emissiveMap])if(map)map.anisotropy=8;
  if(name==='Sail'){m.transparent=true;m.opacity=.62;m.depthWrite=false;o.renderOrder=2;}      // shade cloth: what is under it stays readable
  if(name==='Sail'||name==='Sail rope')sails.meshes.push(o);});
 for(const c of circuits.values()){
  for(const n of c.mats){const m=byName.get(n);if(!m)continue;m.userData.glow=strength[n]??2;m.emissiveIntensity=0;c.materials.push(m);}
  for(const key of c.glow||[]){const pts=info.circuits[key]?.points;if(!pts)continue;const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pts.flat(),3));
   const cloud=new T.Points(g,new T.PointsMaterial({map:halo,size:key==='festoon'?.62:.5,sizeAttenuation:true,transparent:true,opacity:0,depthWrite:false,blending:T.AdditiveBlending,color:0xffd9a0}));rooftop.add(cloud);c.glows.push(cloud);}
 }
 for(const d of info.devices)if(d.type==='speaker')speakerPulse(d.pos[0],d.pos[1]+.2,d.pos[2]);
 for(const [id,z] of Object.entries(zones)){const [a,b,c,d]=z.rect;tag(z.name,(a+c)/2,.2,(b+d)/2,{cls:'zone',plan:true});}
 rooftop.add(gltf.scene);ready=true;loadingEl.classList.add('gone');
 // A link can ask for an ambience, the plan or an area: ?mode=day|evening|closed, ?plan, ?zone=bar...
 const q=new URLSearchParams(location.search);mode(modes[q.get('mode')]?q.get('mode'):'evening',true);
 if(q.has('plan')){setPlan(true,true);flyTo(planOf(),reduce?1:1600);return;}
 if(zones[q.get('zone')]){focused=q.get('zone');back.hidden=false;flyTo(view(focused),reduce?1:2200);return;}
 // The rooftop is first seen from above, like a plan, then the view comes down to three quarters.
 setTimeout(()=>{if(!playing&&!focused&&!planView)flyTo(home,reduce?1:2600);},reduce?0:500);
}
orbit.target.copy(centre);orbit.dist=clamp(70/Math.min(1.6,camera.aspect),50,140);place();refresh();requestAnimationFrame(frame);
load().catch(error=>{console.error(error);failed();});
// Used by the page's own checks.
window.parks3d={orbit,flyTo,home,enter,leave,toggle,set,mode,toggleDoor,toggleMusic,setSails,setPlan,play,stop,circuits,get ready(){return ready;},get playing(){return playing;},
 info:()=>({calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,textures:renderer.info.memory.textures,geometries:renderer.info.memory.geometries})};
