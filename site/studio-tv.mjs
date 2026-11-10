import {televisions,tvSources} from './studio-home-model.mjs';
import {homeIcon as ico} from './studio-home-map.mjs';

export function tvPanel(state,id){
 const device=televisions.find(t=>t.id===id),t=state.tv[id];if(!device||!t)return '';
 const command=(action,label,content,extra='')=>`<button data-home-tv="${id}:${action}" aria-label="${label} · ${device.name}" ${extra}>${content}</button>`;
 return `<section class="home-tv-card ${t.on?'on':''}" data-tv-card="${id}" aria-label="${device.name}">
  <div class="home-tv-heading"><i>${ico('tv')}</i><div><strong>${device.name}</strong><small>${t.on?'Allumée':'Éteinte'} · aperçu</small></div>${command('power',t.on?'Éteindre':'Allumer',ico('power'),`class="tv-power" aria-pressed="${t.on}"`)}</div>
  <div class="tv-preview ${t.on?'on':''}" aria-live="polite"><span>${t.on?(t.source==='tv'?'CH. '+String(t.channel).padStart(2,'0'):tvSources[t.source]):'VEILLE'}</span><strong>${t.on?(t.source==='tv'?'Chaîne '+t.channel:tvSources[t.source]):'Votre télécommande'}</strong><small>${t.on?'Simulation de l’écran':'Appuyez sur le bouton marche'}</small></div>
  <div class="tv-remote" ${t.on?'':'inert'}><label class="tv-source">Source<select data-home-tv-source="${id}" aria-label="Source · ${device.name}" ${t.on?'':'disabled'}>${Object.entries(tvSources).map(([v,n])=>`<option value="${v}" ${t.source===v?'selected':''}>${n}</option>`).join('')}</select></label>
  <div class="tv-channel">${command('previous','Chaîne précédente','−',`${!t.on||t.source!=='tv'||t.channel<=1?'disabled':''}`)}<label>CHAÎNE<input type="number" inputmode="numeric" min="1" max="999" value="${t.channel}" data-home-tv-channel="${id}" aria-label="Numéro de chaîne · ${device.name}" ${!t.on||t.source!=='tv'?'disabled':''}></label>${command('next','Chaîne suivante','+',`${!t.on||t.source!=='tv'||t.channel>=999?'disabled':''}`)}</div>
  <label class="home-range">Volume<output>${t.volume}%</output><input type="range" min="0" max="100" value="${t.volume}" data-home-range="tv-volume:${id}" aria-label="Volume · ${device.name}" ${t.on?'':'disabled'}></label>
  <div class="tv-volume-buttons">${command('quieter','Baisser le volume','−',`${!t.on||t.volume===0?'disabled':''}`)}${command('mute',t.muted?'Rétablir le son':'Couper le son',ico(t.muted?'muted':'speaker')+'<span>'+(t.muted?'Son coupé':'Son actif')+'</span>',`aria-pressed="${t.muted}" ${t.on?'':'disabled'}`)}${command('louder','Augmenter le volume','+',`${!t.on||t.volume===100?'disabled':''}`)}</div></div>
  <p class="tv-note">Commandes de démonstration · téléviseur non connecté.</p>
 </section>`;
}
