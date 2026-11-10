import {lights,televisions} from './studio-home-model.mjs';
import {shutters} from './studio-shutters.mjs';
import {homeIcon as icon} from './studio-home-map.mjs';
export {icon};
const shortName=s=>s.replace(' · RDC','').replace(' · étage','').replace('Chambre du fond · ','Ch. fond · ');
const card=(device,id,label,symbol='light',cool=false)=>`<button class="device-card ${cool?'cool':''}" data-device="${device}" data-id="${id}" aria-pressed="false"><i>${icon(symbol)}</i><span><strong>${label}</strong><small data-device-status>OFF</small></span></button>`;
const range=(device,id,label)=>`<label class="remote-range"><span>${label}</span><input type="range" min="0" max="100" value="25" data-device="${device}" data-id="${id}" aria-label="${label}"><output>25 %</output></label>`;
export function controlsMarkup(floor){
 const climate=floor==='overview'?['rdc','etage']:[floor];
 const roomLights=lights.filter(l=>!['pool','spa'].includes(l.id)&&(floor==='overview'?l.zone!=='etage':l.zone===floor));
 const titles={rdc:'Clim · RDC',etage:'Clim · étage'};
 let html='<div class="control-climates">'+climate.map(id=>`<div class="climate-card" data-climate="${id}"><i class="climate-symbol">${icon('air')}</i><span class="climate-copy"><strong>${titles[id]}</strong><small><span data-climate-status>OFF</span> · <span data-ambient="${id}">26,0 °C</span></small></span><button data-adjust="temperature" data-id="${id}" data-delta="-1" aria-label="Baisser la température">−</button><output data-setpoint="${id}">23°</output><button data-adjust="temperature" data-id="${id}" data-delta="1" aria-label="Augmenter la température">+</button><button data-device="ac" data-id="${id}" aria-label="${titles[id]}" aria-pressed="false">${icon('power')}</button></div>`).join('')+'</div>';
 html+='<div class="demo-readings"><span>Salle d’eau · RDC <small data-humidity="bath-down">58 %</small></span><span>Salle de bain · étage <small data-humidity="bath-up">64 %</small></span></div><p class="demo-humidity-label">Humidité · salles de bain</p>';
 html+='<div class="demo-mini-heading"><span>ÉCLAIRAGE</span><div><button data-demo-lights="on">Tout allumer</button><button data-demo-lights="off">Tout éteindre</button></div></div><div class="demo-light-grid">'+roomLights.map(l=>card('light',l.id,shortName(l.name))).join('')+'</div>';
 if(floor==='overview')html+='<h3 class="control-section-title">EXTÉRIEURS</h3><div class="demo-devices">'+card('light','pool','Lumière piscine','water',true)+card('light','spa','Lumière jacuzzi','water',true)+card('pool-pump','','Pompe piscine','water',true)+card('spa-pump','','Pompe jacuzzi','water',true)+card('gate','','Portail','gate',true)+card('car','','Voiture','power',true)+'</div>';
 const tvs=televisions.filter(t=>floor==='overview'||t.zone===floor);
 html+='<h3 class="control-section-title">DIVERTISSEMENT</h3>'+tvs.map(t=>`<section class="remote-card" data-tv="${t.id}"><div class="remote-top">${icon('tv')}<span>${t.name}</span><button data-device="tv" data-id="${t.id}" aria-label="${t.name}" aria-pressed="false">${icon('power')}</button></div><div class="remote-controls"><span>Télévision</span><button data-adjust="tv-channel" data-id="${t.id}" data-delta="-1" aria-label="Chaîne précédente">−</button><output data-channel="${t.id}">1</output><button data-adjust="tv-channel" data-id="${t.id}" data-delta="1" aria-label="Chaîne suivante">+</button></div>${range('tv-volume',t.id,'Volume')}</section>`).join('');
 if(floor!=='etage')html+=`<section class="remote-card"><div class="remote-top">${icon('music')}<span>Terrasse couverte · 4 enceintes</span><button data-device="music" data-id="" aria-label="Musique" aria-pressed="false">${icon('play')}</button></div>${range('music-volume','','Volume')}</section>`;
 if(floor==='etage')html+='<h3 class="control-section-title">VOLETS ROULANTS</h3>'+[{id:'all',name:'Tous les volets'},...shutters].map(s=>`<div class="shutter-control">${icon('gate')}<span>${shortName(s.name)}</span><output data-shutter="${s.id}">100 %</output><button data-device="shutter" data-id="${s.id}" data-value="open" aria-label="Ouvrir · ${s.name}">↑</button><button data-device="shutter" data-id="${s.id}" data-value="stop" aria-label="Arrêter · ${s.name}">Ⅱ</button><button data-device="shutter" data-id="${s.id}" data-value="close" aria-label="Fermer · ${s.name}">↓</button></div>`).join('');
 return html;
}
export function updateControls(root,s){
 if(!s)return;
 const text=(el,value)=>{if(el&&el.textContent!==value)el.textContent=value;};
 for(const b of root.querySelectorAll('button[data-device]')){
  const {device,id}=b.dataset;
  const on=device==='light'?s.lights[id]?.on:device==='ac'?s.climate[id]?.on:device==='tv'?s.tv[id]?.on:device==='music'?s.music.playing:device==='pool-pump'?s.pool.pump:device==='spa-pump'?s.spa.jets:device==='car'?s.car.on:device==='gate'?s.gate.target>.5:null;
  if(on!==null){b.setAttribute('aria-pressed',String(!!on));text(b.querySelector('[data-device-status]'),device==='gate'?(on?'Ouvert':'Fermé'):(on?'ON':'OFF'));}
 }
 for(const el of root.querySelectorAll('[data-climate]')){const c=s.climate[el.dataset.climate];el.classList.toggle('on',c.on);text(el.querySelector('[data-climate-status]'),c.on?'ON':'OFF');text(el.querySelector('[data-ambient]'),c.ambient.toFixed(1).replace('.',',')+' °C');text(el.querySelector('output'),c.temperature+'°');}
 for(const el of root.querySelectorAll('[data-humidity]'))text(el,s.humidity[el.dataset.humidity]+' %');
 for(const el of root.querySelectorAll('[data-channel]'))text(el,String(s.tv[el.dataset.channel].channel));
 for(const el of root.querySelectorAll('[data-shutter]')){const values=el.dataset.shutter==='all'?Object.values(s.shutters):[s.shutters[el.dataset.shutter]];text(el,Math.round(values.reduce((n,v)=>n+v.position,0)/values.length)+' %');}
 for(const el of root.querySelectorAll('input[data-device]')){const n=el.dataset.device==='tv-volume'?s.tv[el.dataset.id].volume:s.music.volume;if(document.activeElement!==el)el.value=n;text(el.nextElementSibling,n+' %');}
}
