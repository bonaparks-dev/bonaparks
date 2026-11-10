import test from 'node:test';
import assert from 'node:assert/strict';
import {demoCommand} from './studio-demo-controls.mjs';
import {initialHome,restoreHome,applyScene} from './studio-home-model.mjs';
import {equipmentSummary,fansMarkup} from './studio-equipment.mjs';

test('three modes apply coherent states, including all floors and animated shutter targets',()=>{
 let s=initialHome();s.fans.patio.on=s.fans.living.on=s.sockets.kitchen.on=true;
 const morning=demoCommand(s,'etage','mode','morning');assert.equal(morning.mode,'morning');assert.ok(Object.values(morning.state.lights).every(v=>v.on&&v.brightness===100));assert.ok(Object.values(morning.state.shutters).every(v=>v.target===100));
 const evening=demoCommand(morning.state,'overview','mode','evening').state;assert.equal(evening.lights.living.brightness,45);assert.equal(evening.music.playing,true);assert.equal(evening.lights.children.on,false);
 const night=demoCommand(evening,'rdc','mode','night').state;assert.equal(night.lights.children.on,false);assert.ok(Object.values(night.fans).every(v=>!v.on));assert.ok(Object.values(night.sockets).every(v=>!v.on));assert.ok(Object.values(night.shutters).every(v=>v.target===0));assert.equal(night.music.playing,false);
});
test('fan speed, socket groups and live inventory remain independent',()=>{
 const original=applyScene(initialHome(),'off');let s=demoCommand(original,'rdc','fan','patio').state;s=demoCommand(s,'rdc','fan-speed','patio',9).state;assert.equal(s.fans.patio.speed,3);assert.equal(s.fans.living.on,false);assert.equal(original.fans.patio.on,false);
 s=demoCommand(s,'rdc','socket','kitchen').state;assert.equal(equipmentSummary(s).sockets.on,1);assert.equal(equipmentSummary(s).devices.on,2);assert.equal(equipmentSummary(s).lights.total,17);
 s=demoCommand(s,'etage','bulk-sockets','').state;assert.equal(equipmentSummary(s).sockets.on,0);s=demoCommand(s,'etage','bulk-sockets','').state;assert.equal(equipmentSummary(s).sockets.on,4);
 assert.equal((fansMarkup(s,'overview').match(/class="ceiling-fan/g)||[]).length,2);assert.equal(fansMarkup(s,'etage'),'');assert.match(fansMarkup(s,'rdc'),/running/);
});
test('brightness never turns on an empty room and whole-house controls span floors',()=>{
 let s=applyScene(initialHome(),'off');s=demoCommand(s,'rdc','brightness','living',24).state;assert.equal(s.lights.living.brightness,24);assert.equal(s.lights.living.on,false);s=demoCommand(s,'etage','brightness-all','',44).state;assert.ok(Object.values(s.lights).every(v=>v.brightness===44&&!v.on));
 s=demoCommand(s,'etage','bulk-lights','').state;assert.equal(equipmentSummary(s).lights.on,17);s=demoCommand(s,'rdc','bulk-lights','').state;assert.equal(equipmentSummary(s).lights.on,0);
});
test('equipment migration restores safe defaults and validates corrupt input',()=>{
 const s=initialHome();delete s.fans;delete s.sockets;assert.deepEqual(restoreHome(s).fans,initialHome().fans);
 const r=restoreHome({...s,fans:{patio:{on:true,speed:99},living:{on:'yes',speed:NaN}},sockets:{patio:{on:true}}});assert.equal(r.fans.patio.speed,3);assert.equal(r.fans.living.on,false);assert.equal(r.fans.living.speed,2);assert.equal(r.sockets.patio.on,true);
 for(const cmd of [['fan','missing'],['socket','__proto__'],['fan-speed','patio',NaN],['brightness','living',Infinity],['mode','unknown']])assert.equal(demoCommand(initialHome(),'overview',...cmd),null);
});

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
