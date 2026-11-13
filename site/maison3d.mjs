// The pilot house in three dimensions. Built to the measures read on the straight render of the property
// (studio-overview-projection.mjs space: 1000 x 1000 over 4096 x 2560 px, about 120 px per metre).
// Drag to turn around it, pinch or wheel to zoom, touch a room to enter it, touch a lamp to switch it.
// Everything is simulated: nothing is measured, tracked or controlled.
import * as T from './vendor/three.module.min.js';
import {avatars} from './maison3d-avatars.mjs';
const A=avatars(T);   // the articulated people and dog: they walk, breathe, sit and sleep

const $=id=>document.getElementById(id);
// Three steps. A visitor watches the scenes. With an access (or inside the app) the demo house can be explored and
// driven, with its dashboard. One's own house, with its real actions, comes from the plans made in the app.
let member=new URLSearchParams(location.search).has('app');
const admit=()=>{member=true;document.documentElement.classList.remove('visitor');dispatchEvent(new Event('resize'));};
if(member)document.documentElement.classList.remove('visitor');
// The cameras of the demo are private: shown only to the owner of Parks 3D, signed in with a verified address (the server says so).
// Everyone else, signed in or not, never sees them. Each person's own cameras live in the app, on their own home.
let signedIn=false;const signIn=()=>{signedIn=true;document.documentElement.classList.add('cams-on');};
// Local preview on this computer only (never on bonaparks.com): ?proprietaire shows the private parts, to check them.
if(/^(127\.0\.0\.1|localhost)$/.test(location.hostname)&&new URLSearchParams(location.search).has('proprietaire'))signIn();
fetch('/.netlify/functions/parks-access',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(d=>{if(d?.authenticated&&!member)admit();if(d?.owner)signIn();}).catch(()=>{});
// Inside the Bonaparks app the same page is shown: ?app hides the way back to the site, ?vue=scene keeps the house alone.
{const q=new URLSearchParams(location.search),root=document.documentElement;root.classList.toggle('in-app',q.has('app'));root.classList.toggle('only-scene',q.get('vue')==='scene');root.classList.toggle('embedded',q.has('embed'));}
const canvas=$('view'),stageEl=$('scene'),labelsEl=$('labels');
// Inside the app, the page says when the house is drawn or when it cannot be, so the app can show something else.
const tell=word=>{try{window.webkit?.messageHandlers?.parks3d?.postMessage(word);}catch{}};
let drawn=false;addEventListener('error',()=>{if(!drawn)tell('failed');});addEventListener('unhandledrejection',()=>{if(!drawn)tell('failed');});
const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
// ?live (local preview only): the real cameras of the home replace the simulated family, see maison3d-live.mjs.
const live={on:false,people:0,pets:0,tap:null};
const X=u=>(u-470)*0.03396,Z=v=>(v-470)*0.021227;            // render units to metres, the house near the middle
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),ease=t=>t*t*(3-2*t),between=(t,a,b)=>ease(clamp((t-a)/(b-a),0,1));

let renderer;try{renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true});}catch(error){tell('failed');throw error;}
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();tell('failed');});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
const scene=new T.Scene(),camera=new T.PerspectiveCamera(32,1,.5,400);
const sky=new T.HemisphereLight(0x8fa4ff,0x262b4a,1),sun=new T.DirectionalLight(0xfff1d6,0);
const small=Math.min(innerWidth,innerHeight)<500;sun.position.set(-16,26,13);sun.castShadow=true;sun.shadow.mapSize.set(small?1024:2048,small?1024:2048);sun.shadow.bias=-.0004;sun.shadow.normalBias=.03;sun.shadow.radius=4;
Object.assign(sun.shadow.camera,{left:-22,right:22,top:16,bottom:-16,near:1,far:80});scene.add(sky,sun);

// ---------- surfaces drawn once on a canvas: tiles, grain, grass. No picture files.
function surface(draw,size=256,repeat=[1,1]){const c=document.createElement('canvas');c.width=c.height=size;draw(c.getContext('2d'),size);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(...repeat);t.anisotropy=8;return t;}
let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
const grain=(base,spread,dots=2600,r=1.3)=>(g,s)=>{g.fillStyle=base;g.fillRect(0,0,s,s);for(let i=0;i<dots;i++){const k=(rnd()-.5)*spread;g.fillStyle=`rgba(${k>0?255:0},${k>0?255:0},${k>0?255:0},${Math.abs(k)})`;g.beginPath();g.arc(rnd()*s,rnd()*s,rnd()*r+.3,0,7);g.fill();}};
const tiles=(base,joint,n,brick)=>(g,s)=>{grain(base,.05,900)(g,s);g.strokeStyle=joint;g.lineWidth=2;const step=s/n;for(let i=0;i<=n;i++){g.beginPath();g.moveTo(0,i*step);g.lineTo(s,i*step);g.stroke();for(let j=0;j<=n/(brick?2:1);j++){const x=j*step*(brick?2:1)+(brick&&i%2?step:0);g.beginPath();g.moveTo(x,i*step);g.lineTo(x,(i+1)*step);g.stroke();}}};
const planks=(base,joint)=>(g,s)=>{grain(base,.07,1400,2)(g,s);g.strokeStyle=joint;g.lineWidth=1.5;for(let i=0;i<8;i++){g.beginPath();g.moveTo(0,i*s/8);g.lineTo(s,i*s/8);g.stroke();}};
const tex={
 lawn:surface(grain('#4d8b3c',.16,5200,1.1),256,[14,8]),gravel:surface(grain('#b7b0a1',.2,5200,1.2),256,[9,9]),paving:surface(tiles('#cfccc5','#b3afa7',4),256,[5,3]),
 tile:surface(tiles('#dcdee2','#c2c5cb',4,true),256,[4,4]),terracotta:surface(tiles('#c98866','#b17354',4,true),256,[5,2]),bath:surface(tiles('#c3d0db','#a9b8c6',6),256,[2,3]),
 wood:surface(planks('#c59a66','#a67f50'),256,[1,1]),hedge:surface(grain('#2f6d36',.22,5200,1.6),256,[8,1]),water:surface((g,s)=>{g.fillStyle='#2aa7df';g.fillRect(0,0,s,s);g.strokeStyle='rgba(215,250,255,.35)';g.lineWidth=1.2;for(let i=0;i<26;i++){g.beginPath();const y=rnd()*s;g.moveTo(0,y);for(let x=0;x<=s;x+=16)g.lineTo(x,y+Math.sin(x*.05+i)*5);g.stroke();}},256,[3,2])
};

// ---------- building blocks
const mats=new Map(),mat=(color,o={})=>{const k=color+JSON.stringify(o,(key,v)=>v&&v.isTexture?v.uuid:v);if(!mats.has(k))mats.set(k,new T.MeshStandardMaterial({color,roughness:.82,metalness:0,...o}));return mats.get(k);};
const house=new T.Group();scene.add(house);let parent=house;
const put=(m,shadow=true)=>{m.castShadow=shadow;m.receiveShadow=true;parent.add(m);return m;};
/** A box over a rectangle of the render, from y0 up to y0 + h metres. */
function box(u0,v0,u1,v1,h,y0,color,o,shadow){const w=Math.abs(X(u1)-X(u0)),d=Math.abs(Z(v1)-Z(v0)),m=new T.Mesh(new T.BoxGeometry(w,h,d),typeof color==='number'?mat(color,o):color);m.position.set((X(u0)+X(u1))/2,y0+h/2,(Z(v0)+Z(v1))/2);return put(m,shadow);}
const cyl=(u,v,r,h,y0,color,o)=>{const m=new T.Mesh(new T.CylinderGeometry(r,r,h,24),mat(color,o));m.position.set(X(u),y0+h/2,Z(v));return put(m);};
const ground=(a,b,c,d,y,map,room)=>{const m=box(a,b,c,d,.05,y,0xffffff,{map},false);if(room)m.userData.room=room;return m;};
const WALL=1.3,wall=(u0,v0,u1,v1,h=WALL)=>{box(u0,v0,u1,v1,h,0,0xe9edf4);return box(u0-.4,v0-.6,u1+.4,v1+.6,.05,h,0xf6f8fb);};   // a wall and its cut top
const wallH=(u0,u1,v,h)=>wall(u0,v-2.6,u1,v+2.6,h),wallV=(u,v0,v1,h)=>wall(u-1.6,v0,u+1.6,v1,h);
const glass=mat(0x9fd0ee,{roughness:.1,metalness:.2,transparent:true,opacity:.55,emissive:0x2a5d86,emissiveIntensity:.35});
// Real windows: the wall is open above a sill, with a frame, two panes and a roller shutter outside.
const SILL=.62,dark=0x2f3742,shutters=[];
const slats=surface((g,s)=>{g.fillStyle='#e9e7e1';g.fillRect(0,0,s,s);g.fillStyle='#c5c2ba';for(let i=0;i<s;i+=16)g.fillRect(0,i,s,3);},64,[1,3]);
/** A door in its opening, from the hinge (x0, z0) to the other side (x1, z1), in metres. It opens when someone comes near. */
const doors=[];
function door(x0,z0,x1,z1,y=0){const w=Math.hypot(x1-x0,z1-z0),pivot=new T.Group();pivot.position.set(x0,0,z0);pivot.rotation.y=Math.atan2(-(z1-z0),x1-x0);
 const leaf=new T.Mesh(new T.BoxGeometry(w-.04,WALL-.02,.045),mat(0x8d7a69,{roughness:.6}));leaf.position.set(w/2,(WALL-.02)/2+.01,0);leaf.castShadow=true;
 const knob=new T.Mesh(new T.SphereGeometry(.035,10,8),mat(0xd8dde4,{metalness:.8,roughness:.25}));knob.position.set(w-.14,.66,.05);const knob2=knob.clone();knob2.position.z=-.05;
 leaf.userData.door=knob.userData.door=knob2.userData.door=doors.length;pivot.add(leaf,knob,knob2);parent.add(pivot);
 for(const [x,z] of [[x0,z0],[x1,z1]]){const j=new T.Mesh(new T.BoxGeometry(.07,WALL,.13),mat(0x2f3742));j.position.set(x,WALL/2,z);j.rotation.y=pivot.rotation.y;j.castShadow=true;parent.add(j);}
 doors.push({pivot,base:pivot.rotation.y,x:(x0+x1)/2,z:(z0+z1)/2,y,open:0,held:false});}
/** A window in a wall along x: a, b its two sides and z its line, in metres; out is +1 when outside is towards +z. */
function windowAt(a,b,z,out,up,cut=WALL){
 const piece=(x0,z0,x1,z1,h,y0,color,o,shadow)=>{const m=new T.Mesh(new T.BoxGeometry(x1-x0,h,z1-z0),typeof color==='number'?mat(color,o):color);m.position.set((x0+x1)/2,y0+h/2,(z0+z1)/2);return put(m,shadow);};
 piece(a,z-.055,b,z+.055,SILL,0,0xe9edf4);piece(a-.04,z-.1,b+.04,z+.1,.045,SILL,0xf6f8fb);                       // the low wall and its sill
 for(const x of [a,(a+b)/2-.02,b-.04])piece(x,z-.035,x+.04,z+.035,cut-SILL-.045,SILL+.045,dark);piece(a,z-.035,b,z+.035,.04,cut-.04,dark);
 piece(a+.04,z-.008,b-.04,z+.008,cut-SILL-.085,SILL+.045,glass,undefined,false);
 const blind=piece(a+.01,z+out*.075-.012,b-.01,z+out*.075+.012,cut-SILL,SILL,0xffffff,{map:slats,roughness:.7});
 shutters.push({mesh:blind,top:cut,height:cut-SILL,up:!!up});
}

// ---------- the land
box(0,190,1000,950,.3,-.31,0x1d2a22,undefined,false);   // the property starts at the gate line
ground(10,196,990,945,-.01,tex.lawn,'garden');
ground(47,203,294,612,.01,tex.gravel,'entry');ground(135,150,235,203,.01,tex.gravel);                 // gravel: the entrance, and the threshold outside the gate
ground(288,205,616,692,.03,tex.paving);ground(674,680,952,925,.03,tex.paving);ground(600,640,690,700,.03,tex.paving);
// the boundary wall opens on the street in front of the gate, where the car comes in
for(const [a,b,c,d] of [[0,942,1000,950],[0,190,8,950],[992,190,1000,950],[0,192,47,208]]){box(a,b,c,d,.75,0,0xdcd8cf);box(a-.5,b-.8,c+.5,d+.8,.06,.75,0xeeebe4);}
const hedge=(a,b,c,d,h=1.15)=>box(a,b,c,d,h,0,0xffffff,{map:tex.hedge,roughness:1});
hedge(12,205,44,940);hedge(44,915,985,940);hedge(955,215,985,915);hedge(314,196,985,214,1.35);       // hedges, the back one at the gate
wallH(47,135,200,1.05);wallH(235,300,200,1.05);                                                       // the wall each side of the gate
function tree(u,v,s=1){cyl(u,v,.11*s,1.5*s,0,0x6b4a32);for(const [dx,dy,dz,r] of [[0,2.1,0,1],[.55,1.75,.2,.7],[-.5,1.8,-.3,.72],[.1,1.7,.55,.6]]){const m=new T.Mesh(new T.IcosahedronGeometry(r*s,1),mat(0x3b8742,{roughness:1,flatShading:true}));m.position.set(X(u)+dx*s,dy*s,Z(v)+dz*s);put(m);}}
tree(300,250,1);tree(262,330,.9);tree(262,430,.9);tree(640,700,.65);tree(600,772,.65);
const pot=(u,v)=>{cyl(u,v,.17,.32,0,0xb9744f);const m=new T.Mesh(new T.IcosahedronGeometry(.3,1),mat(0x3f8f49,{flatShading:true,roughness:1}));m.position.set(X(u),.58,Z(v));put(m);};
pot(300,596);pot(560,596);pot(690,706);
// carport: posts and a slatted roof
for(const v of [215,600])for(const u of [52,112])cyl(u,v,.07,2.25,0,0xc9a36b);
box(50,212,54,603,.1,2.25,0xc9a36b);box(110,212,114,603,.1,2.25,0xc9a36b);for(let v=222;v<600;v+=26)box(48,v,116,v+11,.05,2.35,0xdcbf93);
// solar panels on the carport roof: two rows of glass panels, cells drawn on them, a thin aluminium frame
{const cells=surface((g,n)=>{g.fillStyle='#0f1d3a';g.fillRect(0,0,n,n);g.strokeStyle='rgba(170,190,225,.55)';g.lineWidth=1.4;for(let i=0;i<=6;i++){g.beginPath();g.moveTo(i*n/6,0);g.lineTo(i*n/6,n);g.stroke();}for(let j=0;j<=10;j++){g.beginPath();g.moveTo(0,j*n/10);g.lineTo(n,j*n/10);g.stroke();}g.fillStyle='rgba(120,160,230,.08)';g.fillRect(0,0,n,n/2);},256,[1,1]);
 const glassPanel=mat(0xffffff,{map:cells,roughness:.18,metalness:.35}),alu=mat(0xc9ced6,{roughness:.4,metalness:.6});
 for(let v=226;v<596;v+=46)for(const [u0,u1] of [[50,82],[84,114]]){const p=box(u0,v,u1,v+44,.04,2.46,glassPanel);p.rotation.z=.12;const f=box(u0-.4,v-.4,u1+.4,v+44.4,.02,2.44,alu,undefined,false);f.rotation.z=.12;}}
// gazebo by the pool
for(const [u,v] of [[578,645],[612,645],[578,690],[612,690]])cyl(u,v,.06,2.3,0,0xc9a36b);
{const m=new T.Mesh(new T.ConeGeometry(1.3,.55,4),mat(0xf1ece2,{flatShading:true}));m.position.set(X(595),2.57,Z(667));m.rotation.y=Math.PI/4;put(m);}

// ---------- the house: ground floor, walls cut at 1.3 m
const rooms={
 kitchen:{name:'Cuisine',rect:[329,227,449,315],map:tex.tile},living:{name:'Séjour',rect:[449,227,569,463],map:tex.tile},hall:{name:'Entrée',rect:[385,315,449,463],map:tex.tile},
 bath:{name:'Salle d’eau',rect:[329,315,385,463],map:tex.bath},laundry:{name:'Buanderie',rect:[329,469,569,581],map:tex.terracotta},terrace:{name:'Terrasse',rect:[300,581,570,690]},
 garden:{name:'Jardin',rect:[640,230,950,660]},pool:{name:'Piscine',rect:[690,690,940,880]},entry:{name:'Entrée du terrain',rect:[50,90,290,600]}
};
for(const [id,r] of Object.entries(rooms)){if(!r.map)continue;const [a,b,c,d]=r.rect;ground(a,b,c,d,.08,r.map,id);}
box(300,581,570,690,.02,.075,0xffffff,{map:tex.paving},false).userData.room='terrace';
wallH(325,352,224);wallH(412,482,224);wallH(538,573,224);windowAt(X(352),X(412),Z(224),-1);windowAt(X(482),X(538),Z(224),-1);door(X(497),Z(466),X(541),Z(466));door(X(385),Z(398),X(385),Z(432));     // back wall, with its two windows
wallV(327,224,584);wallV(571,224,584);                                         // left, right
wallH(325,497,466);wallH(541,573,466);                                          // between the living room and the laundry, with its door
wallV(385,315,398);wallV(385,432,466);wallH(327,385,315);                       // the shower room, with its door
// outside stairs to the upper floor
for(let i=0;i<14;i++)box(575,640-i*16-16,612,640-i*16,.19*(i+1),0,0xdfe2e8);
box(575,372,612,416,2.75,0,0xdfe2e8);box(612,372,614.5,656,.9,.19,0x2c3340,undefined,false);
// kitchen: worktop along the back wall, hob, sink, and the fridge beside the sink
box(331,229,426,258,.86,0,0xeef1f4);box(330,228,427,259,.05,.86,0xcfd4da,{roughness:.35});for(const u of [338,362,386,410])box(u,258,u+16,258.6,.03,.6,0x5b6470);
box(352,232,378,255,.02,.91,0x161b23,{roughness:.2});for(const [u,v] of [[359,239],[371,239],[359,249],[371,249]])cyl(u,v,.07,.012,.93,0x2d343f);
box(388,233,412,254,.03,.91,0xb7c0ca,{metalness:.7,roughness:.25});box(399,231,401,234,.22,.91,0xc8d0d9,{metalness:.8,roughness:.2});
box(428,229,449,258,1.85,0,0xcdd4dc,{metalness:.45,roughness:.35});box(447.6,233,448.6,236,.5,1.05,0x7d8794);
// dining table and chairs
box(478,330,506,398,.05,.72,0xffffff,{map:tex.wood});for(const [u,v] of [[481,334],[503,334],[481,394],[503,394]])cyl(u,v,.035,.72,0,0x9a744a);
for(const [u,v,side] of [[468,348,-1],[468,380,-1],[516,348,1],[516,380,1]]){box(u-6,v-9,u+6,v+9,.05,.42,0xb78752);box(u+side*5,v-9,u+side*6.4,v+9,.45,.47,0xb78752);for(const [a,b] of [[-5,-8],[5,-8],[-5,8],[5,8]])cyl(u+a,v+b,.025,.42,0,0x8a6642);}
cyl(492,364,.16,.06,.77,0xf1f1ee);
// sofa with cushions, rug, low table, TV on its cabinet
box(506,296,568,416,.012,.105,0x5f7fb5,{roughness:1},false);
box(540,300,566,400,.4,0,0xa7b2c2);box(559,300,566,400,.42,.4,0x94a1b4);box(540,290,566,300,.6,0,0x94a1b4);box(540,400,566,410,.6,0,0x94a1b4);
for(const v of [303,336,369])box(541,v,558,v+29,.12,.4,0xbcc6d4);
box(525,322,537,368,.05,.34,0xffffff,{map:tex.wood});for(const [u,v] of [[527,325],[535,325],[527,365],[535,365]])cyl(u,v,.03,.34,0,0x8a6642);   // the low table, between the dining chairs (to 522) and the sofa (from 540)
box(486,229,522,244,.48,0,0x9b7a55);const tv=box(488,231,520,233,.6,.55,0x0d1118,{emissive:0x4d7dff,emissiveIntensity:0,roughness:.2});
// shower room
box(333,345,358,395,.8,0,0xd9b98f);box(336,352,355,388,.1,.8,0xffffff,{roughness:.2});box(333,412,350,430,.4,0,0xffffff,{roughness:.2});box(333,430,352,446,.42,0,0xffffff,{roughness:.2});
box(331,318,352,340,.04,.1,0x9fc3da,{roughness:.2},false);
// laundry: sink, washing machine; bar and stools on the terrace side; garden table
box(333,472,362,500,.8,0,0xd9b98f);box(336,476,359,496,.1,.8,0xffffff,{roughness:.2});box(368,472,392,502,.85,0,0xf2f4f6,{roughness:.3});cyl(380,502.4,.17,.03,.42,0x1c232d).rotation.x=Math.PI/2;
box(333,576,430,588,1.05,0,0xe4dfd6);box(332,575,431,589,.05,1.05,0xffffff,{map:tex.wood});for(const u of [352,380,408]){cyl(u,600,.16,.05,.62,0x3f8e94);cyl(u,600,.03,.62,0,0x2a333d);}
box(432,604,472,640,.05,.72,0xffffff,{map:tex.wood});for(const [u,v] of [[435,607],[469,607],[435,637],[469,637]])cyl(u,v,.035,.72,0,0x8a6944);

// ---------- the upper floor: bedrooms, bathroom and hall, set on the ground floor when it is shown.
// Measures in metres from the upper-floor model of the site (x across, y towards the back).
const upper=new T.Group();upper.position.y=2.75;upper.visible=false;house.add(upper);parent=upper;
const sx=x=>X(329)+x+3.45,sz=y=>Z(227)+4-y,ru=x=>sx(x)/0.03396+470,rv=y=>sz(y)/0.021227+470;
const ub=(x0,y0,x1,y1,h,up,color,o,shadow)=>box(ru(x0),rv(y1),ru(x1),rv(y0),h,up,color,o,shadow);
const uw=(x0,y0,x1,y1)=>{ub(x0,y0,x1,y1,WALL,0,0xe9edf4);ub(x0-.01,y0-.01,x1+.01,y1+.01,.05,WALL,0xf6f8fb);};
const uroom=(id,name,x0,y0,x1,y1,map)=>{rooms[id]={name,rect:[ru(x0),rv(y1),ru(x1),rv(y0)],up:2.75};const m=ub(x0,y0,x1,y1,.04,.01,0xffffff,{map},false);m.userData.room=id;};
ub(-3.6,-3.65,4.85,4.15,.22,-.22,0xd8dce3);                                                       // the slab
uroom('master','Chambre du fond · gauche',-3.45,.95,.4,4,tex.wood);uroom('guest','Chambre du fond · droite',1.9,.95,4.7,4,tex.wood);uroom('landing','Dressing',.4,.95,1.9,4,tex.wood);
uroom('children','Chambre des enfants',-3.45,-3.5,-.6,.95,tex.wood);uroom('bathup','Salle de bain',-.6,-3.5,1,0,tex.bath);uroom('blue','Chambre au lit bleu',1,-3.5,4.7,0,tex.wood);uroom('hallup','Couloir du haut',-.6,0,4.7,.95,tex.tile);
for(const [y,out,wins] of [[4,-1,[[-1.75,-.45],[2.6,3.8]]],[-3.5,1,[[-1.85,-.8],[1.65,3.15]]]]){let x=-3.5;for(const [a,b] of wins){uw(x,y-.05,a,y+.05);windowAt(sx(a),sx(b),sz(y),out,true);x=b;}uw(x,y-.05,4.75,y+.05);}
uw(-3.5,-3.55,-3.4,4.05);uw(4.65,-3.55,4.75,0);uw(4.65,.8,4.75,4.05);   // outer walls, the door from the landing on the right
uw(-3.45,.9,-.5,1);uw(.4,.9,2,1);uw(2.85,.9,4.7,1);                                                // back rooms, with their doors on the hall
uw(-.65,-3.5,-.55,.05);uw(.95,-3.5,1.05,0);uw(-.6,-.05,.05,.05);uw(.8,-.05,3.3,.05);uw(4.05,-.05,4.7,.05);            // front rooms
ub(.45,1.15,1.85,3.95,1.25,0,0xf4f5f7);ub(1.14,1.14,1.16,3.95,1.2,0,0xcfd4da);                       // wardrobes between the two back rooms
const bed=(x0,y0,x1,y1,cover,head)=>{ub(x0,y0,x1,y1,.3,0,0xb78752);ub(x0+.05,y0+.05,x1-.05,y1-.05,.16,.3,cover);const h=head==='back';ub(x0,h?y1-.12:y0,x1,h?y1:y0+.12,.75,0,0xb78752);const w=(x1-x0)/2;for(const k of [0,1])ub(x0+.12+k*w,h?y1-.62:y0+.2,x0+w-.12+k*w,h?y1-.2:y0+.62,.1,.46,0xffffff);};
bed(-2.9,1.5,-.95,3.75,0xe8dfe2,'back');ub(-3.35,3.2,-2.95,3.7,.5,0,0xc59a66);                       // master
bed(2.45,1.35,4.3,3.5,0xb9bcc4,'back');ub(2.0,3.4,2.4,3.85,.5,0,0xc59a66);                           // guest
// the children's room, from the Matterport scan (top view) and its camera: the cot with bars against the left wall,
// the child's bed (no bars) against the bathroom wall, both in the middle of the room; the chest of drawers on the hall side,
// shelves, a toy box and the TV on the wall on the window side.
const crib=(x0,y0,x1,y1,sheet,bars)=>{const W=0xf4f1ec,h=bars?.92:.55,m=.045;
 for(const [x,y] of [[x0,y0],[x1-m,y0],[x0,y1-m],[x1-m,y1-m]])ub(x,y,x+m,y+m,h,0,W);                                  // corner posts
 ub(x0,y0,x1,y1,.05,bars?.3:.18,W);ub(x0+.04,y0+.04,x1-.04,y1-.04,.12,bars?.35:.23,0xffffff);ub(x0+.06,y0+.06,x1-.06,y1-.06,.03,bars?.47:.35,sheet);
 ub(x0+.12,y0+.08,x1-.12,y0+.36,.07,bars?.5:.38,0xffffff);                                                               // pillow, window side
 if(!bars){ub(x0,y0,x1,y0+m,.55,0,W);ub(x0,y1-m,x1,y1,.4,0,W);return;}                                                    // a child's bed: head and foot boards only
 ub(x0,y0,x0+m,y1,.04,h-.04,W);ub(x1-m,y0,x1,y1,.04,h-.04,W);ub(x0,y0,x1,y0+m,.04,h-.04,W);ub(x0,y1-m,x1,y1,.04,h-.04,W); // top rails
 for(let y=y0+.1;y<y1-.06;y+=.1){ub(x0+.01,y,x0+.035,y+.022,h-.36,.32,W);ub(x1-.035,y,x1-.01,y+.022,h-.36,.32,W);}         // bars
 for(let x=x0+.1;x<x1-.06;x+=.1){ub(x,y0+.01,x+.022,y0+.035,h-.36,.32,W);ub(x,y1-.035,x+.022,y1-.01,h-.36,.32,W);}};
const cots=[[-3.42,-1.95,-2.7,-.63,0xf0a070,true],[-1.34,-1.95,-.62,-.63,0xf2f2f0,false]];
for(const c of cots)crib(...c);
ub(-2.55,-1.9,-1.45,-.7,.012,.05,0xdcd3e8,{roughness:1},false);                                                           // the rug between the beds
ub(-3.42,.42,-2.55,.9,.9,0,0xf4f5f7);ub(-3.38,.46,-2.59,.86,.04,.9,0xe9e4dc);                                            // chest of drawers / changing table, hall side
ub(-3.42,-3.43,-2.4,-2.98,.8,0,0xf4f5f7);for(let i=0;i<3;i++)ub(-3.36+i*.33,-3.0,-3.08+i*.33,-2.96,.26,.12,[0xe7d9f2,0xd6e6f5,0xf5e2cf][i]); // shelves and their bins
ub(-2.1,-3.43,-1.35,-3.05,.36,0,0xd9534f);ub(-2.08,-3.41,-1.37,-3.07,.03,.36,0xf2c14e);                                  // toy box
ub(-3.44,-3.3,-3.4,-2.45,.5,1.15,0x10151d,{roughness:.3});                                                               // the TV on the wall, above the shelves// the beds in plan units, for the live view: a child seen in a bed lies on its mattress
const cotsPlan=cots.map(([x0,y0,x1,y1,,bars])=>({rect:[ru(x0),rv(y1),ru(x1),rv(y0)],mattress:bars?.5:.38,up:true}));
ub(-.45,-3.35,.35,-1.6,.55,0,0xffffff,{roughness:.2});ub(-.33,-3.23,.23,-1.72,.05,.5,0xa8c7dc,{roughness:.2},false);ub(.5,-2.75,.92,-2.2,.42,0,0xffffff,{roughness:.2});ub(.35,-.95,.92,-.3,.8,0,0xd9b98f);ub(.4,-.9,.87,-.35,.08,.8,0xffffff,{roughness:.2});
bed(1.7,-3.25,3.45,-1.2,0x3f8fd6,'front');ub(3.6,-3.3,4.05,-2.85,.5,0,0xc59a66);                     // the blue bed
// a door in every opening of the upper floor
door(sx(4.7),sz(.8),sx(4.7),sz(0),2.75);door(sx(-.5),sz(.95),sx(.4),sz(.95),2.75);door(sx(2),sz(.95),sx(2.85),sz(.95),2.75);
door(sx(-.6),sz(.05),sx(-.6),sz(.9),2.75);door(sx(.05),sz(0),sx(.8),sz(0),2.75);door(sx(3.3),sz(0),sx(4.05),sz(0),2.75);
// the pergola over the terrace, level with the upper floor
for(const v of [584,637,690])box(298,v-1.5,572,v+1.5,.12,-.2,0xc9a36b);for(const u of [300,436,570])box(u-1.2,584,u+1.2,690,.1,-.1,0xc9a36b);
for(const [a,b] of [[303,433],[439,567]])for(const [c,d] of [[588,634],[640,687]])box(a,c,b,d,.03,-.04,0xf1ece2,{roughness:.9});
parent=house;
for(const u of [302,436,568])cyl(u,688,.07,2.6,0,0xc9a36b);          // its posts stand on the terrace

// ---------- pool with a rounded end, and the spa
const basin=g=>{const s=new T.Shape(),x0=X(760),x1=X(903)+g,z0=Z(723)-g,z1=Z(846)+g,r=(z1-z0)/2,c=.35+g;s.moveTo(x0,-z1);s.absarc(x0,-(z0+z1)/2,r,-Math.PI/2,Math.PI/2,true);s.lineTo(x1-c,-z0);s.quadraticCurveTo(x1,-z0,x1,-z0-c);s.lineTo(x1,-z1+c);s.quadraticCurveTo(x1,-z1,x1-c,-z1);s.lineTo(x0,-z1);return new T.ShapeGeometry(s,40);};
const rim=new T.Mesh(basin(.34),mat(0xece9e2));rim.rotation.x=-Math.PI/2;rim.position.y=.1;rim.receiveShadow=true;house.add(rim);
const water=new T.Mesh(basin(0),new T.MeshStandardMaterial({color:0xffffff,map:tex.water,roughness:.15,metalness:.1,emissive:0x1fb6ff,emissiveIntensity:.15}));water.rotation.x=-Math.PI/2;water.position.y=.115;water.userData.room='pool';house.add(water);
{const uv=water.geometry.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*.12,uv.getY(i)*.12);}
cyl(801,683,.98,.55,0,0xece9e2);const spa=cyl(801,683,.74,.05,.53,0x38b8e6,{roughness:.15,emissive:0x1fb6ff,emissiveIntensity:.15});

// ---------- gate, car, and the person of the alert scene
const gate={open:0,target:0,leaves:[]};
for(const u of [135,235]){box(u-4,194,u+4,206,1.55,0,0xdcd8cf);box(u-5,192.5,u+5,207.5,.07,1.55,0xeeebe4);}
for(const side of [0,1]){const pivot=new T.Group();pivot.position.set(X(side?235:135),0,Z(200));const w=(X(235)-X(135))/2-.06;
 for(let i=0;i<7;i++){const m=new T.Mesh(new T.BoxGeometry(w,.14,.06),mat(0xa8845a));m.position.set(side?-w/2:w/2,.2+i*.17,0);m.userData.gate=true;m.castShadow=true;pivot.add(m);}
 house.add(pivot);gate.leaves.push(pivot);}
const car=new T.Group(),beams=new T.SpotLight(0xfff0cc,0,14,.5,.6,1.4);{
 const paint=mat(0x2f4f86,{roughness:.35,metalness:.55}),dark=mat(0x10161f,{roughness:.2,metalness:.3});
 const add=(g,m,x,y,z)=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;car.add(o);return o;};
 add(new T.BoxGeometry(1.78,.5,4.3),paint,0,.62,0);add(new T.BoxGeometry(1.7,.16,1.2),paint,0,.93,1.5);add(new T.BoxGeometry(1.6,.5,2.2),dark,0,1.1,-.25);add(new T.BoxGeometry(1.62,.06,2.1),paint,0,1.37,-.25);
 for(const [x,z] of [[-.86,1.35],[.86,1.35],[-.86,-1.35],[.86,-1.35]]){const w=add(new T.CylinderGeometry(.34,.34,.24,20),mat(0x15181d),x,.34,z);w.rotation.z=Math.PI/2;}
 for(const x of [-.6,.6]){add(new T.BoxGeometry(.34,.14,.05),new T.MeshBasicMaterial({color:0xfff3cf}),x,.7,2.16);add(new T.BoxGeometry(.34,.1,.05),new T.MeshBasicMaterial({color:0xd0322f}),x,.72,-2.16);}
 beams.position.set(0,.8,2);beams.target.position.set(0,0,9);car.add(beams,beams.target);
 house.add(car);}
const parked=[185,520],street=[185,-40];   // the gate opens on the drive, clear of the carport
const resident=A.human({top:0xe88f6f,bottom:0x2f3f5c,hair:0x4a3326,style:'long',accent:0x9fd8ff});resident.visible=false;house.add(resident);
// The family at home: each one strolls a few steps in a room, the dog in the garden. Simulated, like the rest.
function figure(shirt,hair,size=1,long=false){const g=new T.Group(),m=(geo,c,y)=>{const k=new T.Mesh(geo,mat(c));k.position.y=y*size;k.castShadow=true;g.add(k);return k;};
 m(new T.CapsuleGeometry(.17*size,.5*size,6,12),0x2f3f5c,.5);m(new T.CapsuleGeometry(.2*size,.42*size,6,12),shirt,1.08);m(new T.SphereGeometry(.15*size,18,14),0xe8c0a2,1.56);
 const h=m(new T.SphereGeometry(.165*size,18,14),hair,1.6);h.scale.set(1,long?1.05:.85,1);h.position.z=-.03*size;if(long)h.position.y-=.05*size;g.add(halo3(.42*size));g.userData.tall=1.78*size;return g;}
const halo3=r=>{const ring=new T.Mesh(new T.TorusGeometry(r,.028,8,40),new T.MeshBasicMaterial({color:0x9fd8ff}));ring.rotation.x=Math.PI/2;ring.position.y=.13;return ring;};
function dogFigure(){const g=new T.Group(),m=(geo,x,y,z)=>{const k=new T.Mesh(geo,mat(0xb48a5a));k.position.set(x,y,z);k.castShadow=true;g.add(k);return k;};
 m(new T.BoxGeometry(.24,.24,.6),0,.36,0);m(new T.BoxGeometry(.2,.2,.24),0,.52,.36);m(new T.BoxGeometry(.06,.2,.06),0,.5,-.32);for(const [x,z] of [[-.08,.2],[.08,.2],[-.08,-.2],[.08,-.2]])m(new T.BoxGeometry(.06,.26,.06),x,.13,z);g.add(halo3(.5));g.userData.tall=.8;return g;}
const family=[
 {node:A.human({top:0x6fb5a0,bottom:0x34405a,hair:0x4a3326,style:'court',accent:0x9fd8ff}),label:'Personne',name:'Marc',a:[X(372),Z(300)],b:[X(410),Z(300)],y:0,up:false,every:9},
 {node:A.human({top:0xe88f6f,bottom:0x2f3f5c,hair:0x2c1f18,style:'long',skin:0xe0ac82,accent:0x9fd8ff}),label:'Personne',name:'Sarah',a:[X(520),Z(430)],b:[X(470),Z(440)],y:0,up:false,every:11},
 {node:A.human({kind:'enfant',top:0x7aa2e3,bottom:0x3a4660,hair:0x6b4a2f,style:'boucles',accent:0x9fd8ff}),label:'Enfant',name:'Léo',a:[X(518),Z(406)],b:[X(533),Z(406)],y:0,up:false,every:7},   // the child plays on the rug, below the low table, clear of the chairs and the sofa
 {node:A.human({kind:'enfant',top:0xf2c14e,bottom:0x5b6aa8,hair:0x3a2a20,style:'long',accent:0x9fd8ff}),label:'Enfant',name:'Emma',a:[X(470)-.01,Z(470)],b:[X(470),Z(470)],y:2.75,up:true,every:8,at:null},
 {node:A.dog({fur:0xb48a5a,accent:0x9fd8ff}),label:'Chien',name:'Rio',a:[X(760),Z(540)],b:[X(840),Z(470)],y:0,up:false,every:13,dog:true}
];
family[3].a=[sx(-2.1),sz(-.2)];family[3].b=[sx(-2.1),sz(.6)];for(const f of family)house.add(f.node);
// The garden camera of the alert scene, its red field of view on the lawn and the dashed way the person walked.
const guard={cam:new T.Group(),at:new T.Vector3(X(945),2.4,Z(232)),walked:[]};
{const body=new T.Mesh(new T.BoxGeometry(.34,.2,.2),mat(0xe9ecf1,{roughness:.4}));const lens=new T.Mesh(new T.CylinderGeometry(.07,.07,.08,16),mat(0x10141b,{roughness:.2}));lens.rotation.x=Math.PI/2;lens.position.z=.13;
 const led=new T.Mesh(new T.SphereGeometry(.03,10,8),new T.MeshBasicMaterial({color:0xff4b3a}));led.position.set(.11,.06,.1);guard.cam.add(body,lens,led);guard.cam.position.copy(guard.at);house.add(guard.cam);{const grab=new T.Mesh(new T.SphereGeometry(.45,10,8),new T.MeshBasicMaterial({visible:false}));guard.cam.add(grab);}
 const pole=new T.Mesh(new T.CylinderGeometry(.03,.03,2.4,8),mat(0x2a2f38));pole.position.set(guard.at.x,1.2,guard.at.z+.05);guard.pole=pole;pole.visible=false;house.add(pole);}
guard.cone=new T.Mesh(new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(new Float32Array(9),3)),new T.MeshBasicMaterial({color:0xff2d20,transparent:true,opacity:.38,side:T.DoubleSide,depthWrite:false}));guard.cone.visible=false;house.add(guard.cone);
guard.trail=new T.Line(new T.BufferGeometry(),new T.LineDashedMaterial({color:0xff3b30,dashSize:.35,gapSize:.22,transparent:true,opacity:.95}));guard.trail.visible=false;house.add(guard.trail);
function watchGuard(show,p){guard.pole.visible=show;guard.cone.visible=guard.trail.visible=show&&!!p;if(!show||!p){guard.walked.length=0;return;}
 const c=guard.at,dx=p.x-c.x,dz=p.z-c.z,l=Math.hypot(dx,dz)||1,nx=-dz/l*1.4,nz=dx/l*1.4,a=guard.cone.geometry.attributes.position;
 a.setXYZ(0,c.x,.06,c.z);a.setXYZ(1,p.x+nx,.06,p.z+nz);a.setXYZ(2,p.x-nx,.06,p.z-nz);a.needsUpdate=true;guard.cone.geometry.computeBoundingSphere();guard.cam.lookAt(p.x,.9,p.z);
 const last=guard.walked[guard.walked.length-1];if(!last||Math.hypot(last.x-p.x,last.z-p.z)>.25)guard.walked.push(new T.Vector3(p.x,.07,p.z));
 guard.trail.geometry.setFromPoints(guard.walked);guard.trail.computeLineDistances();}
const cctv={target:null,cam:new T.PerspectiveCamera(62,1.6,.15,90),rt:new T.WebGLRenderTarget(320,200),buf:new Uint8Array(320*200*4),n:0,seed:1};
function filmCam(c,targets){if(!targets.length)return;
 const subject=c.id==='jardin'&&person.visible?person.position:c.id==='piscine'&&kid.visible?kid.position:c.id==='entree'&&courier.visible?courier.position:c.id==='entree'&&playing&&car.visible&&car.position.z<Z(330)?car.position:null;
 cctv.cam.position.copy(c.pos).add(new T.Vector3(0,-.08,0));if(subject)cctv.cam.lookAt(subject.x,.8,subject.z);else cctv.cam.lookAt(c.aim);
 const hide=[guard.cone,guard.trail,guard.pole,...cams.flatMap(k=>[k.node,k.cone])].map(o=>[o,o.visible]);for(const [o] of hide)o.visible=false;
 renderer.setRenderTarget(cctv.rt);renderer.render(scene,cctv.cam);renderer.readRenderTargetPixels(cctv.rt,0,0,320,200,cctv.buf);renderer.setRenderTarget(null);
 for(const [o,v] of hide)o.visible=v;
 const ir=night>.5,b=cctv.buf;let sum=0;for(let i=0;i<b.length;i+=64)sum+=.3*b[i]+.59*b[i+1]+.11*b[i+2];
 // automatic exposure, like a real camera: a dark garden is lifted, a lit room is not burnt
 const mean=sum/(b.length/64),gain=Math.max(.9,Math.min(3.1,105/Math.max(1,mean))),lift=mean<40?26:6;
 for(const t of targets){const ctx=t.getContext('2d');if(!ctx)continue;if(t.width!==320){t.width=320;t.height=200;}const img=ctx.createImageData(320,200),d=img.data;
  for(let y=0;y<200;y++)for(let x=0;x<320;x++){const i=((199-y)*320+x)*4,o=(y*320+x)*4;cctv.seed=(cctv.seed*16807)%2147483647;const n=(cctv.seed%17)-8,dx=(x-160)/160,dy=(y-100)/100,vig=1-.3*(dx*dx+dy*dy);
   if(ir){const v=Math.max(0,Math.min(255,((.3*b[i]+.59*b[i+1]+.11*b[i+2])*gain+lift+n)*vig));d[o]=d[o+1]=d[o+2]=v;}else{d[o]=Math.max(0,Math.min(255,(b[i]+n)*vig));d[o+1]=Math.max(0,Math.min(255,(b[i+1]+n)*vig));d[o+2]=Math.max(0,Math.min(255,(b[i+2]+n)*vig));}d[o+3]=255;}
  ctx.putImageData(img,0,0);}}
function filmAll(){if(!cams[0].badge){for(const c of cams)c.indoor=['salon','cuisine'].includes(c.id);makeBadges();const b=tag('',530,229,2.85,{press:()=>$('clim-power').click()});b.el.classList.add('ac-badge');b.el.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v8"/><path d="M6.3 6.8a8 8 0 1 0 11.4 0"/></svg>';b.el.setAttribute('aria-label','Allumer ou éteindre la clim');acUnit.userData.badge=b;}
 acUnit.userData.badge.show=!floorUp;acUnit.userData.badge.el.classList.toggle('on',clim.on);for(const c of cams){c.node.visible=false;c.badge.show=signedIn&&!(floorUp&&c.indoor);c.badge.el.classList.toggle('alert',camAlert===c.id);c.badge.el.classList.toggle('on',camOpen===c.id&&camAlert!==c.id);}guard.pole.visible=false;
 if(!signedIn||document.documentElement.classList.contains('only-scene'))return;cctv.n++;
 for(const c of cams){const show=camOpen===c.id&&!(c.guard&&guard.cone.visible);c.cone.visible=show;if(show){const subj=c.id==='piscine'&&kid.visible?kid.position:c.aim;camCone(c,subj,camAlert===c.id);}c.node.userData.led?.material.color.setHex(camAlert===c.id?0xff3b30:0x7fd3a0);}
 // the open camera every other frame, the strip of thumbnails in turn on the other frames, the page's own feed (accueil) with the garden
 if(cctv.n%2===0&&camOpen){const c=camById(camOpen),t=[$('camcard-feed')];if(c.id==='jardin'&&cctv.target)t.push(cctv.target);filmCam(c,t);return;}
 const k=cams[(cctv.n>>1)%cams.length],t=[...document.querySelectorAll(`[data-cam="${k.id}"] canvas`)];if(k.id==='jardin'&&cctv.target&&!camOpen)t.push(cctv.target);
 if(t.length&&cctv.n%6<2)filmCam(k,t);}
// ---------- the cameras of the house: on their wall, touched to see what they see in a card at the top right.
// The garden camera is the guard of the alert scene. Their pictures are drawn from the 3D house (simulated).
function camModel(){const g=new T.Group();const body=new T.Mesh(new T.BoxGeometry(.3,.18,.18),mat(0xe9ecf1,{roughness:.4}));const lens=new T.Mesh(new T.CylinderGeometry(.06,.06,.07,16),mat(0x10141b,{roughness:.2}));lens.rotation.x=Math.PI/2;lens.position.z=.12;
 const led=new T.Mesh(new T.SphereGeometry(.026,10,8),new T.MeshBasicMaterial({color:0x7fd3a0}));led.position.set(.1,.05,.09);g.add(body,lens,led);g.userData.led=led;
 const grab=new T.Mesh(new T.SphereGeometry(.45,10,8),new T.MeshBasicMaterial({visible:false}));g.add(grab);return g;}
const cams=[
 {id:'entree',name:'Entrée',at:[228,196,2.7],look:[185,170,.8]},   // on the gate pillar, away from the gate lamp
 {id:'salon',name:'Salon',at:[564,302,2.4],look:[500,380,.6]},
 {id:'cuisine',name:'Cuisine',at:[452,262,2.4],look:[380,290,.6]},
 {id:'jardin',name:'Jardin',at:[945,232,2.4],look:[820,420,.6],guard:true},
 {id:'piscine',name:'Piscine',at:[985,650,2.4],look:[790,740,.3]}];
for(const c of cams){c.pos=new T.Vector3(X(c.at[0]),c.at[2],Z(c.at[1]));c.aim=new T.Vector3(X(c.look[0]),c.look[2],Z(c.look[1]));c.node=c.guard?guard.cam:camModel();
 if(!c.guard){c.node.position.copy(c.pos);house.add(c.node);}c.node.lookAt(c.aim);c.node.traverse(o=>{o.userData.cam=c.id;});
 c.cone=new T.Mesh(new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(new Float32Array(9),3)),new T.MeshBasicMaterial({color:0x7fd3a0,transparent:true,opacity:.16,side:T.DoubleSide,depthWrite:false}));house.add(c.cone);c.cone.visible=false;}
const camById=id=>cams.find(c=>c.id===id);
// Light, like the other badges of the house: a round glowing button on the wall, no camera body drawn.
const camIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h8A1.5 1.5 0 0 1 15 8.5v7a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 4 15.5z"/><path d="m15 10.5 4.2-2.4c.4-.2.8 0 .8.5v6.8c0 .5-.4.7-.8.5L15 13.5"/></svg>';
// made on the first frame: the labels layer (tag, tags) is set up further down
const makeBadges=()=>{for(const c of cams){c.badge=tag('',c.at[0],c.at[1],c.at[2],{press:()=>openCam(camOpen===c.id?null:c.id)});c.badge.el.classList.add('cam-badge');c.badge.el.innerHTML=camIcon;c.badge.el.setAttribute('aria-label','Caméra '+c.name);c.badge.show=false;}};
let camOpen=null,camAlert=null;
function camCone(c,p,red){const d=c.cone.geometry.attributes.position,dx=p.x-c.pos.x,dz=p.z-c.pos.z,l=Math.hypot(dx,dz)||1,nx=-dz/l*1.3,nz=dx/l*1.3;
 d.setXYZ(0,c.pos.x,.06,c.pos.z);d.setXYZ(1,p.x+nx,.06,p.z+nz);d.setXYZ(2,p.x-nx,.06,p.z-nz);d.needsUpdate=true;c.cone.geometry.computeBoundingSphere();c.cone.material.color.setHex(red?0xff2d20:0x7fd3a0);c.cone.material.opacity=red?.34:.16;}
let camTitle=null;
function openCam(id,alert,title){if(id&&!signedIn)return;camOpen=id;camAlert=alert?id:null;camTitle=id?title||null:null;const c=camById(id),card=$('camcard');if(!card)return;
 card.hidden=!id;card.classList.toggle('alert',!!alert);if(!id)return;const head=title||(alert?'Personne inconnue':'Caméra '+c.name);card.querySelector('b').textContent=head;card.querySelector('small').textContent=head.startsWith('Caméra')?'En direct · simulé':'Caméra '+c.name;
 for(const t of document.querySelectorAll('[data-cam]'))t.classList.toggle('on',t.dataset.cam===id);}
$('camcard-x')?.addEventListener('click',()=>openCam(null));
for(const t of document.querySelectorAll('[data-cam]'))t.addEventListener('click',()=>openCam(camOpen===t.dataset.cam?null:t.dataset.cam));
const person=A.human({top:0x26282e,bottom:0x1b1d22,hair:0x15161a,style:'court',skin:0xc68b5e,accent:0xff4b3a});person.visible=false;house.add(person);

// ---------- lamps: a ball on its wire is the switch, and it really lights the room
const halo=(()=>{const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d'),r=g.createRadialGradient(64,64,0,64,64,64);r.addColorStop(0,'rgba(255,236,190,1)');r.addColorStop(.25,'rgba(255,214,140,.55)');r.addColorStop(1,'rgba(255,200,120,0)');g.fillStyle=r;g.fillRect(0,0,128,128);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;})();
const lampList=[
 {id:'kitchen',name:'Cuisine',at:[388,272],h:1.9,power:9},{id:'living',name:'Séjour',at:[530,345],h:1.9,power:12},{id:'dining',name:'Salle à manger',at:[492,364],h:1.75,power:9},
 {id:'bath',name:'Salle d’eau',at:[357,392],h:1.9,power:7},{id:'laundry',name:'Buanderie',at:[440,522],h:1.9,power:11},{id:'terrace',name:'Terrasse',at:[450,632],h:2,power:11},
 {id:'stairs',name:'Escalier',at:[593,470],h:3.1,power:8},{id:'entry',name:'Portail',at:[185,238],h:1.7,power:12},{id:'garage',name:'Garage',at:[82,400],h:2,power:11},
 {id:'garden1',name:'Jardin · haut · gauche',at:[634,232],h:.7,power:9,low:true},{id:'garden2',name:'Jardin · haut · droite',at:[942,232],h:.7,power:9,low:true},{id:'garden3',name:'Jardin · bas · droite',at:[942,668],h:.7,power:9,low:true},{id:'garden4',name:'Jardin · bas · gauche',at:[700,668],h:.7,power:9,low:true},{id:'gazebo',name:'Gazebo',at:[595,667],h:2,power:8},
 {id:'pool',name:'Piscine',at:[830,784],h:-.5,power:14,cool:true},
 {id:'master',name:'Chambre · gauche',at:[ru(-1.6),rv(2.5)],h:4.55,power:9,up:true},{id:'guest',name:'Chambre · droite',at:[ru(3.3),rv(2.4)],h:4.55,power:9,up:true},{id:'children',name:'Chambre des enfants',at:[ru(-2),rv(-1.2)],h:4.55,power:9,up:true},
 {id:'blue',name:'Chambre au lit bleu',at:[ru(2.9),rv(-1.8)],h:4.55,power:9,up:true},{id:'bathup',name:'Salle de bain',at:[ru(.2),rv(-1.6)],h:4.55,power:7,up:true},{id:'hallup',name:'Couloir du haut',at:[ru(2),rv(.45)],h:4.55,power:7,up:true}
];
const lamps=new Map(),hits=[];
for(const def of lampList){
 const g=new T.Group();g.position.set(X(def.at[0]),def.h,Z(def.at[1]));
 const ball=new T.Mesh(new T.SphereGeometry(def.low?.13:.16,28,18),new T.MeshBasicMaterial({color:0x7d8796}));
 const glow=new T.Sprite(new T.SpriteMaterial({map:halo,color:def.cool?0x7fe3ff:0xffffff,transparent:true,opacity:0,depthWrite:false,blending:T.AdditiveBlending}));glow.scale.setScalar(def.cool?5:1.7);
 const light=new T.PointLight(def.cool?0x58d4ff:0xffd9a0,0,def.cool?9:8.5,1.6);
 if(def.cool)ball.visible=false;
 else if(def.low){const stake=new T.Mesh(new T.CylinderGeometry(.03,.03,def.h,8),mat(0x1a1f27));stake.position.y=-def.h/2;g.add(stake);}
 else{const wire=new T.Mesh(new T.CylinderGeometry(.01,.01,1.1,6),mat(0x0b0e13));wire.position.y=.71;const cap=new T.Mesh(new T.CylinderGeometry(.05,.07,.06,12),mat(0x1a1f27));cap.position.y=.17;g.add(wire,cap);}
 const hit=new T.Mesh(new T.SphereGeometry(def.cool?1.6:.5,12,8),new T.MeshBasicMaterial({visible:false}));hit.userData.lamp=def.id;
 g.add(ball,glow,light,hit);house.add(g);hits.push(hit);
 lamps.set(def.id,{...def,group:g,ball,glow,light,on:false,level:0,pulse:0});
}

// ---------- small labels, as on a dashboard: a few readings, no more
const tags=[];
function tag(text,u,v,h,o={}){const el=document.createElement(o.press?'button':'span');el.className='tag'+(o.alert?' alert':'')+(o.press?' press':'');el.textContent=text;if(o.press)el.addEventListener('click',o.press);labelsEl.append(el);const t={el,pos:new T.Vector3(X(u),h,Z(v)),show:true};tags.push(t);return t;}
for(const f of family){f.tag=tag(f.name||f.label,0,0,0);f.tag.el.classList.add('who-tag');}
const gateTag=tag('Portail · Fermé',185,200,2.1,{press:()=>toggleGate()});gateTag.show=false;   // no fixed label over the gate: its state is in the dashboard, and a change is said once
// What the new scenes need: a child who wanders to the pool, water on the laundry floor, readings on the roof.
const kid=A.human({kind:'enfant',top:0xf2c14e,bottom:0x5b6aa8,hair:0x6b4a2f,style:'boucles',accent:0xff8f7d});kid.visible=false;house.add(kid);
const puddle=new T.Mesh(new T.CircleGeometry(1,40),new T.MeshStandardMaterial({color:0x4fb4ff,roughness:.05,metalness:.2,transparent:true,opacity:.55}));puddle.rotation.x=-Math.PI/2;puddle.position.set(X(372),.14,Z(505));puddle.scale.setScalar(.01);puddle.visible=false;house.add(puddle);
const leakTag=tag('Fuite d’eau',372,505,1.4,{alert:true});leakTag.show=false;const valveTag=tag('Vanne · Ouverte',345,486,1.9);valveTag.show=false;const washTag=tag('Lave-linge · en marche',380,487,1.5);washTag.show=false;
const sunTag=tag('Production · 0,0 kW',82,410,3.2);sunTag.show=false;const poolTag=tag('Enfant près du bassin',760,700,1.6,{alert:true});poolTag.show=false;
const courier=A.human({top:0xf0b429,bottom:0x3b3f46,hair:0x2a1d14,style:'court',accent:0xf0b429});courier.visible=false;house.add(courier);
const parcel=new T.Mesh(new T.BoxGeometry(.45,.32,.36),mat(0xc89a62,{roughness:.9}));parcel.position.set(X(205),.16,Z(236));parcel.visible=false;house.add(parcel);
const tempTag=tag('24,5°',500,290,1.9);tempTag.low=true;tag('68 %',345,425,1.7).low=true;const motionTag=tag('Mouvement',880,430,2.1,{alert:true});motionTag.show=false;

// ---------- the camera: an orbit with inertia
const centre=new T.Vector3(X(500),.4,Z(500));
const orbit={target:centre.clone(),az:0,pol:.06,dist:52,vaz:0,vpol:0};
const home={target:centre.clone(),az:-.62,pol:.9,dist:40};
let fly=null,focused=null;
function flyTo(to,ms=1300){fly={from:{target:orbit.target.clone(),az:orbit.az,pol:orbit.pol,dist:orbit.dist},to:{...to,target:to.target.clone()},t0:performance.now(),ms:reduce?1:ms};orbit.vaz=orbit.vpol=0;}
function place(){const s=Math.sin(orbit.pol),c=Math.cos(orbit.pol);camera.position.set(orbit.target.x+orbit.dist*s*Math.sin(orbit.az),orbit.target.y+orbit.dist*c,orbit.target.z+orbit.dist*s*Math.cos(orbit.az));camera.lookAt(orbit.target);}
function resize(){const w=stageEl.clientWidth,h=stageEl.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();home.dist=clamp(40*Math.max(1,1.45/camera.aspect),38,120);}
new ResizeObserver(resize).observe(stageEl);resize();

const pointers=new Map();let moved=0,pinch=0;
canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});moved=0;fly=null;canvas.classList.add('dragging');hint();});
canvas.addEventListener('pointermove',e=>{
 const p=pointers.get(e.pointerId);
 if(!p){canvas.classList.toggle('over',!!pick(e));return;}
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
const shown=o=>{for(let n=o;n;n=n.parent)if(!n.visible)return false;return true;};
function pick(e){const r=canvas.getBoundingClientRect();ndc.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(ndc,camera);
 const lamp=ray.intersectObjects(hits,false).find(h=>!!lamps.get(h.object.userData.lamp).up===floorUp||!lamps.get(h.object.userData.lamp).up&&!indoor.has(h.object.userData.lamp));if(lamp)return {lamp:lamp.object.userData.lamp};
 for(const h of ray.intersectObjects(house.children,true)){const d=h.object.userData;if(d.cam&&signedIn)return {cam:d.cam};if(!shown(h.object))continue;if(d.gate)return {gate:true};if(d.door!==undefined)return {door:d.door};if(d.room)return {room:d.room};}
 return null;}
function tap(e){if(live.tap?.(e))return;const hit=pick(e);if(!hit)return;if(hit.cam&&signedIn){openCam(camOpen===hit.cam?null:hit.cam);return;}if(!member&&!hit.room){invite();return;}if(hit.lamp)toggle(hit.lamp);else if(hit.gate)toggleGate();else if(hit.door!==undefined)swing(hit.door);else if(hit.room)enter(hit.room);}
function swing(i){const d=doors[i];d.held=!d.held;say(`Porte · <b>${d.held?'Ouverte':'Fermée'}</b>`);}
function view(id){const [a,b,c,d]=rooms[id].rect,w=Math.abs(X(c)-X(a)),dz=Math.abs(Z(d)-Z(b));return {target:new T.Vector3((X(a)+X(c))/2,.6+(rooms[id].up||0),(Z(b)+Z(d))/2),az:orbit.az,pol:clamp(orbit.pol,.55,.85),dist:clamp(Math.max(w,dz)*2.6/Math.min(1,camera.aspect),11,36)};}
function enter(id){if(!rooms[id])return;manual();if(focused===id){leave();return;}focused=id;flyTo(view(id));back.hidden=false;say(`<b>${rooms[id].name}</b>`);live.enter?.(id);}
function leave(){focused=null;back.hidden=true;flyTo(home);live.leave?.();}
function invite(){say('Créez votre accès pour piloter la maison');intro?.classList.remove('gone');}

const back=$('back');back.addEventListener('click',leave);
// Two floors: the upper one is set on the house when it is asked for.
const indoor=new Set(['kitchen','living','dining','bath','laundry']);let floorUp=false;
function floor(up,quiet){floorUp=!!up;upper.visible=floorUp;focused=null;back.hidden=true;home.target.y=floorUp?2.9:.4;flyTo(home,900);
 for(const b of document.querySelectorAll('[data-floor]'))b.setAttribute('aria-pressed',String(b.dataset.floor!=='garden'&&(b.dataset.floor==='up')===floorUp));if(!quiet)say(floorUp?'<b>Étage</b>':'<b>Rez-de-chaussée</b>');}
for(const b of document.querySelectorAll('[data-floor]'))b.addEventListener('click',()=>{manual();if(b.dataset.floor==='garden'){floor(false,true);flyTo({target:new T.Vector3(X(790),.4,Z(560)),az:.35,pol:.9,dist:24},1000);for(const o of document.querySelectorAll('[data-floor]'))o.setAttribute('aria-pressed',String(o===b));return;}floor(b.dataset.floor==='up');});

// ---------- state: lamps, gate, ambiance, and the dashboard that shows it
const toast=$('toast'),statusEl=$('status'),listEl=$('list'),who=$('who');let toastTimer=0;
function say(html){toast.innerHTML=html;toast.classList.add('on');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('on'),1900);}
const clim={on:false,set:23},shutter={open:1,target:1};
function refresh(){queueMicrotask(()=>typeof air==='function'&&air());
 const n=[...lamps.values()].filter(l=>l.on).length;
 statusEl.textContent=`Lumières allumées ${n} · ${gate.target?'Portail ouvert':'Portail fermé'}`;
 $('count').textContent=`${n}/${lamps.size}`;$('active').textContent=`Actifs ${n+(gate.target?1:0)+(clim.on?1:0)+(shutter.target?0:1)}/${lamps.size+3}`;
 $('shutter-state').textContent=shutter.target?'Ouverts':'Fermés';$('shutter-tile').setAttribute('aria-pressed',String(!shutter.target));
 $('gate-state').textContent=gate.target?'Ouvert':'Fermé';$('gate-tile').setAttribute('aria-pressed',String(!!gate.target));gateTag.el.textContent='Portail · '+(gate.target?'Ouvert':'Fermé');
 $('clim-state').textContent=clim.on?`ON · ${clim.set},0 °C`:'OFF · 26,0 °C';$('clim-set').textContent=clim.set+' °C';$('clim-power').setAttribute('aria-pressed',String(clim.on));
 for(const b of listEl.querySelectorAll('button')){const l=lamps.get(b.dataset.lamp);b.setAttribute('aria-pressed',String(l.on));b.querySelector('small').textContent=l.on?'ALLUMÉE':'ÉTEINTE';}
}
function set(id,on,quiet){const l=lamps.get(id);if(!l||l.on===on)return;l.on=on;l.pulse=1;if(!quiet)say(`${l.name} · <b>${on?'Allumée':'Éteinte'}</b>`);refresh();}
const toggle=id=>{manual();set(id,!lamps.get(id).on);};
function setShutters(open,quiet){if(!!shutter.target===!!open)return;shutter.target=open?1:0;if(!quiet)say(`Volets · <b>${open?'Ouverts':'Fermés'}</b>`);refresh();}
function setGate(open,quiet){if(!!gate.target===!!open)return;gate.target=open?1:0;if(!quiet)say(`Portail · <b>${open?'Ouvert':'Fermé'}</b>`);refresh();}
const toggleGate=()=>{manual();setGate(!gate.target);};
for(const l of lampList){const li=document.createElement('li');li.innerHTML=`<button data-lamp="${l.id}" aria-pressed="false"><i></i><span>${l.name}<small></small></span></button>`;li.firstChild.addEventListener('click',()=>toggle(l.id));listEl.append(li);}
const modes={day:{night:0,on:[]},evening:{night:1,on:['kitchen','living','dining','laundry','terrace','garden1','garden2','garden3','garden4','pool','entry','children','blue','hallup']},night:{night:1,on:['entry']}};
const modeShutters={day:true,evening:true,night:false};
let night=1,nightTarget=1;
function mode(name,quiet){const m=modes[name];nightTarget=m.night;for(const id of lamps.keys())set(id,m.on.includes(id),true);stageEl.classList.toggle('day',!m.night);
 for(const b of document.querySelectorAll('[data-mode]'))b.setAttribute('aria-pressed',String(b.dataset.mode===name));
 if(!quiet)say({day:'Bonjour · <b>Lumière du jour</b>',evening:'Soirée · <b>Lumières douces</b>',night:'Bonne nuit · <b>Tout s’éteint</b>'}[name]);refresh();}
for(const b of document.querySelectorAll('[data-mode]'))b.addEventListener('click',()=>{manual();mode(b.dataset.mode);setShutters(modeShutters[b.dataset.mode],true);});
$('gate-tile').addEventListener('click',toggleGate);$('shutter-tile').addEventListener('click',()=>{manual();setShutters(!shutter.target);});
$('all-on').addEventListener('click',()=>{manual();for(const id of lamps.keys())set(id,true,true);say('Éclairage · <b>Tout allumé</b>');});
$('all-off').addEventListener('click',()=>{manual();for(const id of lamps.keys())set(id,false,true);say('Éclairage · <b>Tout éteint</b>');});
$('clim-power').addEventListener('click',()=>{clim.on=!clim.on;say(`Clim · RDC · <b>${clim.on?'Allumée':'Éteinte'}</b>`);refresh();});
$('clim-less').addEventListener('click',()=>{clim.set=clamp(clim.set-1,17,28);refresh();});$('clim-more').addEventListener('click',()=>{clim.set=clamp(clim.set+1,17,28);refresh();});
// Who is where: the counter opens the list; a name flies the view to them. The air of the house sits just below.
const U=x=>x/0.03396+470,V=z=>z/0.021227+470;
function placeOf(o,up){if(up)return 'Étage';const u=U(o.position.x),v=V(o.position.z);for(const r of Object.values(rooms)){const [a,b,c,d]=r.rect;if(u>=a&&u<=c&&v>=b&&v<=d)return r.name;}return 'Dehors';}
function whoList(){const ul=$('who-list');if(!ul)return;const rows=[];
 const people=playing?[]:family.filter(f=>!f.dog&&(f.node.visible||f.up)),pets=family.filter(f=>f.dog&&f.node.visible);
 if(people.length)rows.push(['Personnes',people.map(f=>[f.name||f.label,placeOf(f.node,f.up),f.node,f.label==='Personne'?'Adulte':f.label])]);
 if(pets.length)rows.push(['Animaux',pets.map(f=>[f.name||f.label,placeOf(f.node,false),f.node,f.label])]);
 if(car.visible)rows.push(['Voitures',[['Voiture',placeOf(car,false),car]]]);
 const html=rows.map(([g,list])=>`<li class="g">${g}</li>`+list.map(([n,w,,role],i)=>`<li><button data-who="${g}|${i}"><i class="av">${n[0]}</i><span><b>${n}</b>${role&&role!==n?`<em>${role}</em>`:''}</span><small>${w}</small></button></li>`).join('')).join('')||'<li class="g">Aucune présence</li>';
 if(ul.dataset.html!==html){ul.dataset.html=html;ul.innerHTML=html;for(const b of ul.querySelectorAll('[data-who]'))b.addEventListener('click',()=>{const [g,i]=b.dataset.who.split('|'),row=rows.find(r=>r[0]===g),o=row?.[1][+i]?.[2];if(o){manual();flyTo({target:o.position.clone().setY(.8),az:orbit.az,pol:.9,dist:12},900);}});}}
$('who').addEventListener('click',()=>{const box=$('whobox'),open=box.hidden;box.hidden=!open;$('who').setAttribute('aria-expanded',String(open));if(open)whoList();});
setInterval(()=>{if(!$('whobox').hidden)whoList();},1000);
function air(){$('air-now').textContent=(clim.on?clim.set:24.5).toString().replace('.',',')+'°';$('air-mode').textContent=clim.on?'Clim · froid':'Clim · éteinte';$('air-set').textContent=clim.set+'°';$('air-power').setAttribute('aria-pressed',String(clim.on));$('air').classList.toggle('on',clim.on);}
$('air-power').addEventListener('click',()=>$('clim-power').click());$('air-less').addEventListener('click',()=>$('clim-less').click());$('air-more').addEventListener('click',()=>$('clim-more').click());
// The air conditioner of the living room, on the back wall: when it runs, its cold air is seen flowing into the room.
const acUnit=new T.Group();{const body=new T.Mesh(new T.BoxGeometry(.95,.3,.24),mat(0xe9edf2,{roughness:.35}));const vent=new T.Mesh(new T.BoxGeometry(.85,.04,.02),new T.MeshBasicMaterial({color:0x2a3240}));vent.position.set(0,-.1,.125);
 const glow=new T.Mesh(new T.BoxGeometry(.8,.02,.01),new T.MeshBasicMaterial({color:0x8fd3ff}));glow.position.set(0,-.13,.13);acUnit.add(body,vent,glow);acUnit.userData.glow=glow;}
acUnit.position.set(X(530),2.32,Z(229)+.14);house.add(acUnit);
const streaks=[],streakMat=new T.MeshBasicMaterial({color:0x6fc8ff,transparent:true,opacity:0,blending:T.AdditiveBlending,depthWrite:false});
for(let i=0;i<46;i++){const m=new T.Mesh(new T.BoxGeometry(.018,.018,.42),streakMat.clone());m.userData={phase:Math.random(),lane:(Math.random()-.5)*.8,drop:.6+Math.random()*.7,speed:.35+Math.random()*.25};m.visible=false;house.add(m);streaks.push(m);}
let airT=0;
function airFlow(dt){airT+=dt;const on=clim.on&&!floorUp;acUnit.userData.glow.material.color.setHex(on?0x8fd3ff:0x3a4352);
 for(const m of streaks){m.visible=on;if(!on)continue;const d=m.userData,p=(airT*d.speed+d.phase)%1;
  // from the vent, forward into the room and gently down, spreading a little
  const x=acUnit.position.x+d.lane*(1+p*1.8),y=acUnit.position.y-.14-p*p*d.drop*1.4,z=acUnit.position.z+.05+p*2.3;
  m.position.set(x,y,z);m.lookAt(x+d.lane*.25,y-p*d.drop*1.2-.3,z+1);m.material.opacity=Math.sin(p*Math.PI)*.6;}}
const hintEl=$('hint');let hinted=false;function hint(){if(hinted)return;hinted=true;setTimeout(()=>hintEl.classList.add('gone'),2500);}
addEventListener('keydown',e=>{if(e.key==='Escape'&&focused)leave();});

// ---------- scenes: thirty seconds each, played in the house itself
const along=(pts,t)=>{const n=pts.length-1,k=clamp(t,0,1)*n,i=Math.min(n-1,Math.floor(k)),f=k-i,a=pts[i],b=pts[i+1];return {u:a[0]+(b[0]-a[0])*f,v:a[1]+(b[1]-a[1])*f,heading:Math.atan2(X(b[0])-X(a[0]),Z(b[1])-Z(a[1]))};};
const driveIn=[street,[185,120],[185,215],[185,340],[185,430],parked],walkIn=[[950,330],[880,345],[800,395],[735,450],[690,470]];
const DURATION=30,gateView={target:new T.Vector3(X(190),.5,Z(330)),az:-.9,pol:.95,dist:30};
// The way from the car to the upper floor: across the gravel, along the terrace, up the outside stairs, into the hall.
const outside=[[185,566],[236,640],[300,700],[560,712],[593,668],[593,640,0],[593,416,2.75],[593,395,2.75]].map(([u,v,y=0])=>[X(u),Z(v),y]);
const inside=[[X(593),Z(395),2.75],[sx(4.3),sz(.42),2.75],[sx(3.65),sz(.42),2.75],[sx(3.65),sz(-.6),2.75],[sx(3.9),sz(-2),2.75]];
const stroll=(pts,t)=>{const n=pts.length-1,k=clamp(t,0,1)*n,i=Math.min(n-1,Math.floor(k)),f=k-i,a=pts[i],b=pts[i+1];return {x:a[0]+(b[0]-a[0])*f,y:a[2]+(b[2]-a[2])*f,z:a[1]+(b[1]-a[1])*f,heading:Math.atan2(b[0]-a[0],b[1]-a[1])};};
const walk=(pts,t)=>{const p=stroll(pts,t);resident.position.set(p.x,p.y,p.z);resident.rotation.y=p.heading;};
const upstairsView=()=>({target:new T.Vector3(sx(1.2),3,sz(-.2)),az:-.5,pol:.78,dist:25});
// Each scene ends on what the house did for you, written in the dashboard (never over the house).
const poolWalk=[[490,600],[530,650],[640,690],[705,712],[728,722]],poolBack=[[728,722],[640,690],[540,650],[490,600]];   // round the garden table (432-472, 604-640), never through it
const scenes={
 arrival:{result:'Le portail a reconnu la voiture. La maison était prête avant que vous ne passiez la porte.',
  steps:[[0,'Le portail s’ouvre.'],[5,'La voiture rejoint sa place.'],[12,'Elle descend de voiture. La terrasse et le séjour s’allument.'],[19,'Elle monte à l’étage : les volets s’ouvrent tout seuls.'],[26,'Bienvenue à la maison.']],
  start(){mode('night',true);set('entry',false,true);shutter.target=0;shutter.open=0;flyTo(gateView,1600);},
  at(t,s){if(t>2&&t<11.5&&camOpen!=='entree')openCam('entree',false,'Voiture reconnue');if(t>12&&camOpen==='entree'&&camTitle==='Voiture reconnue')openCam(null);setGate(t>1&&t<13,true);set('entry',t>1.5,true);set('garage',t>9,true);set('terrace',t>13,true);set('laundry',t>14,true);set('living',t>15,true);set('dining',t>15.6,true);set('kitchen',t>16.2,true);
   const p=along(driveIn,between(t,3,11.5));car.position.set(X(p.u),0,Z(p.v));car.rotation.y=t<11.5?p.heading:0;beams.intensity=t>2&&t<13?40:0;
   resident.visible=t>12;walk(outside,clamp((t-12)/7.5,0,1));if(t>19.5)walk(inside,clamp((t-19.5)/5,0,1));
   if(t>12.5&&!s.out){s.out=true;flyTo({target:new T.Vector3(X(420),1,Z(640)),az:-.35,pol:.95,dist:30},1800);}
   if(t>19&&!s.up){s.up=true;floor(true,true);flyTo(upstairsView(),1500);}
   setShutters(t>20.5,true);set('hallup',t>20,true);set('blue',t>22.5,true);set('children',t>23.5,true);}},
 departure:{result:'Lumières éteintes, volets et portail fermés, alarme activée. Vous n’avez rien eu à vérifier.',
  steps:[[0,'Elle quitte la chambre. Les lumières s’éteignent.'],[5,'Plus personne à l’étage : les volets se ferment tout seuls.'],[12,'Elle rejoint la voiture. Le portail s’ouvre.'],[17,'La voiture repart.'],[26,'Le portail se referme. La maison veille.']],
  start(){mode('evening',true);shutter.target=1;shutter.open=1;floor(true,true);flyTo(upstairsView(),1200);},
  at(t,s){resident.visible=t<14.5;if(t<5)walk([...inside].reverse(),clamp(t/4.5,0,1));else walk([...outside].reverse(),clamp((t-5)/9,0,1));
   set('blue',t<1.5,true);set('children',t<2.5,true);set('hallup',t<4.5,true);setShutters(t<5,true);
   if(t>8&&!s.down){s.down=true;floor(false,true);flyTo({target:new T.Vector3(X(420),1,Z(640)),az:-.35,pol:.95,dist:30},1500);}
   for(const [id,at] of [['kitchen',8.5],['dining',9],['living',9.5],['laundry',10.5],['terrace',11.5],['garden1',12],['garden2',12],['garden3',12],['garden4',12],['pool',12.5]])set(id,t<at,true);set('entry',true,true);
   if(t>15&&t<25&&camOpen!=='entree')openCam('entree',false,'Départ · portail ouvert');if(t>25.5&&camTitle==='Départ · portail ouvert')openCam(null);
   setGate(t>12&&t<26,true);const p=along([...driveIn].reverse(),between(t,16,25));car.position.set(X(p.u),0,Z(p.v));car.rotation.y=t>16?p.heading:0;beams.intensity=t>15&&t<25?40:0;car.visible=t<25;
   if(t>14&&!s.gone){s.gone=true;flyTo(gateView,1800);}}},
 intrusion:{result:'Alerte reçue en 3 secondes. Volets fermés, jardin éclairé, vidéo gardée sur votre réseau.',
  alert:['Personne non identifiée dans le jardin, à droite.',[['Téléphones','Notification reçue'],['Écran central','Alerte affichée'],['Enceintes','Annonce en cours']]],
  steps:[[0,'Il est 2 h 14. Tout le monde dort.'],[1.2,'Une personne entre dans le jardin, à droite.'],[3.5,'Individu non identifié : l’alerte est relayée.'],[8,'Le jardin s’éclaire. Les volets de l’étage se ferment.']],
  start(){mode('night',true);flyTo({target:new T.Vector3(X(790),.5,Z(430)),az:.55,pol:.98,dist:27},1000);},
  at(t){const p=along(walkIn,between(t,1,20));person.visible=t>1;person.position.set(X(p.u),0,Z(p.v));person.rotation.y=p.heading;motionTag.show=t>2;motionTag.pos.set(X(p.u),2.1,Z(p.v));
   watchGuard(true,t>1.8?person.position:null);
   $('alert').hidden=t<3.5;if(t>3.5&&camAlert!=='jardin')openCam('jardin',true);set('garden1',t>8,true);set('garden2',t>8.3,true);set('garden3',t>8.6,true);set('garden4',t>8.9,true);if(t>8)setShutters(false,true);}},
 pool:{result:'Les parents ont été prévenus en 2 secondes, avant que l’enfant n’atteigne le bord.',
  alert:['Un enfant s’approche de la piscine.',[['Téléphones','Notification reçue'],['Enceintes','« Attention, piscine »'],['Lumière de la piscine','Clignote']]],
  steps:[[0,'Un après-midi à la maison. Un enfant joue sur la terrasse.'],[4,'Il part seul vers la piscine.'],[8,'Il franchit la zone de sécurité : l’alerte part.'],[13,'Un parent le ramène. La zone repasse au vert.']],
  start(){mode('day',true);flyTo({target:new T.Vector3(X(650),.5,Z(680)),az:-.3,pol:.92,dist:22},1100);},
  at(t){kid.visible=true;const out=t<12,p=out?stroll(poolWalk.map(([u,v])=>[X(u),Z(v),0]),clamp((t-3)/6,0,1)):stroll(poolBack.map(([u,v])=>[X(u),Z(v),0]),clamp((t-12)/6,0,1));
   kid.position.set(p.x,0,p.z);kid.rotation.y=p.heading;resident.visible=t>10;if(t>10){const q=stroll([[X(492),Z(596),0],[X(700),Z(705),0],...poolBack.slice(1).map(([u,v])=>[X(u)-.5,Z(v),0])],clamp((t-10)/8,0,1));resident.position.set(q.x,0,q.z);resident.rotation.y=q.heading;}
   const danger=t>8&&t<13;if(danger&&camAlert!=='piscine')openCam('piscine',true);if(!danger&&camAlert==='piscine'&&t>13)openCam('piscine',false);poolTag.show=danger;poolTag.pos.set(p.x,1.6,p.z);$('alert').hidden=!danger;set('pool',danger?Math.floor(t*3)%2===0:false,true);}},
 leak:{result:'Fuite détectée et vanne fermée en 4 secondes. Environ 2 000 € de dégâts évités.',
  alert:['Fuite d’eau sous le lave-linge.',[['Capteur d’eau','Humidité détectée'],['Vanne générale','Fermée'],['Téléphones','Notification reçue']]],
  steps:[[0,'Le lave-linge tourne dans la buanderie.'],[3,'Le tuyau lâche : de l’eau coule au sol.'],[5,'Le capteur sent l’eau. La vanne générale se ferme toute seule.'],[12,'L’eau ne coule plus. Vous êtes prévenu.']],
  start(){mode('day',true);flyTo({target:new T.Vector3(X(380),.4,Z(500)),az:-.2,pol:.85,dist:12},1100);puddle.scale.setScalar(.01);},
  at(t){puddle.visible=t>3;const r=t<3?.01:Math.min(1.2,.15+(Math.min(t,7)-3)*.28);puddle.scale.setScalar(r);washTag.show=t<5;leakTag.show=t>4.5;valveTag.show=t>2;
   valveTag.el.textContent='Vanne · '+(t>7?'Fermée':'Ouverte');valveTag.el.classList.toggle('alert',t>7);$('alert').hidden=t<5.5;set('laundry',true,true);}},
 delivery:{result:'Vous avez vu qui sonnait et ouvert depuis votre téléphone. Le colis vous attend à l’abri, derrière le portail.',
  steps:[[0,'Un livreur arrive devant le portail.'],[4,'Il sonne : la caméra de l’entrée vous montre qui est là.'],[8,'Vous ouvrez le portail depuis votre téléphone.'],[11,'Le colis est déposé à l’abri.'],[15,'Le livreur repart, le portail se referme tout seul.']],
  start(){mode('day',true);flyTo({target:new T.Vector3(X(190),.5,Z(215)),az:-.75,pol:.92,dist:17},1100);},
  at(t){courier.visible=t<24;const go=[[185,-30],[185,150],[185,180]],inn=[[185,180],[195,222],[200,228]],out=[[200,228],[190,190],[185,120],[185,-30]];
   const p=t<4?stroll(go.map(([u,v])=>[X(u),Z(v),0]),clamp(t/4,0,1)):t<9?{x:X(185),z:Z(180),heading:Math.PI}:t<11?stroll(inn.map(([u,v])=>[X(u),Z(v),0]),clamp((t-9)/2,0,1)):t<13?{x:X(200),z:Z(228),heading:0}:stroll(out.map(([u,v])=>[X(u),Z(v),0]),clamp((t-13)/9,0,1));
   courier.position.set(p.x,0,p.z);courier.rotation.y=p.heading;parcel.visible=t>11.5;
   if(t>4&&t<20&&camOpen!=='entree')openCam('entree',false,'Livreur au portail');if(t>20&&camTitle==='Livreur au portail')openCam(null);
   setGate(t>8&&t<17,true);set('entry',true,true);}},
 solar:{result:'Le lave-linge et la piscine ont tourné au soleil. Ce mois-ci : environ 46 € économisés.',
  steps:[[0,'Il est 8 h. Le soleil se lève sur les panneaux.'],[5,'Midi : les panneaux produisent plus que la maison ne consomme.'],[10,'La maison lance le lave-linge et la pompe de la piscine maintenant.'],[20,'Le soir, elle repasse sur le réseau.']],
  start(){mode('day',true);flyTo({target:new T.Vector3(X(200),1.5,Z(430)),az:-.75,pol:.78,dist:30},1100);},
  at(t){const kw=t<20?Math.max(0,Math.sin(clamp(t/20,0,1)*Math.PI))*4.2:0;sunTag.show=true;sunTag.el.textContent='Production · '+kw.toFixed(1).replace('.',',')+' kW';
   washTag.show=t>10&&t<24;set('laundry',t>10&&t<24,true);set('pool',t>10&&t<24,true);if(t>22&&nightTarget===0)mode('evening',true);}}
};
let playing=null;
function play(name){if(!scenes[name])return;stop(true);$('now').hidden=false;if(floorUp)floor(false,true);const s=scenes[name];playing={name,s,t0:performance.now(),state:{}};document.documentElement.dataset.scene=name;$('result').hidden=true;
 {const al=s.alert||scenes.intrusion.alert;$('alert').querySelector('strong').textContent=al[0];$('alert').querySelector('ul').innerHTML=al[1].map(([a,b])=>`<li>${a} <b>${b}</b></li>`).join('');}focused=null;back.hidden=true;s.start();$('transport').hidden=false;
 for(const b of document.querySelectorAll('[data-scene]'))b.setAttribute('aria-pressed',String(b.dataset.scene===name));}
function stop(quiet){if(!playing)return;playing=null;if(camAlert||camTitle)openCam(null);kid.visible=false;puddle.visible=false;courier.visible=false;parcel.visible=false;for(const g of [leakTag,valveTag,washTag,sunTag,poolTag])g.show=false;$('result').hidden=true;document.documentElement.removeAttribute('data-scene');watchGuard(false);$('now').hidden=true;if(!member)intro?.classList.remove('gone');resident.visible=false;$('transport').hidden=true;$('alert').hidden=true;person.visible=false;motionTag.show=false;car.visible=true;car.position.set(X(parked[0]),0,Z(parked[1]));car.rotation.y=0;beams.intensity=0;
 for(const b of document.querySelectorAll('[data-scene]'))b.setAttribute('aria-pressed','false');if(!quiet)flyTo(home);}
function manual(){if(playing)stop(true);}
for(const b of document.querySelectorAll('[data-scene]'))b.addEventListener('click',()=>playing?.name===b.dataset.scene?stop():play(b.dataset.scene));
$('stop').addEventListener('click',()=>stop());$('now-stop').addEventListener('click',()=>stop());
// The languages at the foot of the page: the choice is kept for the next visit, and the current one is marked.
{const mark=()=>{const now=(document.documentElement.lang||'fr').slice(0,2);for(const a of document.querySelectorAll('#langs a'))a.toggleAttribute('aria-current',a.dataset.lang===now);};
 for(const a of document.querySelectorAll('#langs a'))a.addEventListener('click',e=>{e.preventDefault();try{localStorage.setItem('parks.language',a.dataset.lang);}catch{}const u=new URL(location.href);u.searchParams.set('lang',a.dataset.lang);location.href=u;});
 mark();document.addEventListener('parks-language',mark);new MutationObserver(mark).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});}
// On arrival: a sentence and the scenes. A choice, or a first touch of the house, puts it away.
const intro=$('intro'),dismiss=()=>intro?.classList.add('gone');
for(const b of document.querySelectorAll('[data-intro]'))b.addEventListener('click',()=>{dismiss();if(b.dataset.intro!=='free')play(b.dataset.intro);});
canvas.addEventListener('pointerdown',()=>{if(member)dismiss();});

// ---------- every frame
const v3=new T.Vector3(),white=new T.Color(0xffffff),moon=new T.Color(0x9db4ff),noon=new T.Color(0xfff1d6);let last=performance.now();
function frame(now){
 const dt=clamp((now-last)/1000,0,.05);last=now;      // never backwards: a first frame can be stamped before the page finished loading
 if(playing){const t=Math.max(0,(now-playing.t0)/1000);playing.s.at(Math.min(t,DURATION),playing.state);{const k=`scaleX(${clamp(t/DURATION,0,1)})`,line=(playing.s.steps.filter(s=>s[0]<=t).pop()||playing.s.steps[0])[1];$('bar').style.transform=k;$('now-bar').style.transform=k;if($('caption').textContent!==line){$('caption').textContent=line;$('now-caption').textContent=line;}}if(t>DURATION-3&&playing.s.result&&$('result').hidden){$('result-text').textContent=playing.s.result;$('result').hidden=false;}if(t>DURATION+5)stop();}
 if(fly){const k=ease(clamp((now-fly.t0)/fly.ms,0,1)),a=fly.from,b=fly.to;orbit.target.lerpVectors(a.target,b.target,k);orbit.az=a.az+(b.az-a.az)*k;orbit.pol=a.pol+(b.pol-a.pol)*k;orbit.dist=a.dist+(b.dist-a.dist)*k;if(k>=1)fly=null;}
 else if(!pointers.size&&!reduce){orbit.az+=orbit.vaz;orbit.pol=clamp(orbit.pol+orbit.vpol,.03,1.2);const f=Math.pow(.0015,dt);orbit.vaz*=f;orbit.vpol*=f;}
 place();
 night+=(nightTarget-night)*Math.min(1,dt*2.2);
 sky.intensity=1.25+1.0*(1-night);sky.color.setHex(0x8fa4ff).lerp(white,1-night);sun.intensity=.5*night+2.7*(1-night);sun.color.copy(moon).lerp(noon,1-night);renderer.toneMappingExposure=.92+.12*(1-night);
 for(const l of lamps.values()){
  l.level+=((l.on?1:0)-l.level)*Math.min(1,dt*(reduce?60:5));l.pulse*=Math.pow(.004,dt);
  const here=l.up?floorUp:!(floorUp&&indoor.has(l.id)),k=l.level*(here?1:0);l.group.visible=here;l.light.intensity=l.power*.42*k*(.35+.65*night);l.glow.material.opacity=k*(l.cool?.5:.8)*(.45+.55*night);
  l.ball.material.color.setRGB(.49+.51*k,.53+.42*k,.59+.19*k);l.ball.scale.setScalar(1+.45*l.pulse);
 }
 const poolLevel=lamps.get('pool').level;water.material.emissiveIntensity=.1+.75*poolLevel;spa.material.emissiveIntensity=.12+.7*poolLevel;tex.water.offset.x=now*.00001;tex.water.offset.y=now*.000006;
 tv.material.emissiveIntensity=.9*lamps.get('living').level*night;glass.emissiveIntensity=.15+.5*Math.max(lamps.get('kitchen').level,lamps.get('living').level)*night;
 shutter.open+=(shutter.target-shutter.open)*Math.min(1,dt*(reduce?60:1.6));for(const b of shutters){const closed=Math.max(.03,1-shutter.open);b.mesh.scale.y=closed;b.mesh.position.y=b.top-b.height*closed/2;}
 // the family is at home when no scene plays; each one walks there and back, with a pause at each end
 for(const [i,f] of family.entries()){const here=!playing&&f.up===floorUp||!playing&&!f.up&&!floorUp;f.node.visible=!playing&&!live.on&&(f.up?floorUp:true);if(!f.node.visible)continue;
  const t=reduce?0:((now/1000+i*2.3)%(f.every*2))/f.every,k=t<1?between(t,.25,.75):1-between(t-1,.25,.75),moving=!reduce&&((t%1)>.25&&(t%1)<.75);
  f.node.position.set(f.a[0]+(f.b[0]-f.a[0])*k,f.y,f.a[1]+(f.b[1]-f.a[1])*k);A.animate(f.node,{speed:moving?.55:0,t:now/1000,dt});
  const dir=t<1?1:-1;f.node.rotation.y=Math.atan2((f.b[0]-f.a[0])*dir,(f.b[1]-f.a[1])*dir);}
 for(const f of family){f.tag.show=f.node.visible&&(!floorUp||f.up||f.dog||placeOf(f.node,false)==='Dehors'||placeOf(f.node,false)==='Jardin')&&orbit.dist<(camera.aspect<1?26:44);f.tag.pos.set(f.node.position.x,f.y+f.node.userData.tall+.3,f.node.position.z);}
 {const people=live.on?live.people:playing?(resident.visible?1:0):family.filter(f=>!f.dog).length,pets=live.on?live.pets:playing?0:1,cars=car.visible?1:0,text=people+'·'+pets+'·'+cars;if(who.dataset.n!==text){who.dataset.n=text;who.children[0].lastChild.textContent=people;who.children[1].lastChild.textContent=pets;who.children[2].lastChild.textContent=cars;}}
 for(const who of [resident,person,kid,courier]){if(!who.visible){who.userData.last=null;continue;}const l=who.userData.last,v=l?Math.hypot(who.position.x-l.x,who.position.z-l.z)/Math.max(dt,.001):0;who.userData.last=who.position.clone();who.userData.v=(who.userData.v||0)*.8+Math.min(2,v)*.2;A.animate(who,{speed:who.userData.v,t:now/1000,dt});}
 for(const d of doors){const near=resident.visible&&Math.abs(resident.position.y-d.y)<1&&Math.hypot(resident.position.x-d.x,resident.position.z-d.z)<1.25;d.open+=((near||d.held?1:0)-d.open)*Math.min(1,dt*(reduce?60:5));d.pivot.rotation.y=d.base+d.open*1.35;}
 gate.open+=(gate.target-gate.open)*Math.min(1,dt*(reduce?60:2.6));gate.leaves[0].rotation.y=-gate.open*Math.PI/2;gate.leaves[1].rotation.y=gate.open*Math.PI/2;
 tempTag.el.textContent=clim.on?clim.set+',0°':'24,5°';
 renderer.render(scene,camera);if(!drawn){drawn=true;tell('ready');}
 filmAll();airFlow(dt);
 const w=canvas.clientWidth,h=canvas.clientHeight;
 for(const t of tags){v3.copy(t.pos).project(camera);const off=!t.show||(t.low&&floorUp)||v3.z>1||Math.abs(v3.x)>1.05||Math.abs(v3.y)>1.05;t.el.style.opacity=off?0:1;t.el.style.pointerEvents=off?'none':'';t.el.style.transform=`translate(-50%,-50%) translate(${((v3.x+1)/2*w).toFixed(1)}px,${((1-v3.y)/2*h).toFixed(1)}px)`;}
 requestAnimationFrame(frame);
}
car.position.set(X(parked[0]),0,Z(parked[1]));mode('evening',true);place();requestAnimationFrame(frame);
// The house is first seen from above, like a plan, then the view comes down to three quarters.
setTimeout(()=>{if(!playing&&!focused)flyTo(home,reduce?1:1500);},reduce?0:150);
// Used by the page's own checks.
window.parks3d={get signedIn(){return signedIn;},orbit,flyTo,home,enter,leave,toggle,mode,toggleGate,play,stop,floor,swing,cctv:c=>{cctv.target=c;}};
if(new URLSearchParams(location.search).has('live')){admit();import('./maison3d-live.mjs').then(m=>m.start({T,house,camera,canvas,X,Z,figure,dogFigure,mat,tag,say,live,car,setGate,rooms,beds:cotsPlan,floorUp:()=>floorUp,setFloor:floor})).catch(e=>say('Mode live indisponible · '+e.message));}
