import {initialShutters,restoreShutters,commandShutters} from './studio-shutters.mjs';
import {initialFans,initialSockets,equipmentSummary} from './studio-equipment.mjs';
// Local preview only. No network command or physical device is issued here.
export const HOME_KEY='bonaparks.supranu.home.v1';
export const televisions=[{id:'living',name:'TV du séjour',zone:'rdc'},{id:'children',name:'TV des enfants',zone:'etage'}];
export const tvSources={tv:'Télévision',hdmi1:'HDMI 1',hdmi2:'HDMI 2',apps:'Applications'};
export function initialTV(){return {on:false,volume:25,muted:false,channel:1,source:'tv'};}
export function changeTV(tv,action,value){
 const next={...tv};
 if(action==='power')next.on=!tv.on;
 if(action==='mute')next.muted=!tv.muted;
 if(action==='volume'&&Number.isFinite(value))next.volume=Math.max(0,Math.min(100,Math.round(value)));
 if(action==='channel'&&Number.isFinite(value))next.channel=Math.max(1,Math.min(999,Math.round(value)));
 if(action==='previous')next.channel=Math.max(1,tv.channel-1);
 if(action==='next')next.channel=Math.min(999,tv.channel+1);
 if(action==='source'&&Object.hasOwn(tvSources,value))next.source=value;
 return next;
}
export const lights=[
 ['kitchen','Cuisine','rdc'],['living','Séjour','rdc'],['bath-down','Salle d’eau · RDC','rdc'],
 ['patio','Terrasse couverte','outside'],['stairs','Escalier extérieur','outside'],
 ['master','Chambre du fond · gauche','etage'],['guest','Chambre du fond · droite','etage'],
 ['children','Chambre des enfants','etage'],['blue','Chambre au lit bleu','etage'],
 ['bath-up','Salle de bain · étage','etage'],['hall','Couloir du haut','etage'],
 ['garden','Jardin','outside'],['gazebo','Gazebo','outside'],['entry','Entrée / portail','outside'],
 ['garage','Garage','outside'],['pool','Piscine','outside'],['spa','Jacuzzi','outside']
].map(([id,name,zone])=>({id,name,zone}));
export const scenes=[
 {id:'morning',name:'Bonjour',icon:'sun',description:'Volets ouverts, lumières éteintes : place à la lumière du jour.'},
 {id:'evening',name:'Soirée',icon:'moon',description:'Lumières douces, jardin, piscine et terrasse.'},
 {id:'welcome',name:'Retour maison',icon:'home',description:'Le portail s’ouvre, la voiture se gare et la famille rentre. La maison s’allume.'},
 {id:'departure',name:'Départ',icon:'gate',description:'La famille rejoint la voiture. Lumières et clim éteintes, volets et portail fermés, protection activée.'},
 {id:'terrace',name:'Soirée terrasse',icon:'music',description:'Terrasse à 75 %, jardin à 35 %, piscine éclairée, animation musique sur les quatre enceintes.'},
 {id:'swim',name:'Baignade',icon:'water',description:'Piscine et jacuzzi éclairés, leurs deux pompes en marche.'},
 {id:'comfort',name:'Fraîcheur',icon:'air',description:'Les deux climatisations en mode froid, consigne à 23 °C.'},
 {id:'night',name:'Bonne nuit',icon:'moon',description:'Intérieurs éteints, balisage extérieur à 20 %, musique et pompes arrêtées, portail fermé et volets de l’étage fermés.'},
 {id:'off',name:'Tout éteindre',icon:'power',description:'Toutes les lumières, clims, musique et pompes arrêtées. Portail fermé.'}
];
export function initialHome(){return {version:1,fans:initialFans(),sockets:initialSockets(),car:{on:false},doors:{patio:0,upstairs:0},presence:"home",security:"disarmed",night:false,markers:false,shutters:initialShutters(),lights:Object.fromEntries(lights.map(l=>[l.id,{on:['patio','pool','kitchen'].includes(l.id),brightness:75,color:l.id==='pool'?'#55e5ff':l.id==='spa'?'#87e6de':'#ffd28a'}])),tv:Object.fromEntries(televisions.map(t=>[t.id,initialTV()])),music:{playing:false,volume:35,speakers:[true,true,true,true]},climate:{rdc:{on:false,temperature:23,ambient:26,mode:'cool'},etage:{on:false,temperature:23,ambient:26,mode:'cool'}},pool:{pump:false},spa:{jets:false,intensity:60},humidity:{'bath-down':58,'bath-up':64},gate:{position:0,target:0},routines:[],log:[]};}
const clamp=(v,min,max,fallback)=>Number.isFinite(v)?Math.min(max,Math.max(min,v)):fallback;
export function restoreHome(raw){
 const s=initialHome();if(!raw||raw.version!==1)return s;
 for(const [id,f] of Object.entries(s.fans)){const v=raw.fans?.[id];if(v){f.on=v.on===true;f.speed=Math.round(clamp(v.speed,1,3,2));}}
 for(const [id,v] of Object.entries(s.sockets))v.on=raw.sockets?.[id]?.on===true;
 for(const l of lights){const v=raw.lights?.[l.id];if(!v)continue;s.lights[l.id]={on:v.on===true,brightness:clamp(v.brightness,1,100,75),color:/^#[0-9a-f]{6}$/i.test(v.color)?v.color:s.lights[l.id].color};}
 for(const t of televisions){const v=raw.tv?.[t.id];if(v){let c=initialTV();for(const k of ['volume','channel','source'])c=changeTV(c,k,v[k]);c.on=v.on===true;c.muted=v.muted===true;s.tv[t.id]=c;}}
 s.night=raw.night===true;s.markers=false;s.shutters=restoreShutters(raw.shutters);s.presence=raw.presence==='away'?'away':'home';s.security=raw.security==='armed'?'armed':'disarmed';
 s.music.volume=clamp(raw.music?.volume,0,100,35);
 if(Array.isArray(raw.music?.speakers)&&raw.music.speakers.length===4)s.music.speakers=raw.music.speakers.map(v=>v===true);
 // A reload never resumes sound or a moving gate.
 for(const id of ['rdc','etage']){const c=raw.climate?.[id];if(c)s.climate[id]={on:c.on===true,temperature:clamp(c.temperature,16,30,23),ambient:clamp(c.ambient,10,40,26),mode:['cool','heat','fan'].includes(c.mode)?c.mode:'cool'};}
 s.spa={jets:raw.spa?.jets===true,intensity:clamp(raw.spa?.intensity,10,100,60)};
 s.pool={pump:raw.pool?.pump===true};
 for(const id of ['bath-down','bath-up'])s.humidity[id]=clamp(raw.humidity?.[id],0,100,s.humidity[id]);
 const position=clamp(raw.gate?.position,0,1,0);s.gate={position,target:position};
 s.routines=Array.isArray(raw.routines)?raw.routines.slice(0,30).filter(validRoutine).map(r=>({id:r.id,name:r.name.slice(0,60),time:r.time,days:[...new Set(r.days)],scene:r.scene,enabled:r.enabled===true,lastRun:typeof r.lastRun==='string'?r.lastRun:''})):[];
 s.log=Array.isArray(raw.log)?raw.log.slice(0,30).filter(l=>typeof l.text==='string'&&l.text.length<200&&typeof l.at==='string').map(l=>({text:l.text,at:l.at})):[];return s;
}
export function validRoutine(r){return r&&typeof r.id==='string'&&/^[a-z0-9-]{1,80}$/i.test(r.id)&&typeof r.name==='string'&&r.name.trim().length>0&&/^([01]\d|2[0-3]):[0-5]\d$/.test(r.time)&&Array.isArray(r.days)&&r.days.length>0&&r.days.every(d=>Number.isInteger(d)&&d>=0&&d<=6)&&scenes.some(s=>s.id===r.scene);}
export function lightingForFloor(floor){return lights.filter(l=>floor==='overview'||l.zone===floor||(floor==='rdc'&&['patio','stairs'].includes(l.id))||(floor==='etage'&&l.id==='stairs'));}
export function setFloorLights(state,floor,on){const s=structuredClone(state);for(const l of lightingForFloor(floor))s.lights[l.id].on=on;return s;}
function allLights(s,on,brightness){for(const l of Object.values(s.lights)){l.on=on;if(brightness)l.brightness=brightness;}}
export function applyScene(state,id){
 const s=structuredClone(state);if(!scenes.some(x=>x.id===id))return s;
 if(id==='off'||id==='night'||id==='departure'){
  for(const v of [...Object.values(s.fans),...Object.values(s.sockets)])v.on=false;
  allLights(s,false);for(const t of Object.values(s.tv))t.on=false;s.music.playing=false;s.spa.jets=false;s.pool.pump=false;for(const c of Object.values(s.climate))c.on=false;s.gate.target=0;
  if(id==='night'){s.night=true;for(const k of ['entry','stairs'])s.lights[k]={...s.lights[k],on:true,brightness:20};}
 }
 if(id==='night')s.shutters=commandShutters(s.shutters,'all','close');
 if(id==='off')s.shutters=commandShutters(s.shutters,'all','stop');
 if(id==='departure'){s.shutters=commandShutters(s.shutters,'all','close');s.presence='away';s.security='armed';}
 if(id==='morning'){s.night=false;s.shutters=commandShutters(s.shutters,'all','open');allLights(s,false);s.music.playing=false;}
 if(id==='evening'){s.night=true;allLights(s,false);for(const k of ['living','kitchen','patio','garden','pool','entry'])Object.assign(s.lights[k],{on:true,brightness:k==='garden'?25:45});s.music.playing=true;}
 if(id==='welcome'){for(const k of ['entry','stairs','living','kitchen'])s.lights[k].on=true;s.gate.target=1;}
 if(id==='terrace'){s.night=true;for(const [k,b] of Object.entries({patio:75,garden:35,gazebo:50,pool:85,entry:30}))s.lights[k]={...s.lights[k],on:true,brightness:b};s.music.playing=true;s.music.speakers=[true,true,true,true];}
 if(id==='swim'){s.lights.pool.on=s.lights.spa.on=true;s.spa.jets=true;s.pool.pump=true;s.lights.patio.on=true;}
 if(id==='comfort')for(const c of Object.values(s.climate))Object.assign(c,{on:true,temperature:23,mode:'cool'});
 return s;
}
export function tickGate(gate,seconds){const step=Math.max(0,Math.min(seconds,1))/4,delta=gate.target-gate.position;return {...gate,position:Math.abs(delta)<=step?gate.target:gate.position+Math.sign(delta)*step};}
export function activeCount(s){return equipmentSummary(s).devices.on;}
export function dueRoutines(s,date=new Date()){
 const day=[date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
 const time=String(date.getHours()).padStart(2,'0')+':'+String(date.getMinutes()).padStart(2,'0');
 return s.routines.filter(r=>r.enabled&&r.days.includes(date.getDay())&&r.time===time&&r.lastRun!==day).map(r=>({id:r.id,scene:r.scene,day}));
}
