import {translate} from './i18n.mjs?v=1';
import {securityMessage} from './studio-security-response.mjs';
const paths={phone:'M8 2h8v20H8Z M11 18h2',hub:'M3 4h18v13H3Z M8 22h8 M12 17v5',speaker:'M4 9h4l5-5v16l-5-5H4Z M17 8q5 4 0 8',shield:'m12 2 8 3v7c0 6-8 10-8 10S4 18 4 12V5Z M8 12l3 3 5-6'};
const icon=id=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">${paths[id]?`<path d="${paths[id]}"/>`:''}</svg>`;
export const securityPanelMarkup=()=>`<section class="security-response" hidden aria-label="Réactions de la maison"><header>${icon('shield')}<span>ALERTE · DÉMONSTRATION</span><button type="button" data-security-audio aria-pressed="false" aria-label="Annonce vocale">${icon('speaker')}</button></header><p class="security-message" role="status"></p><div class="security-channels">${[['phones','phone','Téléphones'],['hub','hub','Écran central'],['speakers','speaker','Enceintes']].map(([id,symbol,label])=>`<div data-channel-status="${id}">${icon(symbol)}<span>${label}</span><small>En attente</small><i></i></div>`).join('')}</div><footer><span data-security-shutters>Famille à la maison</span><span data-security-progress></span></footer><div class="security-progress"><i></i></div></section>`;
export class SecurityPanel{
 constructor(host){this.host=host;this.host.innerHTML=securityPanelMarkup();this.audio=false;this.spoken=false;this.lastTime=0;this.frame=null;this.synth=globalThis.speechSynthesis;this.host.addEventListener('click',e=>{if(e.target.closest('[data-security-audio]')){this.audio=!this.audio;this.synth?.cancel();if(this.audio&&this.frame?.alert)this.speak();this.updateButton();}});document.addEventListener('visibilitychange',()=>{if(document.hidden)this.synth?.cancel();});}
 start(){this.audio=true;this.updateButton();this.synth?.cancel();this.spoken=false;this.lastTime=0;}
 updateButton(){const b=this.host.querySelector('[data-security-audio]');b.disabled=!this.synth;b.setAttribute('aria-pressed',String(this.audio));b.title=this.audio?'Couper l’annonce vocale':'Écouter l’annonce vocale';}
 speak(){if(!this.synth||!this.audio)return;const lang=document.documentElement.lang.split('-')[0],u=new SpeechSynthesisUtterance(translate(securityMessage,lang));u.lang=({fr:'fr-FR',en:'en-GB',it:'it-IT',es:'es-ES',de:'de-DE',zh:'zh-CN',ru:'ru-RU'})[lang]||'fr-FR';const local=this.synth.getVoices().find(v=>v.localService&&v.lang.startsWith(lang));if(local)u.voice=local;u.rate=.94;this.synth.cancel();this.synth.speak(u);}
 update(f,playing=false){
  this.frame=f;const root=this.host.querySelector('.security-response');if(!root)return;root.hidden=!f;
  if(!f){this.synth?.cancel();this.spoken=false;this.lastTime=0;return;}
  if(f.time<this.lastTime)this.spoken=f.time>=22;
  if(!playing||!f.speaking)this.synth?.cancel();
  if(playing&&f.speaking&&!this.spoken){this.speak();this.spoken=true;}
  this.lastTime=f.time;root.classList.toggle('detected',f.detected);root.classList.toggle('alert',f.alert);
  const set=(q,value)=>{const e=root.querySelector(q),s=translate(value,document.documentElement.lang.split('-')[0]);if(e.textContent!==s)e.textContent=s;};
  set('.security-message',f.alert?f.message:f.detected?'La caméra latérale détecte une présence.':'Une personne entre dans le jardin à droite.');
  for(const [id,active,label]of [['phones',f.phones,'Notification reçue'],['hub',f.hub,'Alerte affichée'],['speakers',f.speaking||f.announced,f.speaking?'Annonce en cours':'Annonce diffusée']]){root.querySelector(`[data-channel-status="${id}"]`).classList.toggle('active',active);set(`[data-channel-status="${id}"] small`,active?label:'En attente');}
  set('[data-security-shutters]',f.shutterOpening===0?'Volets de l’étage fermés':f.closing?'Fermeture des volets de l’étage':'Famille à la maison');
  set('[data-security-progress]',f.time>=24?Math.round(100-f.shutterOpening)+' %':'');root.querySelector('.security-progress i').style.width=(100-f.shutterOpening)+'%';this.updateButton();
 }
}
