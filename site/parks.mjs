import {tours} from './studio-tour-model.mjs';
import {applyPresentation} from './studio-presentation.mjs';
const icons={arrival:'↙',departure:'↗',family:'♡',security:'◈'},captions={arrival:'Une voiture qui rentre. Une maison qui s’allume.',departure:'Tout s’éteint. La maison veille sur elle-même.',family:'Chacun son espace. Toute la famille sur un même plan.',security:'Un mouvement sur le côté. Une alerte située dans la maison.'};
const params=new URLSearchParams(location.search);let selected=Object.hasOwn(tours,params.get('scenario'))?params.get('scenario'):'arrival',iframe=null,playing=false,duration=tours[selected].duration,ready=false;
const controls=document.querySelector('#demo-scenarios'),poster=document.querySelector('#demo-poster'),screen=document.querySelector('#demo-screen'),caption=document.querySelector('#demo-caption'),play=document.querySelector('#demo-play'),seek=document.querySelector('#demo-seek'),note=document.querySelector('#demo-access-note'),launch=document.querySelector('#demo-launch');
const posterImage=poster.querySelector('img');
function fitPoster(){if(!posterImage.naturalWidth)return;poster.style.transform=applyPresentation(poster,'overview',posterImage.naturalWidth,posterImage.naturalHeight,screen.clientWidth,screen.clientHeight);}
posterImage.addEventListener('load',fitPoster);new ResizeObserver(fitPoster).observe(screen);fitPoster();
controls.innerHTML=Object.entries(tours).map(([id,t],i)=>`<button class="demo-scenario" data-tour="${id}" aria-pressed="${id===selected}"><i>${icons[id]}</i><span><small>0${i+1} / ${t.duration} S</small><strong>${t.name}</strong><em>${t.description}</em><b>ENSEMBLE <span>·</span> RDC <span>·</span> ÉTAGE</b></span><span class="scenario-play">▶</span></button>`).join('');
function post(action,extra={}){iframe?.contentWindow?.postMessage({type:'parks-tour-control',action,...extra},location.origin);}
function choose(id){
 if(!Object.hasOwn(tours,id))return;
 selected=id;controls.querySelectorAll('[data-tour]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tour===id)));caption.textContent=captions[id];duration=tours[id].duration;seek.max=duration;
 if(!iframe){
  note.textContent='Chargement de la maison…';screen.setAttribute('aria-busy','true');
  iframe=document.createElement('iframe');iframe.title='Démonstration animée de Parks 3D';iframe.src='/demo.html?tour='+id+'&lang='+document.documentElement.lang.split('-')[0];iframe.tabIndex=-1;iframe.setAttribute('allow','');screen.append(iframe);
  iframe.addEventListener('load',()=>{ready=true;post('start',{id:selected});});
  iframe.addEventListener('error',()=>{note.textContent='Le chargement a échoué. Cliquez sur un scénario pour réessayer.';iframe.remove();iframe=null;ready=false;screen.removeAttribute('aria-busy');});
 }else if(ready)post('start',{id});
}
controls.addEventListener('click',e=>{const b=e.target.closest('[data-tour]');if(b)choose(b.dataset.tour);});
launch.addEventListener('click',()=>choose(selected));
play.addEventListener('click',()=>post(playing?'pause':'play'));document.querySelector('#demo-restart').addEventListener('click',()=>{post('seek',{time:0});post('play');});seek.addEventListener('input',()=>post('seek',{time:Number(seek.value)}));
window.addEventListener('message',e=>{
 if(e.origin!==location.origin||e.source!==iframe?.contentWindow||e.data?.type!=='parks-tour-state')return;
 const d=e.data;if(!Object.hasOwn(tours,d.id))return;
 ready=true;poster.hidden=true;document.querySelectorAll('#demo-transport button,#demo-transport input').forEach(el=>el.disabled=false);screen.removeAttribute('aria-busy');document.querySelector('#demo-transport').hidden=false;launch.textContent='Rejouer la démo ↻';note.textContent='Accès libre, sans inscription. Choisissez un scénario et laissez la maison raconter son histoire.';
 playing=d.playing;duration=d.duration;caption.textContent=d.caption;document.querySelector('#demo-level').textContent={overview:'Vue d’ensemble',rdc:'Rez-de-chaussée',etage:'Premier étage'}[d.floor];document.querySelector('.demo-caption').classList.toggle('alert',d.severity==='alert');play.textContent=playing?'Ⅱ':'▶';play.setAttribute('aria-label',playing?'Mettre le scénario en pause':'Lire le scénario');
 const time=t=>`${Math.floor(t/60)}:${String(Math.floor(t%60)).padStart(2,'0')}`;document.querySelector('#demo-time').textContent=time(d.time)+' / '+time(duration);seek.max=duration;if(document.activeElement!==seek)seek.value=d.time;
});
document.addEventListener('visibilitychange',()=>{if(document.hidden)post('pause');});new IntersectionObserver(entries=>{if(!entries[0].isIntersecting)post('pause');},{threshold:.1}).observe(document.querySelector('#demo'));
// Public scenarios never depend on the account service or create an access cookie.
