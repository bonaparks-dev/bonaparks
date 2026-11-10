import test from 'node:test';
import assert from 'node:assert/strict';
import {initialHome,restoreHome,lights} from './studio-home-model.mjs';
import {initialSpatial,memberPosition,scenarios} from './studio-spatial-model.mjs';
import {smoothTrack,ambientMotion} from './studio-motion.mjs';
import {journeyFrame,journeys,climateStep} from './studio-life-model.mjs';
import {waterLevels} from './studio-water.mjs';
import {mapMarkup} from './studio-home-map.mjs';
import {tours,tourFrame} from './studio-tour-model.mjs';

test('all four entry scenarios visit the three house plans and finish deterministically',()=>{assert.equal(Object.keys(tours).length,4);for(const [id,t]of Object.entries(tours)){const floors=new Set();for(let n=0;n<=t.duration;n++)floors.add(tourFrame(id,n).floor);assert.deepEqual([...floors].sort(),['etage','overview','rdc']);assert.equal(tourFrame(id,t.duration+100).done,true);}assert.equal(tourFrame('family',52).incident,'pool');assert.equal(tourFrame('security',36).incident,'intrusion');assert.equal(tourFrame('departure',58).journey.security,'armed');});

test('arrival waits for the gate, parks before the door opens, then closes the gate',()=>{
 assert.equal(journeyFrame('arrival',4).car.moving,false);
 for(let t=5;t<12;t+=.1)assert.equal(journeyFrame('arrival',t).gate,1);
 assert.equal(journeyFrame('arrival',16).car.moving,false);
 assert.equal(journeyFrame('arrival',19).car.door,1);
 assert.equal(journeyFrame('arrival',20).walker.visible,true);
 const end=journeyFrame('arrival',100);assert.equal(end.gate,0);assert.equal(end.car.visible,true);assert.equal(end.presence,'home');assert.equal(end.shutterOpening,100);assert.equal(end.security,'disarmed');
});
test('departure boards the family before driving and arms only after the gate closes',()=>{
 const board=journeyFrame('departure',15);assert.equal(board.car.moving,false);assert.equal(board.car.door,1);assert.equal(board.lightsOn,false);assert.equal(board.climateOn,false);
 const drive=journeyFrame('departure',25);assert.equal(drive.walker.visible,false);assert.equal(drive.gate,1);assert.equal(drive.car.door,0);assert.ok(drive.car.moving);
 for(let t=0;t<40;t+=.1){const f=journeyFrame('departure',t);if(f.security==='armed'){assert.equal(f.gate,0);assert.equal(f.car.visible,false);assert.equal(f.shutterOpening,0);assert.equal(f.lightsOn,false);assert.equal(f.climateOn,false);}}
 const end=journeyFrame('departure',40);assert.equal(end.presence,'away');assert.equal(end.security,'armed');assert.equal(end.done,true);
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
 let c=initialHome().climate;c.rdc.on=true;const start=structuredClone(c);for(let i=0;i<500;i++)c=climateStep(c,.1);assert.equal(c.rdc.ambient,23);assert.equal(c.etage.ambient,26);assert.equal(start.rdc.ambient,26);
 c.rdc.mode='heat';c.rdc.temperature=28;assert.ok(climateStep(c,.1).rdc.ambient>23);
 const old=initialHome();delete old.climate.rdc.ambient;old.security='arming';const r=restoreHome(old);assert.equal(r.climate.rdc.ambient,26);assert.equal(r.security,'disarmed');
});
test('both bathrooms expose humidity and AC values use explicit degrees Celsius',()=>{
 const s=initialHome();for(const [floor,value] of [['rdc','58 %'],['etage','64 %']]){const html=mapMarkup(s,floor,lights,null);assert.ok(html.includes(value));assert.ok(html.includes('26,0 °C'));assert.ok(html.includes('map-lamp'));assert.ok(!html.includes('home-pin'));}
});
