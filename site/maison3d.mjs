// The pilot house in three dimensions. Built to the measures read on the straight render of the property
// (studio-overview-projection.mjs space: 1000 x 1000 over 4096 x 2560 px, about 120 px per metre).
// Drag to turn around it, pinch or wheel to zoom, touch a room to enter it, touch a lamp to switch it.
// Everything is simulated: nothing is measured, tracked or controlled.
import * as T from './vendor/three.module.min.js';

const $=id=>document.getElementById(id);
const canvas=$('view'),stageEl=$('scene'),labelsEl=$('labels');
const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
const X=u=>(u-470)*0.03396,Z=v=>(v-470)*0.021227;            // render units to metres, the house near the middle
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),ease=t=>t*t*(3-2*t),between=(t,a,b)=>ease(clamp((t-a)/(b-a),0,1));

const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
const scene=new T.Scene(),camera=new T.PerspectiveCamera(32,1,.5,400);
const sky=new T.HemisphereLight(0x8fa4ff,0x262b4a,1),sun=new T.DirectionalLight(0xfff1d6,0);
sun.position.set(-16,26,13);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.bias=-.0004;sun.shadow.normalBias=.03;sun.shadow.radius=4;
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
const house=new T.Group();scene.add(house);
const put=(m,shadow=true)=>{m.castShadow=shadow;m.receiveShadow=true;house.add(m);return m;};
/** A box over a rectangle of the render, from y0 up to y0 + h metres. */
function box(u0,v0,u1,v1,h,y0,color,o,shadow){const w=Math.abs(X(u1)-X(u0)),d=Math.abs(Z(v1)-Z(v0)),m=new T.Mesh(new T.BoxGeometry(w,h,d),typeof color==='number'?mat(color,o):color);m.position.set((X(u0)+X(u1))/2,y0+h/2,(Z(v0)+Z(v1))/2);return put(m,shadow);}
const cyl=(u,v,r,h,y0,color,o)=>{const m=new T.Mesh(new T.CylinderGeometry(r,r,h,24),mat(color,o));m.position.set(X(u),y0+h/2,Z(v));return put(m);};
const ground=(a,b,c,d,y,map,room)=>{const m=box(a,b,c,d,.05,y,0xffffff,{map},false);if(room)m.userData.room=room;return m;};
const WALL=1.3,wall=(u0,v0,u1,v1,h=WALL)=>{box(u0,v0,u1,v1,h,0,0xe9edf4);return box(u0-.4,v0-.6,u1+.4,v1+.6,.05,h,0xf6f8fb);};   // a wall and its cut top
const wallH=(u0,u1,v,h)=>wall(u0,v-2.6,u1,v+2.6,h),wallV=(u,v0,v1,h)=>wall(u-1.6,v0,u+1.6,v1,h);
const glass=mat(0x9fd0ee,{roughness:.1,metalness:.2,transparent:true,opacity:.55,emissive:0x2a5d86,emissiveIntensity:.35});
const windowH=(u0,u1,v)=>{box(u0,v-1.2,u1,v+1.2,.55,.75,glass,undefined,false);box(u0-.6,v-2.9,u1+.6,v+2.9,.07,.7,0x39424f);};

// ---------- the land
box(0,60,1000,950,.3,-.31,0x1d2a22,undefined,false);
ground(10,66,990,945,-.01,tex.lawn,'garden');
ground(47,66,294,612,.01,tex.gravel,'entry');ground(294,66,985,205,.01,tex.gravel);                 // gravel: entrance, and the lane behind the hedge
ground(288,205,616,692,.03,tex.paving);ground(674,680,952,925,.03,tex.paving);ground(600,640,690,700,.03,tex.paving);
for(const [a,b,c,d] of [[0,60,1000,68],[0,942,1000,950],[0,60,8,950],[992,60,1000,950]]){box(a,b,c,d,.75,0,0xdcd8cf);box(a-.5,b-.8,c+.5,d+.8,.06,.75,0xeeebe4);}
const hedge=(a,b,c,d,h=1.15)=>box(a,b,c,d,h,0,0xffffff,{map:tex.hedge,roughness:1});
hedge(12,205,44,940);hedge(44,915,985,940);hedge(955,215,985,915);hedge(314,196,985,214,1.35);       // hedges, the back one at the gate
wallH(47,84,200,1.05);wallH(174,300,200,1.05);                                                       // the wall each side of the gate
function tree(u,v,s=1){cyl(u,v,.11*s,1.5*s,0,0x6b4a32);for(const [dx,dy,dz,r] of [[0,2.1,0,1],[.55,1.75,.2,.7],[-.5,1.8,-.3,.72],[.1,1.7,.55,.6]]){const m=new T.Mesh(new T.IcosahedronGeometry(r*s,1),mat(0x3b8742,{roughness:1,flatShading:true}));m.position.set(X(u)+dx*s,dy*s,Z(v)+dz*s);put(m);}}
tree(270,150,1);tree(262,330,.9);tree(262,430,.9);tree(640,700,.65);tree(600,772,.65);
const pot=(u,v)=>{cyl(u,v,.17,.32,0,0xb9744f);const m=new T.Mesh(new T.IcosahedronGeometry(.3,1),mat(0x3f8f49,{flatShading:true,roughness:1}));m.position.set(X(u),.58,Z(v));put(m);};
pot(300,596);pot(560,596);pot(690,706);
// carport: posts and a slatted roof
for(const v of [215,600])for(const u of [52,112])cyl(u,v,.07,2.25,0,0xc9a36b);
box(50,212,54,603,.1,2.25,0xc9a36b);box(110,212,114,603,.1,2.25,0xc9a36b);for(let v=222;v<600;v+=26)box(48,v,116,v+11,.05,2.35,0xdcbf93);
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
wallH(325,573,224);wallV(327,224,584);wallV(571,224,584);                      // back, left, right
wallH(325,497,466);wallH(541,573,466);                                          // between the living room and the laundry, with its door
wallV(385,315,398);wallV(385,432,466);wallH(327,385,315);                       // the shower room, with its door
windowH(352,412,224);windowH(482,538,224);
// outside stairs to the upper floor
for(let i=0;i<14;i++)box(575,640-i*24,612,640-i*24+24,.19*(i+1),0,0xdfe2e8);
box(612,300,614.5,664,.9,.19,0x2c3340,undefined,false);
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
box(514,338,530,372,.05,.34,0xffffff,{map:tex.wood});for(const [u,v] of [[516,341],[528,341],[516,369],[528,369]])cyl(u,v,.03,.34,0,0x8a6642);
box(486,229,522,244,.48,0,0x9b7a55);const tv=box(488,231,520,233,.6,.55,0x0d1118,{emissive:0x4d7dff,emissiveIntensity:0,roughness:.2});
// shower room
box(333,345,358,395,.8,0,0xd9b98f);box(336,352,355,388,.1,.8,0xffffff,{roughness:.2});box(333,412,350,430,.4,0,0xffffff,{roughness:.2});box(333,430,352,446,.42,0,0xffffff,{roughness:.2});
box(331,318,352,340,.04,.1,0x9fc3da,{roughness:.2},false);
// laundry: sink, washing machine; bar and stools on the terrace side; garden table
box(333,472,362,500,.8,0,0xd9b98f);box(336,476,359,496,.1,.8,0xffffff,{roughness:.2});box(368,472,392,502,.85,0,0xf2f4f6,{roughness:.3});cyl(380,502.4,.17,.03,.42,0x1c232d).rotation.x=Math.PI/2;
box(333,576,430,588,1.05,0,0xe4dfd6);box(332,575,431,589,.05,1.05,0xffffff,{map:tex.wood});for(const u of [352,380,408]){cyl(u,600,.16,.05,.62,0x3f8e94);cyl(u,600,.03,.62,0,0x2a333d);}
box(432,604,472,640,.05,.72,0xffffff,{map:tex.wood});for(const [u,v] of [[435,607],[469,607],[435,637],[469,637]])cyl(u,v,.035,.72,0,0x8a6944);

// ---------- pool with a rounded end, and the spa
const basin=g=>{const s=new T.Shape(),x0=X(760),x1=X(903)+g,z0=Z(723)-g,z1=Z(846)+g,r=(z1-z0)/2,c=.35+g;s.moveTo(x0,-z1);s.absarc(x0,-(z0+z1)/2,r,-Math.PI/2,Math.PI/2,true);s.lineTo(x1-c,-z0);s.quadraticCurveTo(x1,-z0,x1,-z0-c);s.lineTo(x1,-z1+c);s.quadraticCurveTo(x1,-z1,x1-c,-z1);s.lineTo(x0,-z1);return new T.ShapeGeometry(s,40);};
const rim=new T.Mesh(basin(.34),mat(0xece9e2));rim.rotation.x=-Math.PI/2;rim.position.y=.1;rim.receiveShadow=true;house.add(rim);
const water=new T.Mesh(basin(0),new T.MeshStandardMaterial({color:0xffffff,map:tex.water,roughness:.15,metalness:.1,emissive:0x1fb6ff,emissiveIntensity:.15}));water.rotation.x=-Math.PI/2;water.position.y=.115;water.userData.room='pool';house.add(water);
{const uv=water.geometry.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*.12,uv.getY(i)*.12);}
cyl(801,683,.98,.55,0,0xece9e2);const spa=cyl(801,683,.74,.05,.53,0x38b8e6,{roughness:.15,emissive:0x1fb6ff,emissiveIntensity:.15});

// ---------- gate, car, and the person of the alert scene
const gate={open:0,target:0,leaves:[]};
for(const u of [84,174]){box(u-4,194,u+4,206,1.55,0,0xdcd8cf);box(u-5,192.5,u+5,207.5,.07,1.55,0xeeebe4);}
for(const side of [0,1]){const pivot=new T.Group();pivot.position.set(X(side?174:84),0,Z(200));const w=(X(174)-X(84))/2-.06;
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
const parked=[178,520],street=[129,-40];
const person=new T.Group();{const body=new T.Mesh(new T.CapsuleGeometry(.2,.75,6,12),mat(0x2b2f38));body.position.y=.82;const head=new T.Mesh(new T.SphereGeometry(.16,16,12),mat(0x3a3f4a));head.position.y=1.55;
 const ring=new T.Mesh(new T.TorusGeometry(.48,.03,8,40),new T.MeshBasicMaterial({color:0xff8f7d}));ring.rotation.x=Math.PI/2;ring.position.y=.12;body.castShadow=head.castShadow=true;person.add(body,head,ring);person.visible=false;house.add(person);}

// ---------- lamps: a ball on its wire is the switch, and it really lights the room
const halo=(()=>{const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d'),r=g.createRadialGradient(64,64,0,64,64,64);r.addColorStop(0,'rgba(255,236,190,1)');r.addColorStop(.25,'rgba(255,214,140,.55)');r.addColorStop(1,'rgba(255,200,120,0)');g.fillStyle=r;g.fillRect(0,0,128,128);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;})();
const lampList=[
 {id:'kitchen',name:'Cuisine',at:[388,272],h:1.9,power:9},{id:'living',name:'Séjour',at:[530,345],h:1.9,power:12},{id:'dining',name:'Salle à manger',at:[492,364],h:1.75,power:9},
 {id:'bath',name:'Salle d’eau',at:[357,392],h:1.9,power:7},{id:'laundry',name:'Buanderie',at:[440,522],h:1.9,power:11},{id:'terrace',name:'Terrasse',at:[450,632],h:2,power:11},
 {id:'stairs',name:'Escalier',at:[593,470],h:3.1,power:8},{id:'entry',name:'Portail',at:[129,235],h:1.7,power:12},{id:'garage',name:'Garage',at:[82,400],h:2,power:11},
 {id:'garden1',name:'Jardin · haut',at:[760,300],h:.7,power:9,low:true},{id:'garden2',name:'Jardin · bas',at:[850,560],h:.7,power:9,low:true},{id:'gazebo',name:'Gazebo',at:[595,667],h:2,power:8},
 {id:'pool',name:'Piscine',at:[830,784],h:-.5,power:14,cool:true}
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
const gateTag=tag('Portail · Fermé',129,200,2.1,{press:()=>toggleGate()});
const tempTag=tag('24,5°',500,290,1.9);tag('68 %',345,425,1.7);const motionTag=tag('Mouvement',880,430,2.1,{alert:true});motionTag.show=false;

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
function pick(e){const r=canvas.getBoundingClientRect();ndc.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(ndc,camera);
 const lamp=ray.intersectObjects(hits,false)[0];if(lamp)return {lamp:lamp.object.userData.lamp};
 for(const h of ray.intersectObjects(house.children,true)){const d=h.object.userData;if(d.gate)return {gate:true};if(d.room)return {room:d.room};}
 return null;}
function tap(e){const hit=pick(e);if(!hit)return;if(hit.lamp)toggle(hit.lamp);else if(hit.gate)toggleGate();else if(hit.room)enter(hit.room);}
function view(id){const [a,b,c,d]=rooms[id].rect,w=Math.abs(X(c)-X(a)),dz=Math.abs(Z(d)-Z(b));return {target:new T.Vector3((X(a)+X(c))/2,.6,(Z(b)+Z(d))/2),az:orbit.az,pol:clamp(orbit.pol,.55,.85),dist:clamp(Math.max(w,dz)*2.6/Math.min(1,camera.aspect),11,36)};}
function enter(id){if(!rooms[id])return;manual();if(focused===id){leave();return;}focused=id;flyTo(view(id));back.hidden=false;say(`<b>${rooms[id].name}</b>`);}
function leave(){focused=null;back.hidden=true;flyTo(home);}
const back=$('back');back.addEventListener('click',leave);

// ---------- state: lamps, gate, ambiance, and the dashboard that shows it
const toast=$('toast'),statusEl=$('status'),listEl=$('list');let toastTimer=0;
function say(html){toast.innerHTML=html;toast.classList.add('on');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('on'),1900);}
const clim={on:false,set:23};
function refresh(){
 const n=[...lamps.values()].filter(l=>l.on).length;
 statusEl.textContent=`${n} lumière${n>1?'s':''} allumée${n>1?'s':''} · Portail ${gate.target?'ouvert':'fermé'}`;
 $('count').textContent=`${n}/${lamps.size}`;$('active').textContent=`${n+(gate.target?1:0)+(clim.on?1:0)} / ${lamps.size+2} actifs`;
 $('gate-state').textContent=gate.target?'Ouvert':'Fermé';$('gate-tile').setAttribute('aria-pressed',String(!!gate.target));gateTag.el.textContent='Portail · '+(gate.target?'Ouvert':'Fermé');
 $('clim-state').textContent=clim.on?`ON · ${clim.set},0 °C demandés`:'OFF · 26,0 °C';$('clim-set').textContent=clim.set+' °C';$('clim-power').setAttribute('aria-pressed',String(clim.on));
 for(const b of listEl.querySelectorAll('button')){const l=lamps.get(b.dataset.lamp);b.setAttribute('aria-pressed',String(l.on));b.querySelector('small').textContent=l.on?'ALLUMÉE':'ÉTEINTE';}
}
function set(id,on,quiet){const l=lamps.get(id);if(!l||l.on===on)return;l.on=on;l.pulse=1;if(!quiet)say(`${l.name} · <b>${on?'Allumée':'Éteinte'}</b>`);refresh();}
const toggle=id=>{manual();set(id,!lamps.get(id).on);};
function setGate(open,quiet){if(!!gate.target===!!open)return;gate.target=open?1:0;if(!quiet)say(`Portail · <b>${open?'Ouvert':'Fermé'}</b>`);refresh();}
const toggleGate=()=>{manual();setGate(!gate.target);};
for(const l of lampList){const li=document.createElement('li');li.innerHTML=`<button data-lamp="${l.id}" aria-pressed="false"><i></i><span>${l.name}<small></small></span></button>`;li.firstChild.addEventListener('click',()=>toggle(l.id));listEl.append(li);}
const modes={day:{night:0,on:[]},evening:{night:1,on:['kitchen','living','dining','laundry','terrace','garden1','garden2','pool','entry']},night:{night:1,on:['entry']}};
let night=1,nightTarget=1;
function mode(name,quiet){const m=modes[name];nightTarget=m.night;for(const id of lamps.keys())set(id,m.on.includes(id),true);stageEl.classList.toggle('day',!m.night);
 for(const b of document.querySelectorAll('[data-mode]'))b.setAttribute('aria-pressed',String(b.dataset.mode===name));
 if(!quiet)say({day:'Bonjour · <b>Lumière du jour</b>',evening:'Soirée · <b>Lumières douces</b>',night:'Bonne nuit · <b>Tout s’éteint</b>'}[name]);refresh();}
for(const b of document.querySelectorAll('[data-mode]'))b.addEventListener('click',()=>{manual();mode(b.dataset.mode);});
$('gate-tile').addEventListener('click',toggleGate);
$('all-on').addEventListener('click',()=>{manual();for(const id of lamps.keys())set(id,true,true);say('Éclairage · <b>Tout allumé</b>');});
$('all-off').addEventListener('click',()=>{manual();for(const id of lamps.keys())set(id,false,true);say('Éclairage · <b>Tout éteint</b>');});
$('clim-power').addEventListener('click',()=>{clim.on=!clim.on;say(`Clim · RDC · <b>${clim.on?'Allumée':'Éteinte'}</b>`);refresh();});
$('clim-less').addEventListener('click',()=>{clim.set=clamp(clim.set-1,17,28);refresh();});$('clim-more').addEventListener('click',()=>{clim.set=clamp(clim.set+1,17,28);refresh();});
const hintEl=$('hint');let hinted=false;function hint(){if(hinted)return;hinted=true;setTimeout(()=>hintEl.classList.add('gone'),2500);}
addEventListener('keydown',e=>{if(e.key==='Escape'&&focused)leave();});

// ---------- scenes: thirty seconds each, played in the house itself
const along=(pts,t)=>{const n=pts.length-1,k=clamp(t,0,1)*n,i=Math.min(n-1,Math.floor(k)),f=k-i,a=pts[i],b=pts[i+1];return {u:a[0]+(b[0]-a[0])*f,v:a[1]+(b[1]-a[1])*f,heading:Math.atan2(X(b[0])-X(a[0]),Z(b[1])-Z(a[1]))};};
const driveIn=[street,[129,120],[129,215],[150,340],[178,430],parked],walkIn=[[950,330],[880,345],[800,395],[735,450],[690,470]];
const DURATION=30,gateView={target:new T.Vector3(X(170),.5,Z(330)),az:-.9,pol:.95,dist:30};
const scenes={
 arrival:{steps:[[0,'Le portail s’ouvre.'],[5,'La voiture rejoint sa place.'],[15,'La terrasse, puis le séjour s’allument.'],[24,'La maison vous accueille.']],
  start(){mode('night',true);set('entry',false,true);flyTo(gateView,1600);},
  at(t,s){setGate(t>1&&t<14,true);set('entry',t>1.5,true);set('garage',t>9,true);set('terrace',t>15,true);set('laundry',t>17,true);set('living',t>19,true);set('dining',t>20,true);set('kitchen',t>21,true);
   const p=along(driveIn,between(t,3,12));car.position.set(X(p.u),0,Z(p.v));car.rotation.y=t<12?p.heading:0;beams.intensity=t>2&&t<14?40:0;if(t>14&&!s.back){s.back=true;flyTo(home,2200);}}},
 departure:{steps:[[0,'Les lumières s’éteignent, pièce après pièce.'],[10,'Le portail s’ouvre.'],[14,'La voiture repart.'],[23,'Le portail se referme. La maison veille.']],
  start(){mode('evening',true);flyTo(home,1200);},
  at(t,s){for(const [id,at] of [['kitchen',2],['dining',3],['living',4.5],['laundry',6],['terrace',7.5],['garden1',8.5],['garden2',8.5],['pool',9]])set(id,t<at,true);set('entry',true,true);
   setGate(t>10&&t<23,true);const p=along([...driveIn].reverse(),between(t,13,22));car.position.set(X(p.u),0,Z(p.v));car.rotation.y=t>13?p.heading:0;beams.intensity=t>12&&t<22?40:0;car.visible=t<22;
   if(t>10&&!s.gone){s.gone=true;flyTo(gateView,1800);}}},
 intrusion:{steps:[[0,'Il est 2 h 14. Tout le monde dort.'],[4,'Une personne entre dans le jardin, à droite.'],[9,'Individu non identifié : l’alerte est relayée.'],[16,'Le jardin s’éclaire. La caméra suit la personne.']],
  start(){mode('night',true);flyTo({target:new T.Vector3(X(790),.5,Z(430)),az:.55,pol:.98,dist:27},1800);},
  at(t){const p=along(walkIn,between(t,4,24));person.visible=t>4;person.position.set(X(p.u),0,Z(p.v));person.rotation.y=p.heading;motionTag.show=t>6;motionTag.pos.set(X(p.u),2.1,Z(p.v));
   $('alert').hidden=t<9;set('garden1',t>16,true);set('garden2',t>16.6,true);}}
};
let playing=null;
function play(name){stop(true);const s=scenes[name];playing={name,s,t0:performance.now(),state:{}};focused=null;back.hidden=true;s.start();$('transport').hidden=false;
 for(const b of document.querySelectorAll('[data-scene]'))b.setAttribute('aria-pressed',String(b.dataset.scene===name));}
function stop(quiet){if(!playing)return;playing=null;$('transport').hidden=true;$('alert').hidden=true;person.visible=false;motionTag.show=false;car.visible=true;car.position.set(X(parked[0]),0,Z(parked[1]));car.rotation.y=0;beams.intensity=0;
 for(const b of document.querySelectorAll('[data-scene]'))b.setAttribute('aria-pressed','false');if(!quiet)flyTo(home);}
function manual(){if(playing)stop(true);}
for(const b of document.querySelectorAll('[data-scene]'))b.addEventListener('click',()=>playing?.name===b.dataset.scene?stop():play(b.dataset.scene));
$('stop').addEventListener('click',()=>stop());

// ---------- every frame
const v3=new T.Vector3(),white=new T.Color(0xffffff),moon=new T.Color(0x9db4ff),noon=new T.Color(0xfff1d6);let last=performance.now();
function frame(now){
 const dt=Math.min(.05,(now-last)/1000);last=now;
 if(playing){const t=(now-playing.t0)/1000;playing.s.at(Math.min(t,DURATION),playing.state);$('bar').style.transform=`scaleX(${clamp(t/DURATION,0,1)})`;$('caption').textContent=playing.s.steps.filter(s=>s[0]<=t).pop()[1];if(t>DURATION+1.5)stop();}
 if(fly){const k=ease(clamp((now-fly.t0)/fly.ms,0,1)),a=fly.from,b=fly.to;orbit.target.lerpVectors(a.target,b.target,k);orbit.az=a.az+(b.az-a.az)*k;orbit.pol=a.pol+(b.pol-a.pol)*k;orbit.dist=a.dist+(b.dist-a.dist)*k;if(k>=1)fly=null;}
 else if(!pointers.size&&!reduce){orbit.az+=orbit.vaz;orbit.pol=clamp(orbit.pol+orbit.vpol,.03,1.2);const f=Math.pow(.0015,dt);orbit.vaz*=f;orbit.vpol*=f;}
 place();
 night+=(nightTarget-night)*Math.min(1,dt*2.2);
 sky.intensity=1.25+1.0*(1-night);sky.color.setHex(0x8fa4ff).lerp(white,1-night);sun.intensity=.5*night+2.7*(1-night);sun.color.copy(moon).lerp(noon,1-night);renderer.toneMappingExposure=.92+.12*(1-night);
 for(const l of lamps.values()){
  l.level+=((l.on?1:0)-l.level)*Math.min(1,dt*(reduce?60:5));l.pulse*=Math.pow(.004,dt);
  const k=l.level;l.light.intensity=l.power*.42*k*(.35+.65*night);l.glow.material.opacity=k*(l.cool?.5:.8)*(.45+.55*night);
  l.ball.material.color.setRGB(.49+.51*k,.53+.42*k,.59+.19*k);l.ball.scale.setScalar(1+.45*l.pulse);
 }
 const poolLevel=lamps.get('pool').level;water.material.emissiveIntensity=.1+.75*poolLevel;spa.material.emissiveIntensity=.12+.7*poolLevel;tex.water.offset.x=now*.00001;tex.water.offset.y=now*.000006;
 tv.material.emissiveIntensity=.9*lamps.get('living').level*night;glass.emissiveIntensity=.15+.5*Math.max(lamps.get('kitchen').level,lamps.get('living').level)*night;
 gate.open+=(gate.target-gate.open)*Math.min(1,dt*(reduce?60:2.6));gate.leaves[0].rotation.y=-gate.open*Math.PI/2;gate.leaves[1].rotation.y=gate.open*Math.PI/2;
 tempTag.el.textContent=clim.on?clim.set+',0°':'24,5°';
 renderer.render(scene,camera);
 const w=canvas.clientWidth,h=canvas.clientHeight;
 for(const t of tags){v3.copy(t.pos).project(camera);const off=!t.show||v3.z>1||Math.abs(v3.x)>1.05||Math.abs(v3.y)>1.05;t.el.style.opacity=off?0:1;t.el.style.pointerEvents=off?'none':'';t.el.style.transform=`translate(-50%,-50%) translate(${((v3.x+1)/2*w).toFixed(1)}px,${((1-v3.y)/2*h).toFixed(1)}px)`;}
 requestAnimationFrame(frame);
}
car.position.set(X(parked[0]),0,Z(parked[1]));mode('evening',true);place();requestAnimationFrame(frame);
// The house is first seen from above, like a plan, then the view comes down to three quarters.
setTimeout(()=>{if(!playing&&!focused)flyTo(home,reduce?1:2600);},reduce?0:500);
// Used by the page's own checks.
window.parks3d={orbit,flyTo,home,enter,leave,toggle,mode,toggleGate,play,stop};
