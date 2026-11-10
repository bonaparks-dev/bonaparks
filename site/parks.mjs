import {tours} from './studio-tour-model.mjs';
import {applyPresentation} from './studio-presentation.mjs';
const params=new URLSearchParams(location.search);
let selected=Object.hasOwn(tours,params.get('scenario'))?params.get('scenario'):'arrival',iframe=null,playing=false,ready=false,interactive=false;
const controls=document.querySelector('#demo-scenarios'),poster=document.querySelector('#demo-poster'),screen=document.querySelector('#demo-screen'),caption=document.querySelector('#demo-caption'),play=document.querySelector('#demo-play'),seek=document.querySelector('#demo-seek'),note=document.querySelector('#demo-access-note'),launch=document.querySelector('#demo-launch'),posterImage=poster.querySelector('img');
function fitPoster(){if(posterImage.naturalWidth)poster.style.transform=applyPresentation(poster,'overview',posterImage.naturalWidth,posterImage.naturalHeight,screen.clientWidth,screen.clientHeight);}
posterImage.addEventListener('load',fitPoster);new ResizeObserver(fitPoster).observe(screen);fitPoster();
controls.innerHTML=Object.entries(tours).map(([id,t],i)=>'<button class="demo-scenario" data-tour="'+id+'" aria-pressed="'+(id===selected)+'"><i>0'+(i+1)+'</i><span><strong>'+t.name+'</strong></span><small>60 s</small><span class="scenario-play">▶</span></button>').join('');
const devices=[['pool','light','pool','Lumière piscine'],['spa','light','spa','Lumière jacuzzi'],['pool-pump','pool-pump','','Pompe piscine'],['spa-pump','spa-pump','','Pompe jacuzzi'],['ac-rdc','ac','rdc','Clim · RDC'],['ac-etage','ac','etage','Clim · étage'],['car','car','','Voiture'],['gate','gate','','Portail']];
document.querySelector('#demo-devices').innerHTML=devices.map(([key,device,id,label])=>'<button data-device="'+device+'" data-id="'+id+'" data-state-key="'+key+'" aria-pressed="false"><span>'+label+'</span><b>OFF</b></button>').join('');
function post(action,extra={}){iframe?.contentWindow?.postMessage({type:'parks-tour-control',action,...extra},location.origin);}
function choose(id){
 if(!Object.hasOwn(tours,id))return;selected=id;interactive=false;controls.querySelectorAll('[data-tour]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tour===id)));seek.max=60;
 if(!iframe){note.textContent='Chargement de la maison…';screen.setAttribute('aria-busy','true');iframe=document.createElement('iframe');iframe.title='Démonstration animée de Parks 3D';iframe.src='/demo.html?tour='+id+'&lang='+document.documentElement.lang.split('-')[0];screen.append(iframe);
  iframe.addEventListener('error',()=>{note.textContent='Le chargement a échoué. Cliquez sur un scénario pour réessayer.';iframe.remove();iframe=null;ready=false;screen.removeAttribute('aria-busy');});
 }else if(ready)post('start',{id});
}
controls.addEventListener('click',e=>{const b=e.target.closest('[data-tour]');if(b)choose(b.dataset.tour);});
launch.addEventListener('click',()=>post('interactive'));
play.addEventListener('click',()=>post(playing?'pause':'play'));
document.querySelector('#demo-restart').addEventListener('click',()=>choose(selected));
seek.addEventListener('input',()=>{post('pause');post('seek',{time:Number(seek.value)});});
document.querySelector('#demo-devices').addEventListener('click',e=>{const b=e.target.closest('[data-device]');if(b)post('device',{device:b.dataset.device,id:b.dataset.id});});
document.querySelector('#demo-floors').addEventListener('click',e=>{const b=e.target.closest('[data-floor]');if(b)post('floor',{floor:b.dataset.floor});});
document.querySelectorAll('[data-demo-lights]').forEach(b=>b.addEventListener('click',()=>post('device',{device:'lights',id:b.dataset.demoLights})));
window.addEventListener('message',e=>{
 if(e.origin!==location.origin||e.source!==iframe?.contentWindow||e.data?.type!=='parks-tour-state')return;
 const d=e.data;if(!Object.hasOwn(tours,d.id))return;if(d.id!==selected){if(!ready){ready=true;post('start',{id:selected});}return;}ready=true;poster.hidden=true;document.querySelectorAll('#demo-transport button,#demo-transport input').forEach(el=>el.disabled=false);screen.removeAttribute('aria-busy');
 playing=d.playing;interactive=d.interactive;caption.textContent=d.caption;document.querySelector('#demo-level').textContent={overview:'Vue d’ensemble',rdc:'Rez-de-chaussée',etage:'Premier étage'}[d.floor];
 controls.querySelectorAll('[data-tour]').forEach(b=>b.setAttribute('aria-pressed',String(!interactive&&b.dataset.tour===d.id)));
 document.querySelectorAll('[data-floor]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.floor===d.floor)));
 launch.setAttribute('aria-pressed',String(interactive));launch.textContent=interactive?'Exploration libre':'Prendre les commandes';
 note.textContent=interactive?'À vous de jouer. Touchez un équipement ou utilisez les commandes.':'60 secondes · Lecture à vitesse réelle';
 document.querySelector('.demo-caption').classList.toggle('alert',d.severity==='alert');play.textContent=playing?'Ⅱ':'▶';play.setAttribute('aria-label',playing?'Mettre le scénario en pause':'Lire le scénario');
 const time=t=>Math.floor(t/60)+':'+String(Math.floor(t%60)).padStart(2,'0');document.querySelector('#demo-time').textContent=time(d.time)+' / 1:00';if(document.activeElement!==seek)seek.value=d.time;
 for(const b of document.querySelectorAll('[data-state-key]')){const on=!!d.devices?.[b.dataset.stateKey];b.setAttribute('aria-pressed',String(on));const label=b.dataset.stateKey==='gate'?(on?'Ouvert':'Fermé'):(on?'ON':'OFF');if(b.querySelector('b').textContent!==label)b.querySelector('b').textContent=label;}
 for(const n of document.querySelectorAll('[data-demo-reading]')){const key=n.dataset.demoReading,v=d.readings?.[key];if(Number.isFinite(v)){const text=key.startsWith('bath')?v+' %':v.toFixed(1).replace('.',',')+' °C';if(n.textContent!==text)n.textContent=text;}}
});
document.addEventListener('visibilitychange',()=>{if(document.hidden)post('pause');});
new IntersectionObserver(entries=>{if(!entries[0].isIntersecting)post('pause');},{threshold:.1}).observe(document.querySelector('#demo'));
choose(selected);
// No account, personal data or physical device is involved in these public controls.
