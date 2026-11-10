import {lights,televisions} from './studio-home-model.mjs';
import {fans,sockets,quickModes} from './studio-equipment.mjs';
import {shutters} from './studio-shutters.mjs';
import {homeIcon} from './studio-home-map.mjs';

// Describe the applied state, never an optimistic click or a physical device.
export function commandFeedback(device,id,value,s){
 const message=(icon,title,detail='')=>({icon,title,detail});
 const power=(icon,title,on)=>message(icon,title,on?'En marche':'À l’arrêt');
 const room=lights.find(l=>l.id===id)?.name||'Toute la maison';
 const climate=id==='etage'?'Clim · étage':'Clim · RDC';
 const tv=televisions.find(t=>t.id===id)?.name||'TV';
 if(device==='mode'){const m=quickModes.find(m=>m.id===id);return m?message(m.icon,m.name,m.detail):null;}
 if(device==='gate'){const g=s.gate;return message('gate',g.target>g.position?'Ouverture du portail':g.target<g.position?'Fermeture du portail':g.position===1?'Portail ouvert':g.position===0?'Portail fermé':'Portail arrêté');}
 if(device==='light')return message('light',room,s.lights[id].on?'Allumée':'Éteinte');
 if(device==='brightness'||device==='brightness-all')return message('light','Intensité lumineuse',(device==='brightness'?room:'Toute la maison')+' · '+(device==='brightness'?s.lights[id].brightness:Object.values(s.lights)[0].brightness)+' %');
 if(device==='lights'||device==='bulk-lights')return message('light',device==='lights'?(id==='on'?'Tout allumer':'Tout éteindre'):'Toute la maison',Object.values(s.lights).filter(l=>l.on).length+' / '+Object.keys(s.lights).length+' · Lumières');
 if(device==='ac')return power('air',climate,s.climate[id].on);
 if(device==='temperature')return message('air',climate,s.climate[id].temperature+' °C');
 if(device==='fan')return power('fan',fans.find(f=>f.id===id).name,s.fans[id].on);
 if(device==='fan-speed')return message('fan',fans.find(f=>f.id===id).name,'Vitesse '+s.fans[id].speed+' · '+(s.fans[id].on?'En marche':'À l’arrêt'));
 if(device==='socket')return power('plug',sockets.find(p=>p.id===id).name,s.sockets[id].on);
 if(device==='bulk-sockets')return message('plug','Prises',Object.values(s.sockets).filter(p=>p.on).length+' / '+Object.keys(s.sockets).length+' · En marche');
 if(device==='pool-pump')return power('water','Pompe de la piscine',s.pool.pump);
 if(device==='spa-pump')return power('water','Pompe du jacuzzi',s.spa.jets);
 if(device==='car')return power('car','Phares',s.car.on);
 if(device==='music')return message('music','Musique',s.music.playing?'Lecture':'Pause');
 if(device==='music-volume')return message('music','Musique','Volume '+s.music.volume+' %');
 if(device==='tv')return power('tv',tv,s.tv[id].on);
 if(device==='tv-volume')return message('tv',tv,'Volume '+s.tv[id].volume+' %');
 if(device==='tv-channel')return message('tv',tv,'Chaîne '+s.tv[id].channel);
 if(device==='shutter')return message('shutter',id==='all'?'Tous les volets':shutters.find(w=>w.id===id)?.name||'Volets',({open:'Ouverture…',close:'Fermeture…',stop:'Arrêté'})[value]||value+' %');
 return null;
}

export function controlFeedback(d,s){
 const cmd=(type,id,value)=>commandFeedback(type,id,value,s);
 const toggle=d.homeDirect||d.homeToggle;
 if(toggle){if(s.lights[toggle])return cmd('light',toggle);if(toggle.startsWith('ac-'))return cmd('ac',toggle.slice(3));return cmd(toggle==='jets'?'spa-pump':toggle,toggle)||{icon:'check',title:'Réglage appliqué'};}
 if(d.homeGate)return cmd('gate');
 if(d.homeLights)return cmd('lights',d.homeLights);
 if(d.homeTemp)return cmd('temperature',d.homeTemp.split(':')[0]);
 if(d.homeClimate)return {icon:'air',title:'Climatisation',detail:({cool:'Refroidissement',heat:'Chauffage',fan:'Ventilation'})[s.climate[d.homeClimate.split(':')[0]].mode]};
 if(d.homeTv){const [id,action]=d.homeTv.split(':');if(action==='power')return cmd('tv',id);if(['louder','quieter'].includes(action))return cmd('tv-volume',id);if(['next','previous','channel'].includes(action))return cmd('tv-channel',id);return {icon:'tv',title:televisions.find(t=>t.id===id).name,detail:s.tv[id].muted?'Son coupé':'Son activé'};}
 if(d.homeSpeaker!==undefined)return {icon:'speaker',title:'Enceinte '+(Number(d.homeSpeaker)+1),detail:s.music.speakers[Number(d.homeSpeaker)]?'En marche':'À l’arrêt'};
 if(d.homeColor)return {icon:'light',title:'Couleur de lumière',detail:lights.find(l=>l.id===d.homeColor.split(':')[0])?.name};
 if(d.homeAction?.startsWith('lights-'))return cmd('bulk-lights');
 return {icon:'check',title:'Réglage appliqué'};
}

export class ActionFeedback{
 constructor(){
  this.root=document.createElement('aside');this.root.className='action-feedback';this.root.hidden=true;
  this.root.innerHTML='<i aria-hidden="true"></i><div role="status" aria-live="polite" aria-atomic="true"><strong></strong><span></span></div><button type="button" aria-label="Fermer">×</button>';
  document.body.append(this.root);this.root.querySelector('button').onclick=()=>this.hide();
  this.root.onpointerenter=()=>clearTimeout(this.timer);this.root.onpointerleave=()=>this.schedule();
 }
 show(input){
  if(!input)return;const m=typeof input==='string'?{title:input,icon:'check'}:input;
  if(typeof m.title!=='string')return;clearTimeout(this.pending);
  // Coalesce continuous sliders, without delaying the first acknowledgement.
  this.next=m;
  if(!this.root.hidden&&performance.now()-this.last<160){this.pending=setTimeout(()=>this.paint(this.next),160);return;}
  this.paint(m);
 }
 paint(m){this.root.querySelector('i').innerHTML=homeIcon(m.icon||'check');this.root.querySelector('strong').textContent=m.title;this.root.querySelector('span').textContent=typeof m.detail==='string'?m.detail:'';this.root.hidden=false;this.last=performance.now();this.schedule();}
 schedule(){clearTimeout(this.timer);this.timer=setTimeout(()=>this.hide(),3800);}
 hide(){clearTimeout(this.timer);clearTimeout(this.pending);this.root.hidden=true;}
}
