import {ActionFeedback} from './studio-feedback.mjs';
const feedback=new ActionFeedback();
import {controlsMarkup,updateControls,icon,modesMarkup,summaryMarkup,updateOverview} from './landing-controls.mjs';
import {tours} from './studio-tour-model.mjs';
import {applyPresentation} from './studio-presentation.mjs';
const params=new URLSearchParams(location.search);
let controlFloor=null,controlState=null;
const modeControls=document.querySelector('#demo-modes'),inventory=document.querySelector('#demo-inventory'),back=document.querySelector('#demo-back');modeControls.innerHTML=modesMarkup();inventory.innerHTML=summaryMarkup();
modeControls.addEventListener('click',e=>{const b=e.target.closest('[data-device]');if(b)post('device',{device:'mode',id:b.dataset.id});});
back.addEventListener('click',()=>post('space',{id:'all'}));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!back.hidden)post('space',{id:'all'});});
inventory.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.bulk)post('device',{device:'bulk-'+b.dataset.bulk,id:''});if(b.hasAttribute('data-intensity-toggle')){const p=inventory.querySelector('.master-dimmer');p.hidden=!p.hidden;b.setAttribute('aria-expanded',String(!p.hidden));}});
inventory.addEventListener('input',e=>{if(e.target.dataset.device)post('device',{device:e.target.dataset.device,id:'',value:Number(e.target.value)});});
const pendingCommands=[];
const equipment=document.querySelector('#demo-equipment');
let selected=Object.hasOwn(tours,params.get('scenario'))?params.get('scenario'):'arrival',iframe=null,playing=false,ready=false,interactive=false;
const controls=document.querySelector('#demo-scenarios'),poster=document.querySelector('#demo-poster'),screen=document.querySelector('#demo-screen'),caption=document.querySelector('#demo-caption'),play=document.querySelector('#demo-play'),seek=document.querySelector('#demo-seek'),note=document.querySelector('#demo-access-note'),launch=document.querySelector('#demo-launch'),posterImage=poster.querySelector('img');
function fitPoster(){if(posterImage.naturalWidth)poster.style.transform=applyPresentation(poster,'overview',posterImage.naturalWidth,posterImage.naturalHeight,screen.clientWidth,screen.clientHeight);}
posterImage.addEventListener('load',fitPoster);new ResizeObserver(fitPoster).observe(screen);fitPoster();
controls.innerHTML=Object.entries(tours).map(([id,t],i)=>'<button class="demo-scenario" data-tour="'+id+'" aria-pressed="'+(id===selected)+'" title="'+t.description+'"><i>'+icon(['home','gate','tv','eye'][i])+'</i><span><strong>'+t.name+'</strong></span><small>60 s</small></button>').join('');
function post(action,extra={}){if(!ready){pendingCommands.push([action,extra]);return;}iframe?.contentWindow?.postMessage({type:'parks-tour-control',action,...extra},location.origin);}
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
seek.addEventListener('input',()=>{post('pause',{silent:true});post('seek',{time:Number(seek.value)});});
document.querySelector('#demo-floors').addEventListener('click',e=>{const b=e.target.closest('[data-floor]');if(b)post('floor',{floor:b.dataset.floor});});
equipment.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const d=b.dataset;if(d.demoLights)post('device',{device:'lights',id:d.demoLights});else if(d.device)post('device',{device:d.device,id:d.id,value:d.value});else if(d.adjust&&controlState){const current=d.adjust==='temperature'?controlState.climate[d.id].temperature:controlState.tv[d.id].channel;post('device',{device:d.adjust,id:d.id,value:current+Number(d.delta)});}});
equipment.addEventListener('input',e=>{const d=e.target.dataset;if(d.device)post('device',{device:d.device,id:d.id,value:Number(e.target.value)});});
window.addEventListener('message',e=>{
 if(e.origin!==location.origin||e.source!==iframe?.contentWindow)return;
 if(e.data?.type==='parks-action-feedback'){feedback.show(e.data.message);return;}
 if(e.data?.type!=='parks-tour-state')return;
 const d=e.data;if(!Object.hasOwn(tours,d.id))return;if(d.id!==selected){if(!ready){ready=true;post('start',{id:selected});}return;}ready=true;poster.hidden=true;document.querySelectorAll('#demo-transport button,#demo-transport input').forEach(el=>el.disabled=false);screen.removeAttribute('aria-busy');
 playing=d.playing;interactive=d.interactive;caption.textContent=d.caption;document.querySelector('#demo-level').textContent={overview:'Vue d’ensemble',rdc:'Rez-de-chaussée',etage:'Premier étage'}[d.floor];
 controls.querySelectorAll('[data-tour]').forEach(b=>b.setAttribute('aria-pressed',String(!interactive&&b.dataset.tour===d.id)));
 document.querySelectorAll('[data-floor]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.floor===d.floor)));
 launch.setAttribute('aria-pressed',String(interactive));launch.textContent=interactive?'Exploration libre':'Prendre les commandes';
 note.textContent=interactive?'À vous de jouer. Touchez un équipement ou utilisez les commandes.':'60 secondes · Lecture à vitesse réelle';
 document.querySelector('.demo-caption').classList.toggle('alert',d.severity==='alert');play.textContent=playing?'Ⅱ':'▶';play.setAttribute('aria-label',playing?'Mettre le scénario en pause':'Lire le scénario');
 const time=t=>Math.floor(t/60)+':'+String(Math.floor(t%60)).padStart(2,'0');document.querySelector('#demo-time').textContent=time(d.time)+' / 1:00';if(document.activeElement!==seek)seek.value=d.time;
 if(controlFloor!==d.floor){controlFloor=d.floor;equipment.innerHTML=controlsMarkup(d.floor);}
 controlState=d.controls;updateControls(equipment,d.controls);updateControls(inventory,d.controls);updateOverview(inventory,d.controls,d.mode);updateOverview(modeControls,d.controls,d.mode);back.hidden=!d.space||d.space==='all';
 if(back.hidden&&document.activeElement===back)launch.focus({preventScroll:true});
 for(const [action,extra]of pendingCommands.splice(0))post(action,extra);

});
document.addEventListener('visibilitychange',()=>{if(document.hidden)post('pause',{silent:true});});
new IntersectionObserver(entries=>{if(!entries[0].isIntersecting)post('pause',{silent:true});},{threshold:.1}).observe(document.querySelector('#demo'));
choose(selected);
// No account, personal data or physical device is involved in these public controls.
