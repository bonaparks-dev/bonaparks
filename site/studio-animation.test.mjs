import test from 'node:test';
import assert from 'node:assert/strict';
import {initialHome,restoreHome,lights} from './studio-home-model.mjs';
import {initialSpatial,memberPosition,scenarios} from './studio-spatial-model.mjs';
import {smoothTrack,ambientMotion} from './studio-motion.mjs';
import {journeyFrame,journeys,journeyActors,climateStep} from './studio-life-model.mjs';
import {FrameLoop} from './studio-frame-loop.mjs';
import {SpatialExperience} from './studio-spatial.mjs';
import {waterLevels} from './studio-water.mjs';
import {mapMarkup} from './studio-home-map.mjs';
import {tours,tourFrame} from './studio-tour-model.mjs';
import {lightFields,lightingMarkup} from './studio-lighting.mjs';

test('all four entry scenarios visit the three house plans and finish deterministically',()=>{assert.equal(Object.keys(tours).length,4);for(const [id,t]of Object.entries(tours)){assert.equal(t.duration,60);const floors=new Set();for(let n=0;n<=t.duration;n++)floors.add(tourFrame(id,n).floor);assert.deepEqual([...floors].sort(),['etage','overview','rdc']);assert.equal(tourFrame(id,t.duration+100).done,true);}assert.equal(tourFrame('family',52).incident,'pool');assert.equal(tourFrame('security',36).incident,'intrusion');assert.equal(tourFrame('departure',60).journey.security,'armed');});

test('arrival waits for the gate, parks before the door opens, then closes the gate',()=>{
 assert.equal(journeyFrame('arrival',4).car.moving,false);
 for(let t=5;t<12;t+=.1)assert.equal(journeyFrame('arrival',t).gate,1);
 assert.equal(journeyFrame('arrival',18).car.moving,false);
 assert.equal(journeyFrame('arrival',20).car.door,1);
 assert.equal(journeyFrame('arrival',20).walker.visible,true);
 const end=journeyFrame('arrival',100);assert.equal(end.gate,0);assert.equal(end.car.visible,true);assert.equal(end.presence,'home');assert.equal(end.shutterOpening,100);assert.equal(end.security,'disarmed');
});
test('departure boards the family before driving and arms only after the gate closes',()=>{
 const board=journeyFrame('departure',36);assert.equal(board.car.moving,false);assert.equal(board.car.door,1);assert.equal(board.climateOn,false);assert.equal(board.climateOn,false);
 const drive=journeyFrame('departure',46);assert.equal(drive.walker.visible,false);assert.equal(drive.gate,1);assert.equal(drive.car.door,0);assert.ok(drive.car.moving);
 for(let t=0;t<60;t+=.1){const f=journeyFrame('departure',t);if(f.security==='armed'){assert.equal(f.gate,0);assert.equal(f.car.visible,false);assert.equal(f.shutterOpening,0);assert.equal(f.lightsOn,false);assert.equal(f.climateOn,false);}}
 const end=journeyFrame('departure',60);assert.equal(end.presence,'away');assert.equal(end.security,'armed');assert.equal(end.done,true);
});
test('seeking journeys is deterministic, bounded, and continuous through every phase',()=>{
 for(const id of Object.keys(journeys)){let last=journeyFrame(id,0);for(let t=.05;t<=journeys[id].duration;t+=.05){const f=journeyFrame(id,t);for(const p of [f.car,f.walker])for(const k of ['x','y','heading'])assert.ok(Number.isFinite(p[k]));assert.ok(Math.hypot(f.car.x-last.car.x,f.car.y-last.car.y)<5);assert.ok(f.gate>=0&&f.gate<=1);assert.ok(f.shutterOpening>=0&&f.shutterOpening<=100);last=f;}assert.deepEqual(journeyFrame(id,10),journeyFrame(id,10));assert.equal(journeyFrame(id,-2).time,0);}
});
test('smooth security paths pass through waypoints and never overshoot their bounds',()=>{
 for(const s of Object.values(scenarios)){for(const [t,x,y] of s.track){const p=smoothTrack(s.track,t);assert.equal(p.x,x);assert.equal(p.y,y);}for(let i=1;i<s.track.length;i++){const a=s.track[i-1],b=s.track[i];for(let t=a[0];t<b[0];t+=.1){const p=smoothTrack(s.track,t);assert.ok(p.x>=Math.min(a[1],b[1])&&p.x<=Math.max(a[1],b[1]));assert.ok(p.y>=Math.min(a[2],b[2])&&p.y<=Math.max(a[2],b[2]));}}}
});
test('family and dog visibly walk with pauses, respect floors and reduced motion',()=>{
 for(const m of initialSpatial().members){const origin=memberPosition(m,'overview',0,false),points=Array.from({length:70},(_,t)=>ambientMotion(m,'overview',t,origin,true));assert.ok(Math.max(...points.map(p=>p.x))-Math.min(...points.map(p=>p.x))>8,m.id);assert.ok(points.some(p=>p.moving));assert.ok(points.some(p=>!p.moving));assert.deepEqual(ambientMotion(m,'overview',30,origin,false),{...origin,moving:false,motion:0});assert.equal(ambientMotion(m,'etage',0,null),null);}
});
test('four water circuits independently drive illumination and flow, including dimming',()=>{
 for(let mask=0;mask<16;mask++){const s=initialHome(),b=[0,1,2,3].map(i=>!!(mask&(1<<i)));[s.lights.pool.on,s.lights.spa.on,s.pool.pump,s.spa.jets]=b;assert.deepEqual(waterLevels(s).map(v=>v>0),b);}
 const s=initialHome();s.lights.pool.brightness=20;assert.equal(waterLevels(s)[0],.2);
});
test('temperature cools gradually without overshooting and legacy homes gain ambient values',()=>{
 let c=initialHome().climate;c.rdc.on=true;const start=structuredClone(c);for(let i=0;i<500;i++)c=climateStep(c,.1);assert.ok(c.rdc.ambient>25.8&&c.rdc.ambient<26);assert.equal(c.etage.ambient,26);assert.equal(start.rdc.ambient,26);
 c.rdc.mode='heat';c.rdc.temperature=28;assert.ok(climateStep(c,.1).rdc.ambient>23);
 const old=initialHome();delete old.climate.rdc.ambient;old.security='arming';const r=restoreHome(old);assert.equal(r.climate.rdc.ambient,26);assert.equal(r.security,'disarmed');
});
test('both bathrooms expose humidity and AC values use explicit degrees Celsius',()=>{
 const s=initialHome();for(const [floor,value] of [['rdc','58 %'],['etage','64 %']]){const html=mapMarkup(s,floor,lights,null);assert.ok(html.includes(value));assert.ok(html.includes('26,0 °C'));assert.ok(html.includes('map-lamp'));assert.ok(!html.includes('home-pin'));}
});

test('diffuse lighting is independent, dimmable and bounded by its room on every floor',()=>{
 for(const floor of ['overview','rdc','etage']){
  const state=initialHome();for(const light of Object.values(state.lights))light.on=false;
  const dark=lightFields(state,floor);assert.ok(dark.length>0);assert.ok(dark.every(f=>f.level===0));
  const id=dark[0].id;state.lights[id].on=true;state.lights[id].brightness=35;
  const lit=lightFields(state,floor);
  assert.ok(lit.filter(f=>f.id===id).every(f=>f.level===.35));assert.ok(lit.filter(f=>f.id!==id).every(f=>f.level===0));
  const markup=lightingMarkup(state,floor);
  for(const field of lit){assert.ok(field.radius>=48&&field.radius<=195);assert.ok(field.polygon.length>=4);assert.ok(markup.includes('mask="url(#light-room-'+field.id+')"'));assert.ok(markup.includes('data-key="reveal-'+field.key+'"'));}
  assert.ok(!markup.includes('stroke='));
 }
});

test('reentrant floor changes keep exactly one animation clock at 30, 60 and 144 fps',()=>{
 for(const fps of [30,60,144]){
  let now=0,next=0,elapsed=0,frames=0;const queue=new Map();
  const runtime={request:fn=>{queue.set(++next,fn);return next;},cancel:id=>queue.delete(id),now:()=>now};
  const loop=new FrameLoop(dt=>{elapsed+=dt;frames++;loop.start();loop.start();},runtime);
  loop.start();loop.start();
  for(let i=1;i<=fps*60;i++){now=i*1000/fps;assert.equal(queue.size,1);const [id,fn]=queue.entries().next().value;queue.delete(id);fn(now);}
  assert.equal(frames,fps*60);assert.ok(Math.abs(elapsed-60)<1e-8);
  loop.stop();assert.equal(queue.size,0);now+=300000;loop.start();now+=1000/fps;const [id,fn]=queue.entries().next().value;queue.delete(id);fn(now);assert.ok(elapsed<60.04);loop.stop();
 }
});
test('arrival rooms stay dark until occupants enter; departure shuts down AC before driving',()=>{
 const family=[{id:'adult',kind:'adult'},{id:'child1',kind:'child'},{id:'child2',kind:'child'}];
 for(const [room,entry] of [['living',42],['kitchen',46],['hall',50],['children',57],['blue',58]]){
  assert.equal(journeyFrame('arrival',entry-.1).lit.includes(room),false);
  assert.equal(journeyFrame('arrival',entry).lit.includes(room),true);
  const f=journeyFrame('arrival',entry);assert.ok(journeyActors('arrival',entry,f.floor,family).length>0);
 }
 assert.equal(journeyFrame('arrival',0).lit.length,0);
 assert.equal(journeyFrame('arrival',41).climate.rdc,false);
 assert.equal(journeyFrame('arrival',43).climate.rdc,true);
 const leaving=journeyFrame('departure',41);assert.equal(leaving.climate.rdc,false);assert.equal(leaving.climate.etage,false);assert.equal(leaving.lit.length,0);
});
test('incident replay advances at one second per second, including pool vigilance',()=>{
 for(const [id,start] of [['family',24],['security',0]])for(let t=start;t<59;t++)assert.equal(tourFrame(id,t+1).incidentTime-tourFrame(id,t).incidentTime,1);
});

test('family remains visible in free exploration and freezes when a tour is paused',()=>{
 const subject={state:initialSpatial(),floor:'overview',motion:{matches:false},selected:null,securityOpen:false,home:{state:initialHome(),life:{actors:()=>null},tour:{id:null,actors:list=>list}}};
 const first=SpatialExperience.prototype.actorList.call(subject,10);assert.equal(first.length,4);
 Object.assign(subject.home.tour,{id:'family',time:12,playing:false});
 const paused=SpatialExperience.prototype.actorList.call(subject,15),later=SpatialExperience.prototype.actorList.call(subject,500);
 assert.equal(paused.length,4);assert.deepEqual(paused,later);assert.ok(paused.every(a=>!a.moving));
});
