import {changeTV,setFloorLights,applyScene} from './studio-home-model.mjs';
import {quickModes} from './studio-equipment.mjs';
import {commandShutters} from './studio-shutters.mjs';

// The public rail only changes a local demonstration state. Validate before
// leaving a running scenario, so malformed commands cannot interrupt playback.
export function demoCommand(state,floor,device,id,value){
 const s=structuredClone(state),number=Number(value),bounded=(lo,hi)=>Math.max(lo,Math.min(hi,number));
 if(device==='mode'&&quickModes.some(m=>m.id===id))return {state:applyScene(s,id),shutters:true,gate:true,mode:id};
 else if(device==='light'&&Object.hasOwn(s.lights,id))s.lights[id].on=!s.lights[id].on;
 else if(device==='brightness'&&Object.hasOwn(s.lights,id)&&Number.isFinite(number))s.lights[id].brightness=bounded(1,100);
 else if(device==='brightness-all'&&Number.isFinite(number)){for(const l of Object.values(s.lights))l.brightness=bounded(1,100);}
 else if(device==='fan'&&Object.hasOwn(s.fans,id))s.fans[id].on=!s.fans[id].on;
 else if(device==='fan-speed'&&Object.hasOwn(s.fans,id)&&Number.isFinite(number))s.fans[id].speed=Math.round(bounded(1,3));
 else if(device==='socket'&&Object.hasOwn(s.sockets,id))s.sockets[id].on=!s.sockets[id].on;
 else if(device==='bulk-lights'){const on=Object.values(s.lights).some(v=>v.on);for(const v of Object.values(s.lights))v.on=!on;}
 else if(device==='bulk-sockets'){const on=Object.values(s.sockets).some(v=>v.on);for(const v of Object.values(s.sockets))v.on=!on;}
 else if(device==='lights'&&['on','off'].includes(id))return {state:setFloorLights(s,floor,id==='on')};
 else if(device==='ac'&&Object.hasOwn(s.climate,id))s.climate[id].on=!s.climate[id].on;
 else if(device==='temperature'&&Object.hasOwn(s.climate,id)&&Number.isFinite(number))s.climate[id].temperature=bounded(16,30);
 else if(device==='tv'&&Object.hasOwn(s.tv,id))s.tv[id]=changeTV(s.tv[id],'power');
 else if(device==='tv-volume'&&Object.hasOwn(s.tv,id)&&Number.isFinite(number))s.tv[id]=changeTV(s.tv[id],'volume',number);
 else if(device==='tv-channel'&&Object.hasOwn(s.tv,id)&&Number.isFinite(number))s.tv[id]=changeTV(s.tv[id],'channel',number);
 else if(device==='music')s.music.playing=!s.music.playing;
 else if(device==='music-volume'&&Number.isFinite(number))s.music.volume=bounded(0,100);
 else if(device==='shutter'&&(id==='all'||Object.hasOwn(s.shutters,id))&&['open','close','stop'].includes(value))s.shutters=commandShutters(s.shutters,id,value);
 else if(device==='pool-pump')s.pool.pump=!s.pool.pump;
 else if(device==='spa-pump')s.spa.jets=!s.spa.jets;
 else if(device==='car')s.car.on=!s.car.on;
 else if(device==='gate')s.gate.target=s.gate.target>.5?0:1;
 else return null;
 return {state:s,gate:device==='gate',shutters:device==='shutter'};
}
