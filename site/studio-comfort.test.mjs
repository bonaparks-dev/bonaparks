import test from 'node:test';
import assert from 'node:assert/strict';
import {initialShutters,commandShutters,tickShutters,restoreShutters,shutterShape} from './studio-shutters.mjs';
import {cameraAt,safetyState,scenarios,cameras} from './studio-spatial-model.mjs';
import {roomSurfaces,surfaceBox} from './studio-home-surfaces.mjs';
import {initialHome,lights,applyScene} from './studio-home-model.mjs';
import {mapMarkup} from './studio-home-map.mjs';

test('shutters move independently, can stop, reverse and survive reload without resuming',()=>{
 const original=initialShutters();let s=commandShutters(original,'blue','close');
 for(let i=0;i<10;i++)s=tickShutters(s,.1);
 assert.equal(s.blue.position,80);assert.equal(s.master.position,100);assert.equal(original.blue.target,100);
 s=commandShutters(s,'blue','stop');assert.equal(tickShutters(s,.1).blue.position,80);
 s=commandShutters(s,'blue','open');assert.equal(tickShutters(s,.1).blue.position,82);
 assert.equal(restoreShutters(s).blue.target,80);
 s=commandShutters(s,'all','close');for(let i=0;i<51;i++)s=tickShutters(s,.1);
 assert.ok(Object.values(s).every(v=>v.position===0));
 assert.deepEqual(commandShutters(s,'__proto__','open'),s);
 assert.equal(commandShutters(s,'blue','position',999).blue.target,100);
});
test('window coverage collapses when open and stays inside the window when closed',()=>{
 const w=[[10,20],[30,25],[30,65],[10,60]];
 assert.deepEqual(shutterShape(w,0),w);assert.deepEqual(shutterShape(w,100),[w[0],w[1],w[1],w[0]]);
 assert.deepEqual(shutterShape(w,50).at(-1),[10,40]);
});
test('night and morning scenes coordinate shutters with lights',()=>{
 const s=applyScene(initialHome(),'night');assert.ok(Object.values(s.shutters).every(v=>v.target===0));
 const morning=applyScene(s,'morning');assert.ok(Object.values(morning.shutters).every(v=>v.target===100));assert.equal(morning.night,false);
});
test('security hands off between five cameras and clears pool danger on rewind and safe return',()=>{
 assert.equal(cameras.length,5);assert.equal(new Set(cameras.map(c=>c.id)).size,5);
 assert.ok(scenarios.intrusion.track[0][1]>900);assert.equal(cameraAt('intrusion',0),'side');assert.equal(cameraAt('intrusion',18),'garden');assert.equal(cameraAt('intrusion',32),'pool');
 assert.equal(cameraAt('pool',8),'garden');assert.equal(cameraAt('pool',18),'pool');
 assert.equal(safetyState('pool',18),'alert');assert.equal(safetyState('pool',30),'info');assert.equal(safetyState('pool',0),'idle');
 for(const s of Object.values(scenarios))for(const e of s.events)assert.ok(cameras.some(c=>c.id===e.camera));
});
test('render uses bounded room surfaces without giant bulb markers or round room halos',()=>{
 for(const [floor,surfaces]of Object.entries(roomSurfaces)){
  for(const points of Object.values(surfaces)){const b=surfaceBox(points);assert.ok(b.w>0&&b.h>0);for(const p of points)for(const n of p)assert.ok(Number.isFinite(n)&&n>=0&&n<=1000);}
  const html=mapMarkup(initialHome(),floor,lights,'all');assert.ok(html.includes('lit-rooms'));assert.ok(!html.includes('home-light-marker'));assert.ok(!html.includes('class="room-light"'));
 }
});
