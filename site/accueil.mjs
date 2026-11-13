// The home page. Two views of the same house (maison3d.html, same site): one turns by itself under the title, the other
// is the demo itself, with its floors, its dashboard and its scenes. While the alert scene plays, what the garden
// camera saw shows under the demo. Nothing is ever written over the house. Everything is simulated.
const $=id=>document.getElementById(id),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
const quiet='.floors,.back,.toast,.now,.top,.spaces,.who,.hint,.fine,.labels,.tag{display:none!important}';
function house(frame,css){return new Promise(done=>{let started=false;const ready=()=>{const doc=frame.contentDocument,win=frame.contentWindow;if(!doc||!win||started)return;started=true;
 if(css){const s=doc.createElement('style');s.textContent=css;doc.head.append(s);}
 const wait=()=>win.parks3d?done(win.parks3d):setTimeout(wait,120);wait();};
 frame.addEventListener('load',ready);if(frame.contentDocument?.readyState==='complete'&&frame.contentWindow?.location.href!=='about:blank')ready();});}

// 1. The house under the title turns slowly, on its own, like a product on its stand. No text, no controls on it.
let turning=null,az=-.62;
house($('turn'),quiet).then(h=>{turning=h;h.mode('evening',true);h.flyTo({target:h.home.target.clone(),az,pol:.82,dist:52},1200);});
function spin(){if(turning&&!reduce){az+=.0016;turning.orbit.az=az;}requestAnimationFrame(spin);}
requestAnimationFrame(spin);

// 2. The demo. The chips above it start a scene; the alert scene opens what the camera saw.
let demo=null;
house($('house')).then(h=>{demo=h;h.cctv?.($('feed'));});
for(const b of document.querySelectorAll('[data-play]'))b.addEventListener('click',()=>{if(!demo)return;
 for(const o of document.querySelectorAll('[data-play]'))o.classList.toggle('on',o===b);demo.play(b.dataset.play);});
let t0=0;
function watch(){
 const doc=$('house').contentDocument,alerted=!!doc&&doc.getElementById('alert')?.hidden===false&&doc.documentElement.dataset.scene==='intrusion'&&!!$('house').contentWindow?.parks3d?.signedIn;   // camera pictures are for signed-in accounts only
 $('seen').classList.toggle('on',alerted);
 if(alerted){if(!t0)t0=performance.now();const s=Math.floor((performance.now()-t0)/1000),hh=`02:15:${String(s%60).padStart(2,'0')}`;$('clock').textContent=hh;$('stamp').textContent='CAM 04 · JARDIN · '+hh;
  const small=$('feed-small').getContext('2d');small.drawImage($('feed'),0,0);$('cursor').style.setProperty('--cursor',(10+clamp(s/22,0,1)*78)+'%');}else t0=0;
 const playing=!!doc&&doc.getElementById('transport')?.hidden===false;if(!playing)for(const o of document.querySelectorAll('[data-play]'))o.classList.remove('on');
 setTimeout(watch,250);}
watch();

// "Regardez de plus près": one picture per function.
const shots={lumieres:'Une lampe par pièce, commandée d’un geste.',volets:'Les volets descendent tout seuls quand plus personne n’est à l’étage.',portail:'Le portail s’ouvre d’un geste, ou quand la voiture arrive.',intrusion:'La caméra repère une personne inconnue et trace son chemin en rouge.',scenario:'Un enfant s’approche de la piscine : les parents sont prévenus avant qu’il n’atteigne le bord.'};
for(const b of document.querySelectorAll('[data-shot]'))b.addEventListener('click',()=>{
 for(const o of document.querySelectorAll('[data-shot]'))o.setAttribute('aria-selected',String(o===b));
 const img=$('closer-img');img.style.opacity=0;setTimeout(()=>{img.src=`accueil/${b.dataset.shot}.webp?v=2`;img.style.opacity=1;},180);
 $('closer-text').textContent=shots[b.dataset.shot];
});

// The language, as Apple places its country and region: at the foot of the page, with a globe.
{const pick=$('lang'),mark=()=>{const now=(document.documentElement.lang||'fr').slice(0,2);pick.value=['fr','en','it'].includes(now)?now:'en';};
 pick.addEventListener('change',()=>{try{localStorage.setItem('parks.language',pick.value);}catch{}const u=new URL(location.href);u.searchParams.set('lang',pick.value);location.href=u;});
 mark();new MutationObserver(mark).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});}
