import {changeTV,setFloorLights} from './studio-home-model.mjs';
import {commandShutters} from './studio-shutters.mjs';

// The public rail only changes a local demonstration state. Validate before
// leaving a running scenario, so malformed commands cannot interrupt playback.
export function demoCommand(state,floor,device,id,value){
 const s=structuredClone(state),number=Number(value),bounded=(lo,hi)=>Math.max(lo,Math.min(hi,number));
 if(device==='light'&&Object.hasOwn(s.lights,id))s.lights[id].on=!s.lights[id].on;
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
