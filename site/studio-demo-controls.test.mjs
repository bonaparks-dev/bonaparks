import test from 'node:test';
import assert from 'node:assert/strict';
import {demoCommand} from './studio-demo-controls.mjs';
import {initialHome} from './studio-home-model.mjs';

test('public controls keep the four water circuits independent and do not mutate the source',()=>{
 const s=initialHome();s.lights.pool.on=false;
 for(const [device,id,check] of [['light','pool',s=>s.lights.pool.on],['light','spa',s=>s.lights.spa.on],['pool-pump','',s=>s.pool.pump],['spa-pump','',s=>s.spa.jets]]){
  const r=demoCommand(s,'overview',device,id).state;assert.equal(check(r),true);assert.equal(check(s),false);assert.equal([r.lights.pool.on,r.lights.spa.on,r.pool.pump,r.spa.jets].filter(Boolean).length,1);
 }
});
test('floor lighting respects the selected floor',()=>{
 const s=initialHome(),r=demoCommand(s,'etage','lights','on').state;
 assert.ok(r.lights.children.on&&r.lights.blue.on&&r.lights.hall.on);assert.equal(r.lights.living.on,s.lights.living.on);assert.equal(r.lights.garden.on,s.lights.garden.on);
});
test('temperature and TV controls clamp input and isolate devices',()=>{
 let s=demoCommand(initialHome(),'etage','temperature','etage',90).state;assert.equal(s.climate.etage.temperature,30);assert.equal(s.climate.rdc.temperature,23);
 s=demoCommand(s,'etage','tv-channel','children',-1).state;assert.equal(s.tv.children.channel,1);
 s=demoCommand(s,'etage','tv-volume','children',105).state;assert.equal(s.tv.children.volume,100);assert.equal(s.tv.living.volume,25);
});
test('manual shutter and gate commands set targets without jumping geometry',()=>{
 const s=initialHome(),r=demoCommand(s,'etage','shutter','all','close');assert.equal(r.shutters,true);for(const v of Object.values(r.state.shutters)){assert.equal(v.position,100);assert.equal(v.target,0);}
 const gate=demoCommand(s,'overview','gate','');assert.equal(gate.gate,true);assert.equal(gate.state.gate.position,0);assert.equal(gate.state.gate.target,1);
});
test('invalid public commands do not stop playback or create state properties',()=>{
 const s=initialHome();for(const [device,id,value]of [['temperature','rdc',NaN],['temperature','missing',23],['light','__proto__'],['shutter','children','unknown'],['tv','missing'],['lights','unknown'],['unknown','']])assert.equal(demoCommand(s,'overview',device,id,value),null);
});
