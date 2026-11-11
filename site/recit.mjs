// The story page: the scroll position plays one evening, then one alert, on the picture of the pilot house.
// Places are given in the space of the full render (1000 x 1000 over 4096 x 2560 px), as in
// studio-overview-projection.mjs; the page shows that render cut to the land.
const cut={x:40,y:123,w:4016,h:2342};
const px=u=>(u*4.096-cut.x)/cut.w*100, py=v=>(v*2.56-cut.y)/cut.h*100;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const between=(p,a,b)=>{const t=clamp((p-a)/(b-a));return t*t*(3-2*t);};

// Where the light of each circuit falls: lamps (x, y, reach) kept inside straight walls.
const rooms={
 entry:{box:[47,100,294,612],lamps:[[110,205,95],[205,205,95],[150,330,120],[110,470,110]]},
 patio:{box:[304,469,570,690],lamps:[[336,487,150],[552,640,150],[440,540,150]]},
 house:{box:[329,227,569,463],lamps:[[360,236,150],[428,236,150],[559,284,160],[559,454,160],[450,360,170]]},
 garden:{box:[615,215,950,700],lamps:[[650,250,95],[930,260,95],[900,470,95],[790,560,95],[680,600,80]]}
};
const maskOf=({box:[x0,y0,x1,y1],lamps})=>{
 const spots=lamps.map(([x,y,r])=>`radial-gradient(ellipse ${r/9.8}% ${r/5.9}% at ${px(x)}% ${py(y)}%,#000 0,#000 35%,rgba(0,0,0,.5) 68%,transparent 100%)`).join(',');
 return {mask:spots,clip:`polygon(${px(x0)}% ${py(y0)}%,${px(x1)}% ${py(y0)}%,${px(x1)}% ${py(y1)}%,${px(x0)}% ${py(y1)}%)`};
};
for(const node of document.querySelectorAll('.lit')){const m=maskOf(rooms[node.dataset.room]);node.style.setProperty('--mask',m.mask);node.style.clipPath=m.clip;}
for(const node of document.querySelectorAll('.glow.pool')){node.style.left=px(713)+'%';node.style.top=py(723)+'%';node.style.width=(px(903)-px(713))+'%';node.style.height=(py(846)-py(723))+'%';}
for(const gate of document.querySelectorAll('[data-gate]')){gate.style.left=px(84)+'%';gate.style.width=(px(174.4)-px(84))+'%';gate.style.top=(py(200.8)-2.2)+'%';gate.style.height='2.2%';}

const along=(points,t)=>{const n=points.length-1,i=Math.min(n-1,Math.floor(clamp(t)*n)),k=clamp(t)*n-i,[a,b]=[points[i],points[i+1]];return [a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k];};
const drive=[[128,150],[128,205],[140,330],[178,470],[178,560]];           // through the gate to the parking place
const walk=[[930,330],[850,345],[770,400],[715,455],[660,470]];            // across the right-hand lawn
const camera=[940,235];

const scenes={
 evening(root,p){
  const stage=root.querySelector('[data-stage]');
  stage.style.setProperty('--night',between(p,.04,.2));
  const lit=name=>root.querySelector(`[data-room="${name}"]`);
  const off=between(p,.86,.94);
  lit('entry').style.opacity=between(p,.22,.3)*(1-.7*off);
  lit('patio').style.opacity=between(p,.44,.5)*(1-off);
  lit('house').style.opacity=between(p,.5,.58)*(1-off);
  lit('garden').style.opacity=between(p,.64,.72)*(1-off);
  lit('pool').style.opacity=between(p,.66,.74)*(1-off);
  const gate=root.querySelector('[data-gate]');gate.style.setProperty('--open',between(p,.22,.27)*(1-between(p,.4,.46)));
  const car=root.querySelector('[data-car]'),t=between(p,.25,.42),[x,y]=along(drive,t);
  car.style.left=px(x)+'%';car.style.top=py(y)+'%';car.style.opacity=between(p,.24,.27);
 },
 alert(root,p){
  root.style.setProperty('--zoom',between(p,.12,.34));
  const t=between(p,.3,.6),[x,y]=along(walk,t),person=root.querySelector('[data-person]'),cam=root.querySelector('[data-camera]');
  person.style.left=px(x)+'%';person.style.top=py(y)+'%';person.style.opacity=p>.29?1:0;
  cam.style.left=px(camera[0])+'%';cam.style.top=py(camera[1])+'%';
  const X=u=>px(u)*10,Y=v=>py(v)*10,dx=x-camera[0],dy=y-camera[1],l=Math.hypot(dx,dy)||1,nx=-dy/l*46,ny=dx/l*46;
  root.querySelector('[data-cone]').setAttribute('points',p>.29?`${X(camera[0])},${Y(camera[1])} ${X(x+nx)},${Y(y+ny)} ${X(x-nx)},${Y(y-ny)}`:'');
  const done=walk.slice(0,Math.floor(t*(walk.length-1))+1).concat([[x,y]]);
  root.querySelector('[data-trail]').setAttribute('points',p>.29?done.map(([u,v])=>X(u)+','+Y(v)).join(' '):'');
  root.querySelector('[data-notice]').classList.toggle('on',p>.6);
 }
};

const stories=[...document.querySelectorAll('[data-story]')];
function frame(){
 for(const root of stories){
  const r=root.getBoundingClientRect(),span=r.height-innerHeight,p=clamp(span>0?-r.top/span:0);
  if(root.dataset.p===p.toFixed(4))continue;root.dataset.p=p.toFixed(4);
  root.style.setProperty('--p',p);
  scenes[root.dataset.story](root,p);
  const captions=[...root.querySelectorAll('.captions article')];let current=captions[0];
  for(const c of captions)if(p>=Number(c.dataset.at)-.0001)current=c;
  for(const c of captions)c.classList.toggle('on',c===current);
 }
}
let queued=false;const ask=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;frame();});};
addEventListener('scroll',ask,{passive:true});addEventListener('resize',ask);frame();

const seen=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){e.target.classList.add('seen');seen.unobserve(e.target);}},{threshold:.2});
for(const node of document.querySelectorAll('.trio figure,.phone'))seen.observe(node);
