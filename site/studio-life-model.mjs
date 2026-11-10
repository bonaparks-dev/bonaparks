import {ease,smoothTrack} from './studio-motion.mjs';
const between=(t,a,b)=>ease((t-a)/(b-a));
export const journeys={
 arrival:{name:'Retour à la maison',duration:38,steps:[[0,'Ouverture du portail'],[5,'La voiture entre'],[15,'Stationnement'],[19,'Sortie de la voiture'],[25,'Bienvenue à la maison'],[34,'Portail refermé']]},
 departure:{name:'Départ de la maison',duration:40,steps:[[0,'La famille sort'],[10,'Installation dans la voiture'],[15,'La maison s’éteint'],[21,'La voiture repart'],[34,'Fermeture du portail'],[39,'Protection activée']]}
};
const parked=[222,425],outside=[296,59];
const carIn=[[0,...outside],[5,...outside],[10,270,186],[15,...parked],[38,...parked]];
const carOut=[[0,...parked],[20,...parked],[25,238,348],[30,269,190],[34,...outside],[40,...outside]];
const walkIn=[[19,250,434],[21,253,444],[25,269,495],[29,320,529],[33,403,545],[35,450,516],[38,482,457]];
const walkOut=[[0,482,457],[3,448,510],[6,383,541],[10,310,520],[13,267,485],[16,250,434],[18,250,434]];
export function journeyFrame(id,time){
 const s=journeys[id];if(!s)return null;const t=Math.max(0,Math.min(s.duration,Number(time)||0)),arrival=id==='arrival';
 const gate=arrival?(t<30?between(t,0,4):1-between(t,30,35)):(t<34?between(t,14,19):1-between(t,34,39));
 const car=smoothTrack(arrival?carIn:carOut,t);car.visible=arrival||t<35;car.reversing=!arrival&&t<27;car.heading=arrival?car.heading:Math.atan2(-1,5);if(car.speed<.1)car.heading=-.17;
 car.door=arrival?between(t,17,19)*(1-between(t,23,25)):between(t,12,14)*(1-between(t,18,20));car.lights=arrival?t<17:t>=20&&t<35;
 const walker=smoothTrack(arrival?walkIn:walkOut,t);walker.visible=arrival?t>=19:t<18;walker.opacity=arrival?between(t,19,20):1-between(t,16.5,18);walker.kind='adult';
 return {id,time:t,duration:s.duration,done:t===s.duration,phase:s.steps.filter(x=>x[0]<=t).at(-1)[1],phaseIndex:s.steps.filter(x=>x[0]<=t).length-1,gate,car,walker,
  shutterOpening:arrival?between(t,5,12)*100:(1-between(t,15,21))*100,
  lightsOn:arrival?t>=3:t<15,climateOn:arrival?t>=29:t<15,
  security:arrival?'disarmed':t>=39?'armed':t>=15?'arming':'disarmed',presence:arrival?'home':'away'};
}
export function climateStep(climate,seconds){const next=structuredClone(climate),dt=Math.max(0,Math.min(.2,seconds));for(const c of Object.values(next)){const ambient=Number.isFinite(c.ambient)?c.ambient:26,target=c.on&&c.mode!=='fan'?c.temperature:26;const delta=target-ambient,step=dt*(c.on?.09:.008);c.ambient=Math.abs(delta)<step?target:ambient+Math.sign(delta)*step;}return next;}
