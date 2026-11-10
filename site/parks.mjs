const views={
  overview:{file:'overview_rdc_v23.png',caption:'La maison et ses extérieurs',alt:'Vue d’ensemble de Su Pranu : rez-de-chaussée, terrasse, jardin et piscine'},
  rdc:{file:'rdc_pro.png',caption:'Le rez-de-chaussée et sa terrasse',alt:'Rez-de-chaussée de Su Pranu, avec cuisine, salon et terrasse'},
  etage:{file:'etage_natif_v22.png',caption:'Les chambres et les espaces du premier étage',alt:'Premier étage de Su Pranu : chambres, couloir et salle de bain'}
};
const image=document.querySelector('#preview-image');
let request=0;
for(const button of document.querySelectorAll('[data-preview-floor]'))button.addEventListener('click',async()=>{
  const floor=button.dataset.previewFloor,view=views[floor],ticket=++request;
  document.querySelector('#showcase').setAttribute('aria-busy','true');
  const next=new Image();next.src=`supranu/${view.file}`;
  try{await next.decode();if(ticket!==request)return;
    image.src=next.src;image.alt=view.alt;
    for(const item of document.querySelectorAll('[data-preview-floor]'))item.setAttribute('aria-pressed',String(item===button));
    document.querySelector('#preview-caption').textContent=view.caption;
    document.querySelector('#open-preview').href=`studio.html?project=supranu&floor=${floor}`;
    document.querySelector('#discover-demo').href=`studio.html?project=supranu&floor=${floor}`;
  }catch{if(ticket===request)document.querySelector('#preview-caption').textContent='Vue indisponible. Réessayez ou ouvrez le studio.';}
  finally{if(ticket===request)document.querySelector('#showcase').removeAttribute('aria-busy');}
});
document.querySelector('#preview-night').addEventListener('click',e=>{
  const button=e.currentTarget,night=button.getAttribute('aria-pressed')!=='true';
  button.setAttribute('aria-pressed',String(night));
  button.setAttribute('aria-label',night?'Revenir à l’ambiance jour':'Activer l’ambiance nuit');
  button.querySelector('span').textContent=night?'Nuit':'Jour';
  document.querySelector('#showcase').classList.toggle('is-night',night);
});
