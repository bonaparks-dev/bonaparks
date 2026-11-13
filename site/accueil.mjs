// The home page: the scroll drives one house in three dimensions (maison3d.html inside a frame, same site), from the
// whole property to the ground floor, upstairs, then a simulated night alert seen by the garden camera.
const $=id=>document.getElementById(id),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
const story=document.querySelector('.story'),frame=$('house'),pin=document.querySelector('.pin');
const captions=[...document.querySelectorAll('.captions article')];
let house=null,phase=-1,drift=0;

// The house in the frame: quiet, without its own controls, and turning slowly when nothing else asks it to move.
frame.addEventListener('load',()=>{
 const doc=frame.contentDocument,win=frame.contentWindow;if(!doc||!win)return;
 const style=doc.createElement('style');style.textContent='.floors,.back,.toast,.now,.top,.spaces,.who,.hint,.fine,.labels{display:none!important}';doc.head.append(style);
 const wait=()=>{if(win.parks3d){house=win.parks3d;phase=-1;update();}else setTimeout(wait,120);};wait();
});

const phases=[
 ()=>{house.stop?.();house.floor(false,true);house.mode('evening',true);house.flyTo({target:house.home.target.clone(),az:-.62,pol:.86,dist:36},1600);},
 ()=>{house.stop?.();house.floor(false,true);house.enter('living');},
 ()=>{house.stop?.();house.floor(true,true);setTimeout(()=>house.flyTo({target:house.home.target.clone().set(-.5,3,0),az:-.5,pol:.78,dist:22},1400),200);},
 ()=>{house.floor(false,true);house.play('intrusion');}
];
function update(){
 const r=story.getBoundingClientRect(),span=r.height-innerHeight,p=clamp(span>0?-r.top/span:0,0,1);
 let i=0;captions.forEach((c,k)=>{if(p>=Number(c.dataset.from)-.0001)i=k;});
 captions.forEach((c,k)=>c.classList.toggle('on',k===i));
 if(house&&i!==phase){phase=i;try{phases[i]();}catch{}}
 // The alert shows once the garden camera has seen the person (the house says so with its own alert panel).
 const alerted=phase===3&&house&&frame.contentDocument?.getElementById('alert')?.hidden===false;
 pin.classList.toggle('show-alert',!!alerted);
 $('cursor').style.setProperty('--cursor',(10+clamp((p-.64)/.36,0,1)*78)+'%');
}
let queued=false;const ask=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;update();});};
addEventListener('scroll',ask,{passive:true});addEventListener('resize',ask);
// A slow turn of the whole property while the first caption is read.
function tick(){if(house&&phase===0&&!reduce){drift+=.0012;house.orbit.az=-.62+Math.sin(drift)*.5;}
 if(phase===3){const s=Math.floor(performance.now()/1000)%60;$('clock').textContent=`02:15:${String(s).padStart(2,'0')}`;}
 update();requestAnimationFrame(tick);}
requestAnimationFrame(tick);

// "Regardez de plus près": one picture per function.
const shots={lumieres:'Une lampe par pièce, commandée d’un geste.',volets:'Les volets descendent tout seuls quand plus personne n’est à l’étage.',portail:'Le portail s’ouvre d’un geste, ou quand la voiture arrive.',intrusion:'La caméra repère une personne inconnue et trace son chemin en rouge.',scenario:'Arrivée, départ, nuit : une scène règle toute la maison d’un coup.'};
for(const b of document.querySelectorAll('[data-shot]'))b.addEventListener('click',()=>{
 for(const o of document.querySelectorAll('[data-shot]'))o.setAttribute('aria-selected',String(o===b));
 const img=$('closer-img');img.style.opacity=0;setTimeout(()=>{img.src=`accueil/${b.dataset.shot}.webp`;img.style.opacity=1;},180);
 $('closer-text').textContent=shots[b.dataset.shot];
});

// The languages at the foot of the page: kept for the next visit, the current one marked.
{const mark=()=>{const now=(document.documentElement.lang||'fr').slice(0,2);for(const a of document.querySelectorAll('#langs a'))a.toggleAttribute('aria-current',a.dataset.lang===now);};
 for(const a of document.querySelectorAll('#langs a'))a.addEventListener('click',e=>{e.preventDefault();try{localStorage.setItem('parks.language',a.dataset.lang);}catch{}const u=new URL(location.href);u.searchParams.set('lang',a.dataset.lang);location.href=u;});
 mark();new MutationObserver(mark).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});}
