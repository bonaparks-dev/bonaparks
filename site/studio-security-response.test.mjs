import test from 'node:test';
import assert from 'node:assert/strict';
import {securityResponse,applySecurityResponse,securityMessage} from './studio-security-response.mjs';
import {tourFrame} from './studio-tour-model.mjs';
import {initialHome,applyScene} from './studio-home-model.mjs';
import {scenarios,safetyState} from './studio-spatial-model.mjs';

test('security opens with the intruder in the right garden, before detection and notification',()=>{
 const first=tourFrame('security',0);assert.equal(first.floor,'overview');assert.equal(first.incident,'intrusion');assert.equal(first.incidentTime,0);
 assert.equal(securityResponse(5.9).detected,false);assert.equal(securityResponse(6).detected,true);
 assert.equal(securityResponse(11.9).phones,false);assert.equal(securityResponse(12).phones,true);
 assert.equal(securityResponse(12).hub,false);assert.equal(securityResponse(13).hub,true);
 assert.equal(securityResponse(13).speaking,false);assert.equal(securityResponse(14).speaking,true);
 assert.equal(safetyState('intrusion',12),'alert');assert.equal(securityMessage,'Individu non identifié dans le jardin à droite.');
 assert.ok(scenarios.intrusion.track.every(p=>p[1]>=737));assert.equal(scenarios.intrusion.duration,60);
});
test('occupied-home protection closes upstairs shutters after the alert, without arming away or opening the gate',()=>{
 const s=initialHome();s.gate={position:1,target:1};s.presence='away';s.security='armed';let previous=100;
 for(let t=0;t<=60;t+=.1){const f=applySecurityResponse(s,t);assert.equal(s.presence,'home');assert.equal(s.security,'disarmed');assert.deepEqual(s.gate,{position:0,target:0});
  assert.ok(f.shutterOpening<=previous&&previous-f.shutterOpening<2);previous=f.shutterOpening;
  if(t<24)assert.equal(f.shutterOpening,100);
  if(f.closing){assert.equal(f.phones,true);assert.equal(f.hub,true);assert.equal(f.announced,true);assert.equal(tourFrame('security',t).floor,'etage');}
  for(const v of Object.values(s.shutters))assert.equal(v.position,f.shutterOpening);
 }
 assert.equal(securityResponse(32).shutterOpening,0);
});
test('seeking a completed security scenario back to the beginning restores shutters and clears future reactions',()=>{
 const s=initialHome();applySecurityResponse(s,60);assert.equal(s.shutters.children.position,0);
 const reset=applySecurityResponse(s,0);assert.equal(reset.alert,false);assert.equal(reset.phones,false);assert.equal(reset.hub,false);assert.equal(reset.speaking,false);assert.equal(reset.announced,false);
 assert.ok(Object.values(s.shutters).every(v=>v.position===100&&v.target===100));
 assert.deepEqual(applySecurityResponse(s,28),securityResponse(28));assert.equal(securityResponse(NaN).time,0);
});
test('morning uses daylight after every mode while evening lights the pool and garden',()=>{
 for(const previous of ['evening','night','swim','welcome']){const s=applyScene(applyScene(initialHome(),previous),'morning');assert.equal(s.night,false);assert.ok(Object.values(s.lights).every(l=>!l.on));assert.ok(Object.values(s.shutters).every(v=>v.target===100));}
 const evening=applyScene(initialHome(),'evening');for(const id of ['living','patio','garden','pool'])assert.equal(evening.lights[id].on,true);assert.equal(evening.lights.children.on,false);assert.equal(evening.lights.blue.on,false);
});
