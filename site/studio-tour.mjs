import {applySecurityResponse} from './studio-security-response.mjs';
import {commandFeedback} from './studio-feedback.mjs';
import {quickModes} from './studio-equipment.mjs';
import {demoCommand} from './studio-demo-controls.mjs';
import {tours,tourFrame} from './studio-tour-model.mjs';
import {journeyActors} from './studio-life-model.mjs';
import {initialHome} from './studio-home-model.mjs';
import {initialSpatial,cameraAt,safetyState} from './studio-spatial-model.mjs';
export class ShowcaseTour{
 constructor(home){this.home=home;this.id=null;this.lastId='arrival';this.time=0;this.playing=false;this.mode=null;this.floor=null;this.lastPaint=0;this.lastPost=0;this.frame=null;
  window.addEventListener('message',e=>{if(e.origin!==location.origin||e.source!==parent||e.data?.type!=='parks-tour-control')return;const d=e.data;
   if(d.action==='start'&&tours[d.id]){this.start(d.id);this.notify({icon:'play',title:tours[d.id].name,detail:'60 secondes · Lecture à vitesse réelle'});}
   if(d.action==='pause'){this.playing=false;if(!d.silent)this.notify({icon:'pause',title:'Pause'});}
   if(d.action==='play'){if(!this.id)this.start(this.lastId);if(this.frame?.done)this.seek(0);this.playing=true;this.notify({icon:'play',title:'Lecture'});}
   if(d.action==='seek')this.seek(d.time);
   if(d.action==='interactive'){this.manual();this.notify({icon:'home',title:'Exploration libre',detail:'À vous de jouer. Touchez un équipement ou utilisez les commandes.'});}
   if(d.action==='device')this.command(d.device,d.id,d.value);
   if(d.action==='space'&&typeof d.id==='string')this.focus(d.id);
   if(d.action==='floor'&&['overview','rdc','etage'].includes(d.floor)){this.manual();this.home.onFloor?.(d.floor);this.notify({icon:'home',title:({overview:'Vue d’ensemble',rdc:'Rez-de-chaussée',etage:'Premier étage'})[d.floor]});}
   this.publish();
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden){this.playing=false;this.publish();}});
 }
 notify(message){if(message)parent.postMessage({type:'parks-action-feedback',message},location.origin);}
 start(id){if(!tours[id])return;const h=this.home;h.life.stop();h.spatial.pause();h.spatial.responseActive=false;cancelAnimationFrame(h.gateFrame);cancelAnimationFrame(h.shutterFrame);h.gateFrame=h.shutterFrame=0;h.scene=null;h.spaceId='all';h.aimSpace();this.id=this.lastId=id;this.time=0;this.mode=null;this.floor=null;this.playing=!h.spatial.motion.matches;h.state=initialHome();h.state.night=true;h.spatial.state={...initialSpatial(),members:[...initialSpatial().members,{id:'child-2',name:'Enfant · télé',kind:'child',color:'#b6a6e5',look:1,zone:'children'},{id:'child-3',name:'Enfant · jeux',kind:'child',color:'#e1af83',look:0,zone:'blue'}]};this.apply();this.publish();}
 manual(){if(!this.id)return;this.lastId=this.id;this.id=null;this.frame=null;this.playing=false;this.home.life.stop();this.home.spatial.pause();this.home.spatial.securityOpen=false;delete this.home.state.alertResponse;this.home.state.presence='home';this.home.state.security='disarmed';this.home.state.doors={patio:0,upstairs:0};this.home.renderMap();this.home.spatial.draw();this.publish();}
 command(device,id,value){const h=this.home;if(!demoCommand(h.state,h.floor,device,id,value))return;this.manual();const result=demoCommand(h.state,h.floor,device,id,value);h.state=result.state;h.scene=result.mode||null;if(result.gate)h.startGate();if(result.shutters)h.startShutters();h.renderMap();h.spatial.draw();this.publish();this.notify(commandFeedback(device,id,value,h.state));}

 focus(id){if(id!=='all'&&!this.home.layer.querySelector('[data-home-space="'+CSS.escape(id)+'"]'))return;this.manual();this.home.selectSpace(id);this.publish();this.notify({icon:'home',title:id==='all'?'Vue complète':this.home.spaceBar.querySelector('[data-home-space="'+CSS.escape(id)+'"]')?.textContent||'Maison'});}
 seek(t){if(!this.id)this.start(this.lastId);this.time=Math.max(0,Math.min(60,Number(t)||0));this.mode=null;this.apply();this.publish();}
 tick(dt,now){if(this.id){if(this.home.state.alertResponse&&!this.playing&&this.home.state.alertResponse.speaking){this.home.state.alertResponse.speaking=false;this.home.renderMap();}this.home.spatial.playing=this.playing&&!!this.frame?.incident;if(this.playing){this.time=Math.min(60,this.time+dt);this.apply();if(this.frame.done){this.playing=false;if(this.id==='arrival'){this.manual();this.home.onFloor?.('overview');}}}}if(now-this.lastPost>.25){this.lastPost=now;this.publish();}}
 apply(){const f=this.frame=tourFrame(this.id,this.time),h=this.home,s=h.state;
  if(f.floor!==this.floor){this.floor=f.floor;h.onFloor?.(f.floor);h.stage.classList.remove('tour-floor-enter');void h.stage.offsetWidth;h.stage.classList.add('tour-floor-enter');}
  if(f.journey){if(h.life.mode!==f.id){h.life.mode=f.id;h.life.lastFlags='';}h.life.time=f.time;h.life.playing=false;h.life.apply();}
  else {h.life.mode=null;h.life.frame=null;s.presence='home';s.security='disarmed';if(this.mode!==f.id){this.mode=f.id;for(const [id,l]of Object.entries(s.lights))l.on=['living','kitchen','children','blue','hall','patio','pool','garden'].includes(id);s.tv.living.on=s.tv.children.on=true;s.climate.rdc.on=s.climate.etage.on=true;s.pool.pump=s.spa.jets=s.lights.spa.on=true;h.renderMap();}}
  if(f.response){applySecurityResponse(s,f.time);s.alertResponse.speaking=f.response.speaking&&this.playing;}else delete s.alertResponse;
  h.spatial.securityOpen=!!f.incident;h.spatial.scenario=f.incident||'intrusion';if(f.incident){h.spatial.time=f.incidentTime;h.spatial.camera=cameraAt(f.incident,f.incidentTime);h.spatial.playing=this.playing;}else h.spatial.playing=false;
  if(performance.now()-this.lastPaint>100){h.renderMap();this.lastPaint=performance.now();}
 }
 actors(list){if(!this.frame)return list;const f=this.frame;if(f.journey){const members=this.home.spatial.state.members.filter(m=>m.id!=='child-1');return journeyActors(f.id,f.time,f.floor,members).map(a=>({...a,moving:a.moving&&this.playing}));}
  if(f.incident==='pool')return list.filter(a=>a.id!=='child-1').map(a=>a.kind==='adult'?{...a,x:a.id==='adult-1'?588:566,y:a.id==='adult-1'?705:679,moving:false,heading:.8}:a);
  if(f.floor==='etage')return list.map(a=>a.id==='child-2'?{...a,x:315,y:477,moving:false,heading:-1.5}:a);
  return list;
 }
 publish(){const f=this.frame,s=this.home.state;parent.postMessage({type:'parks-tour-state',id:this.id||this.lastId,interactive:!this.id,time:this.time,duration:60,floor:this.home.floor,caption:f?.caption||(quickModes.find(m=>m.id===this.home.scene)?.detail)||'À vous de jouer. Touchez un équipement ou utilisez les commandes.',playing:this.playing,done:f?.done||false,response:f?.response||null,severity:f?.incident?safetyState(f.incident,f.incidentTime):'idle',mode:this.home.scene,space:this.home.spaceId,controls:{fans:s.fans,sockets:s.sockets,lights:s.lights,climate:s.climate,tv:s.tv,music:s.music,humidity:s.humidity,shutters:s.shutters,pool:s.pool,spa:s.spa,gate:s.gate,car:{on:this.home.life.vehicle()?.lights===true}},devices:{pool:s.lights.pool.on,spa:s.lights.spa.on,'pool-pump':s.pool.pump,'spa-pump':s.spa.jets,'ac-rdc':s.climate.rdc.on,'ac-etage':s.climate.etage.on,car:this.home.life.vehicle()?.lights===true,gate:s.gate.target>.5},readings:{rdc:s.climate.rdc.ambient,etage:s.climate.etage.ambient,'bath-down':s.humidity['bath-down'],'bath-up':s.humidity['bath-up']}},location.origin);}
}
