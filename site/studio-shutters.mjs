import {upperWindows} from './studio-upper-map.mjs';
export const shutters=[
 {id:'master',name:'Chambre du fond · gauche'},
 {id:'guest',name:'Chambre du fond · droite'},
 {id:'children',name:'Chambre des enfants'},
 {id:'blue',name:'Chambre au lit bleu'}
].map(s=>({...s,window:upperWindows[s.id]}));
// position is the opening percentage; reload never resumes a motor.
export function initialShutters(){return Object.fromEntries(shutters.map(s=>[s.id,{position:100,target:100}]));}
export function restoreShutters(raw){const next=initialShutters();for(const s of shutters){const v=raw?.[s.id]?.position;if(Number.isFinite(v)){const position=Math.max(0,Math.min(100,v));next[s.id]={position,target:position};}}return next;}
export function commandShutters(state,id,action,value){
 const result=structuredClone(state),ids=id==='all'?shutters.map(s=>s.id):shutters.some(s=>s.id===id)?[id]:[];
 for(const key of ids){const s=result[key];if(action==='open')s.target=100;if(action==='close')s.target=0;if(action==='stop')s.target=s.position;if(action==='position'&&Number.isFinite(value))s.target=Math.max(0,Math.min(100,value));}
 return result;
}
export function tickShutters(state,seconds){const step=Math.max(0,Math.min(.2,seconds))*100/5;return Object.fromEntries(Object.entries(state).map(([id,s])=>{const d=s.target-s.position;return[id,{...s,position:Math.abs(d)<=step?s.target:s.position+Math.sign(d)*step}];}));}
export function shutterStatus(s){return Math.abs(s.target-s.position)>.01?(s.target>s.position?'Ouverture…':'Fermeture…'):s.position<=.01?'Fermé':s.position>=99.99?'Ouvert':'Arrêté';}
export function shutterShape(window,opening){
 const [a,b,c,d]=window,k=1-Math.max(0,Math.min(100,opening))/100;
 return [a,b,[b[0]+(c[0]-b[0])*k,b[1]+(c[1]-b[1])*k],[a[0]+(d[0]-a[0])*k,a[1]+(d[1]-a[1])*k]];
}
export function shuttersMarkup(state){return shutters.filter(s=>s.window).map(s=>{
 const shape=shutterShape(s.window,state[s.id].position),[a,b,c,d]=shape;
 const lines=Array.from({length:8},(_,i)=>{const t=(i+1)/9;return `M${a[0]+(d[0]-a[0])*t} ${a[1]+(d[1]-a[1])*t}L${b[0]+(c[0]-b[0])*t} ${b[1]+(c[1]-b[1])*t}`;}).join(' ');
 return `<g data-key="shutter-${s.id}" data-shutter-surface="${s.id}" opacity="${state[s.id].position<99.8?1:0}"><polygon points="${shape.map(p=>p.join(',')).join(' ')}" fill="#dedbd4" stroke="#a8a6a1" stroke-width=".8"/><path d="${lines}" fill="none" stroke="#969795" stroke-width=".6"/></g>`;
}).join('');}
const button=(id,action,label,icon)=>`<button data-shutter="${id}:${action}" aria-label="${label}">${icon}</button>`;
export function shutterPanel(state,id='all'){
 const list=shutters.filter(s=>id==='all'||s.id===id);if(!list.length)return '';
 return `<section class="shutters-panel" aria-label="Volets roulants du premier étage"><div class="shutters-heading"><span>CONFORT · PREMIER ÉTAGE</span><h3>Volets roulants</h3><p>Ouvrir, arrêter ou ajuster chaque volet.</p></div>${id==='all'?`<div class="shutters-bulk">${button('all','open','Ouvrir tous les volets','Tout ouvrir')}${button('all','stop','Arrêter tous les volets','Arrêter')}${button('all','close','Fermer tous les volets','Tout fermer')}</div>`:''}${list.map(s=>{const v=state[s.id];return `<article class="shutter-card" data-shutter-card="${s.id}"><div class="shutter-top"><div class="shutter-preview" aria-hidden="true"><i style="height:${100-v.position}%"></i></div><div><strong>${s.name}</strong><small data-shutter-status="${s.id}">${shutterStatus(v)}</small></div><b data-shutter-percent="${s.id}">${Math.round(v.position)} %</b></div><div class="shutter-actions">${button(s.id,'open','Ouvrir le volet · '+s.name,'↑ Ouvrir')}${button(s.id,'stop','Arrêter le volet · '+s.name,'■ Arrêter')}${button(s.id,'close','Fermer le volet · '+s.name,'↓ Fermer')}</div><label class="home-range">Ouverture souhaitée<output data-shutter-target="${s.id}">${Math.round(v.target)} %</output><input type="range" min="0" max="100" step="1" value="${Math.round(v.target)}" data-shutter-range="${s.id}" aria-label="Ouverture du volet · ${s.name}"></label></article>`;}).join('')}<p class="home-help">Animation de démonstration. Les volets visibles suivent les fenêtres du rendu ; les ouvertures masquées par la coupe restent accessibles ici.</p></section>`;
}
