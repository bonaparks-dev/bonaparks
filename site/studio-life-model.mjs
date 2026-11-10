import {ease,smoothTrack} from './studio-motion.mjs';
const between=(t,a,b)=>ease((t-a)/(b-a));
export const journeys={
 arrival:{name:'Tout le monde rentre',duration:60,steps:[[0,'Ouverture du portail'],[5,'La voiture entre'],[17,'Stationnement'],[20,'Sortie de la voiture'],[38,'Bienvenue à la maison'],[50,'Portail refermé']]},
 departure:{name:'Tout le monde s’en va',duration:60,steps:[[0,'La famille sort'],[18,'Installation dans la voiture'],[24,'La maison s’éteint'],[40,'La voiture repart'],[55,'Fermeture du portail'],[60,'Protection activée']]}
};
const parked=[222,425],outside=[296,59];
const carIn=[[0,...outside],[5,...outside],[11,270,186],[17,...parked],[60,...parked]];
const carOut=[[0,...parked],[40,...parked],[46,238,348],[51,269,190],[55,...outside],[60,...outside]];
const walkIn=[[20,250,434],[22,253,444],[27,269,495],[31,320,529],[35,403,545],[38,450,516],[42,482,457]];
const walkOut=[[18,482,457],[22,448,510],[26,383,541],[30,310,520],[33,267,485],[36,250,434],[39,250,434]];
export function journeyFrame(id,time){
 const s=journeys[id];if(!s)return null;const t=Math.max(0,Math.min(s.duration,Number(time)||0)),arrival=id==='arrival';
 const gate=arrival?(t<44?between(t,0,4):1-between(t,44,50)):(t<55?between(t,32,38):1-between(t,55,60));
 const car=smoothTrack(arrival?carIn:carOut,t);car.visible=arrival||t<56;car.reversing=!arrival;car.heading=arrival?car.heading:Math.atan2(-1,5);if(car.speed<.1)car.heading=-.17;
 car.door=arrival?between(t,18,20)*(1-between(t,24,27)):between(t,33,35)*(1-between(t,38,40));car.lights=arrival?t<18:t>=39&&t<56;
 const walker=smoothTrack(arrival?walkIn:walkOut,t);walker.visible=arrival?t>=20:t>=18&&t<39;walker.opacity=arrival?between(t,20,21):1-between(t,37,39);
 const lit=arrival?Object.entries({entry:8,garage:17,patio:29,living:42,kitchen:46,stairs:48,hall:50,children:57,blue:58}).filter(([,at])=>t>=at).map(([id])=>id):Object.entries({children:4,blue:4,hall:9,living:16,kitchen:16,patio:25,entry:39,garage:40}).filter(([,until])=>t<until).map(([id])=>id);
 return {id,time:t,duration:s.duration,done:t===s.duration,phase:s.steps.filter(x=>x[0]<=t).at(-1)[1],phaseIndex:s.steps.filter(x=>x[0]<=t).length-1,gate,car,walker,lit,
  floor:arrival?(t<38?'overview':t<48?'rdc':'etage'):(t<9?'etage':t<18?'rdc':'overview'),
  doors:{active:true,patio:arrival?between(t,28,30)*(1-between(t,41,44)):between(t,12,14)*(1-between(t,24,27)),upstairs:arrival?between(t,47,49)*(1-between(t,55,58)):between(t,0,2)*(1-between(t,9,12))},
  shutterOpening:arrival?between(t,45,52)*100:(1-between(t,9,18))*100,
  lightsOn:lit.length>0,climateOn:arrival?t>=42:t<18,climate:{rdc:arrival?t>=42:t<16,etage:arrival?t>=50:t<8},
  security:arrival?'disarmed':t>=60?'armed':t>=24?'arming':'disarmed',presence:arrival?'home':'away'};
}
// One authored 60-second timeline: room entry precedes its motion-triggered light.
export function journeyActors(id,time,floor,members){
 const arrival=id==='arrival';
 if(floor==='overview')return members.map((m,i)=>{const p=journeyFrame(id,time-(arrival?i*.45:-i*.25)).walker;return p.visible?{...m,...p,x:p.x-(i%2)*7,y:p.y+i*4}:null;}).filter(Boolean);
 const group=members.filter(m=>floor==='etage'?m.kind==='child':m.kind!=='child');
 return group.map((m,i)=>{
  let track;
  if(floor==='rdc')track=arrival?[[38,575,590],[40,589,532],[43,515,438],[46,506+i*18,333],[60,506+i*18,333]]:[[9,506+i*18,333],[12,515,438],[15,589,532],[18,575,590]];
  else {const room=i%2?[676,545]:[380,405],join=i%2?[688,459]:[465,390];track=arrival?[[48,754,510],[50,736,450],[53,...join],[57,...room],[60,...room]]:[[0,...room],[4,...join],[6,736,450],[9,754,510]];}
  const p=smoothTrack(track,time);return {...m,...p,x:p.x+i*3,y:p.y+i*3,opacity:1};
 });
}
export function climateStep(climate,seconds){const next=structuredClone(climate),dt=Math.max(0,Math.min(.2,seconds));for(const c of Object.values(next)){const ambient=Number.isFinite(c.ambient)?c.ambient:26,target=c.on&&c.mode!=='fan'?c.temperature:26;const delta=target-ambient,step=dt*(c.on?.003:.001);c.ambient=Math.abs(delta)<step?target:ambient+Math.sign(delta)*step;}return next;}
