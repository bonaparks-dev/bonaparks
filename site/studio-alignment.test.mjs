import test from 'node:test';
import assert from 'node:assert/strict';
import {gateHinges,gateLeaves} from './studio-gate.mjs';
import {upperPoint,upperEntry} from './studio-upper-map.mjs';
import {shutters,initialShutters,shuttersMarkup} from './studio-shutters.mjs';
import {journeyFrame,journeyActors} from './studio-life-model.mjs';
import {tourFrame} from './studio-tour-model.mjs';

test('all four bedroom windows have a visible shutter, including the nursery',()=>{
 assert.equal(shutters.length,4);
 const state=initialShutters();for(const s of Object.values(state))s.position=0;
 const html=shuttersMarkup(state);
 for(const s of shutters){assert.equal(s.window.length,4);assert.ok(html.includes('data-shutter-surface="'+s.id+'"'));}
 // Independent camera export from Blender: top-left of the restored nursery window.
 assert.ok(Math.hypot(shutters[2].window[0][0]-267.202,shutters[2].window[0][1]-442.175)<.01);
});

test('the entire automatic shutter movement is shown in the upstairs chapter',()=>{
 for(const id of ['arrival','departure']){
  let prior=journeyFrame(id,0).shutterOpening,changed=0;
  for(let t=.05;t<=60;t+=.05){const f=journeyFrame(id,t);if(Math.abs(f.shutterOpening-prior)>.001){changed++;assert.equal(f.floor,'etage');assert.equal(tourFrame(id,t).floor,'etage');}prior=f.shutterOpening;}
  assert.ok(changed>90);
 }
 assert.equal(journeyFrame('departure',8).shutterOpening,0);
});

test('animated entrance uses the rendered threshold instead of floating above the stair',()=>{
 assert.ok(Math.hypot(upperEntry.p[0]-727.240,upperEntry.p[1]-527.626)<.01);
 assert.ok(Math.hypot(upperEntry.q[0]-758.946,upperEntry.q[1]-476.738)<.01);
 assert.ok(upperEntry.height>57&&upperEntry.height<58);
 const children=[{id:'one',kind:'child'},{id:'two',kind:'child'}],atLanding=journeyActors('arrival',48,'etage',children)[0];
 const landing=upperPoint(4.95,.35);assert.ok(Math.hypot(atLanding.x-landing[0],atLanding.y-landing[1])<.01);
});

test('gate leaves stay anchored and keep their physical length throughout the swing',()=>{
 const [a,b]=gateHinges,u=[(b[0]-a[0])/2,(b[1]-a[1])/2],v=[-18.5,43],det=u[0]*v[1]-u[1]*v[0];
 for(let t=0;t<=1.001;t+=.02)for(const [i,[hinge,end]]of gateLeaves(t).entries()){
  assert.deepEqual(hinge,gateHinges[i]);const x=end[0]-hinge[0],y=end[1]-hinge[1],along=(x*v[1]-y*v[0])/det,depth=(u[0]*y-u[1]*x)/det;
  assert.ok(Math.abs(along*along+depth*depth-1)<1e-10);
 }
 assert.deepEqual(gateLeaves(0)[0][1],gateLeaves(0)[1][1]);
});
