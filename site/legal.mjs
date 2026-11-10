const dialog=document.querySelector('#erase-dialog');
document.querySelector('#privacy-erase')?.addEventListener('click',()=>dialog.showModal());
document.querySelector('#erase-confirm')?.addEventListener('click',()=>{
 let ok=true;try{for(const key of ['bonaparks.studio.v1','bonaparks.supranu.home.v1','bonaparks.supranu.spatial.v1'])localStorage.removeItem(key);}catch{ok=false;}
 dialog.close();document.querySelector('#privacy-status').textContent=ok?'Les données locales du studio ont été effacées dans ce navigateur. Fermez les autres onglets du studio pour éviter qu’ils ne réenregistrent leur état.':'Le navigateur a refusé l’accès au stockage. Utilisez ses réglages pour effacer les données du site.';
});
