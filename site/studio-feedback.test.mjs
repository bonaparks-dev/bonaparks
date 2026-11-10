import test from 'node:test';
import assert from 'node:assert/strict';
import {initialHome} from './studio-home-model.mjs';
import {demoCommand} from './studio-demo-controls.mjs';
import {commandFeedback,controlFeedback} from './studio-feedback.mjs';

test('gate feedback describes motion and settled states without claiming premature completion',()=>{
 const s=initialHome();s.gate={position:0,target:1};assert.equal(commandFeedback('gate','',null,s).title,'Ouverture du portail');
 s.gate={position:.8,target:0};assert.equal(commandFeedback('gate','',null,s).title,'Fermeture du portail');
 s.gate={position:.4,target:.4};assert.equal(commandFeedback('gate','',null,s).title,'Portail arrêté');
 s.gate={position:0,target:0};assert.equal(commandFeedback('gate','',null,s).title,'Portail fermé');
});
test('every public equipment command provides a meaningful acknowledgement of applied state',()=>{
 for(const [device,id,value] of [['mode','morning'],['light','living'],['brightness','living',35],['brightness-all','',60],['lights','on'],['bulk-lights'],['bulk-sockets'],['ac','etage'],['temperature','rdc',24],['fan','patio'],['fan-speed','living',3],['socket','kitchen'],['pool-pump'],['spa-pump'],['car'],['music'],['music-volume','',40],['tv','living'],['tv-volume','living',25],['tv-channel','living',7],['shutter','all','close'],['gate']]){
  const s=initialHome();s.tv.living.on=true;const result=demoCommand(s,'overview',device,id,value);
  assert.ok(result,device);const message=commandFeedback(device,id,value,result.state);assert.ok(message?.title&&message?.icon,device);assert.ok(!JSON.stringify(message).includes('undefined'),device);
 }
});
test('AC and fan notifications reflect actual off state and do not imply physical connectivity',()=>{
 const s=initialHome();s.climate.etage.on=false;s.fans.patio.on=false;
 assert.equal(commandFeedback('ac','etage',null,s).detail,'À l’arrêt');
 assert.equal(controlFeedback({homeToggle:'ac-etage'},s).detail,'À l’arrêt');
 assert.match(commandFeedback('fan-speed','patio',3,s).detail,/À l’arrêt/);
});
