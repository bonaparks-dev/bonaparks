import {tours,tourFrame} from './studio-tour-model.mjs';
import {initialHome} from './studio-home-model.mjs';
import {initialSpatial,cameraAt,safetyState} from './studio-spatial-model.mjs';
import {ease} from './studio-motion.mjs';
export class ShowcaseTour{
 constructor(home){this.home=home;this.id=null;this.time=0;this.playing=false;this.mode=null;this.floor=null;this.lastPaint=0;this.lastPost=0;this.frame=null;this.savedHome=structuredClone(home.state);this.savedFamily=structuredClone(home.spatial.state);window.addEventListener('message',e=>{if(e.origin!==location.origin||e.source!==parent||e.data?.type!=='parks-tour-control')return;const d=e.data;if(d.action==='start')this.start(d.id);if(d.action==='pause')this.playing=false;if(d.action==='play'){if(this.frame?.done)this.seek(0);this.playing=true;}if(d.action==='seek')this.seek(d.time);this.publish();});document.addEventListener('visibilitychange',()=>{if(document.hidden){this.playing=false;this.publish();}});}
 start(id){if(!tours[id])return;this.home.life.stop();this.home.spatial.pause();this.id=id;this.time=0;this.mode=null;this.floor=null;this.playing=!this.home.spatial.motion.matches;this.home.state=initialHome();this.home.state.night=true;this.home.spatial.state={...initialSpatial(),members:[...initialSpatial().members,{id:'child-2',name:'Enfant · télé',kind:'child',color:'#b6a6e5',look:1,zone:'children'},{id:'child-3',name:'Enfant · jeux',kind:'child',color:'#e1af83',look:0,zone:'blue'}]};this.apply();this.publish();}
 seek(t){if(!this.id)return;this.time=Math.max(0,Math.min(tours[this.id].duration,Number(t)||0));this.mode=null;this.apply();this.publish();}
 tick(dt,now){if(!this.id)return;this.home.spatial.playing=this.playing&&!!this.frame?.incident;if(this.playing){this.time=Math.min(tours[this.id].duration,this.time+Math.min(.1,dt));this.apply();if(this.frame.done)this.playing=false;}if(now-this.lastPost>.25){this.lastPost=now;this.publish();}}
 apply(){const f=this.frame=tourFrame(this.id,this.time),h=this.home,s=h.state;
  if(f.floor!==this.floor){this.floor=f.floor;h.onFloor?.(f.floor);h.stage.classList.remove('tour-floor-enter');void h.stage.offsetWidth;h.stage.classList.add('tour-floor-enter');}
  if(f.journey){const id=f.journey.id;if(h.life.mode!==id){h.life.mode=id;h.life.lastFlags='';}h.life.time=f.journey.time;h.life.playing=false;h.life.apply();}else {h.life.mode=null;h.life.frame=null;s.presence='home';s.security='disarmed';}
  const mode=f.id+':'+f.chapter;if(mode!==this.mode&&!f.journey){this.mode=mode;for(const l of Object.values(s.lights))l.on=false;for(const t of Object.values(s.tv))t.on=false;s.music.playing=false;for(const c of Object.values(s.climate))c.on=false;
   if(f.id==='arrival'){for(const id of f.floor==='rdc'?['living','kitchen','patio']:f.floor==='etage'?['children','blue','hall','master','guest']:[])s.lights[id].on=true;if(f.floor==='rdc')s.tv.living.on=true;if(f.floor==='etage')s.climate.etage.on=true;}
   if(f.id==='departure'&&f.time<9){for(const id of ['children','blue','hall','master','guest'])s.lights[id].on=true;}
   if(['family','security'].includes(f.id)){for(const id of ['living','kitchen','children','blue','hall','patio','pool','garden'])s.lights[id].on=true;s.tv.living.on=true;s.tv.children.on=true;s.climate.rdc.on=s.climate.etage.on=true;s.pool.pump=true;s.spa.jets=true;s.lights.spa.on=true;}
   h.renderMap();h.renderBar();
  }
  if(f.id==='departure'){for(const id of ['master','guest','children','blue','hall','bath-up'])s.lights[id].on=f.time<4;for(const v of Object.values(s.shutters))v.position=v.target=(1-ease((f.time-2)/6))*100;if(f.time<18){s.gate={position:0,target:0};s.tv.living.on=f.time<11;s.lights.living.on=s.lights.kitchen.on=f.time<13;s.climate.rdc.on=f.time<12;}else {for(const id of ['master','guest','children','blue','hall','bath-up'])s.lights[id].on=false;s.climate.etage.on=false;}}
  if(f.id==='arrival'&&f.time>=38){for(const v of Object.values(s.shutters))v.position=v.target=100;s.gate={position:0,target:0};}
  h.spatial.securityOpen=!!f.incident;h.spatial.scenario=f.incident||'intrusion';if(f.incident){h.spatial.time=f.incidentTime;h.spatial.camera=cameraAt(f.incident,f.incidentTime);h.spatial.playing=this.playing;}else h.spatial.playing=false;
  if(performance.now()-this.lastPaint>120){h.renderMap();this.lastPaint=performance.now();}document.querySelector('#canvas-caption').textContent={overview:'VUE D’ENSEMBLE',rdc:'REZ-DE-CHAUSSÉE',etage:'PREMIER ÉTAGE'}[f.floor];
 }
 actors(list){if(!this.frame)return list;const f=this.frame;if(f.journey){const actors=this.home.life.actors(this.home.spatial.state.members.filter(m=>!['child-2','child-3'].includes(m.id)));if(actors)return actors.map(a=>({...a,moving:a.moving||this.playing&&this.frame.journey.walker.moving}));}
  if(f.id==='departure'&&f.time>=36)return [];
  if(f.incident==='pool')return list.filter(a=>a.id!=='child-1').map(a=>a.kind==='adult'?{...a,x:a.id==='adult-1'?588:566,y:a.id==='adult-1'?705:679,moving:false,heading:.8}:a);
  if(f.floor==='etage')return list.map(a=>a.id==='child-2'?{...a,x:315,y:477,moving:false,heading:-1.5}:a);
  return [...list];
 }
 publish(){if(!this.frame)return;const f=this.frame;parent.postMessage({type:'parks-tour-state',id:this.id,time:this.time,duration:f.duration,floor:f.floor,caption:f.caption,playing:this.playing,done:f.done,severity:f.incident?safetyState(f.incident,f.incidentTime):'idle'},location.origin);}
}
