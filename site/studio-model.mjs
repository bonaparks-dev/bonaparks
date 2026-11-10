// Metres in a shared X/Y plan; Y becomes Z in the 3D scene.
export const KEY='bonaparks.studio.v1';
export const uid=()=>crypto.randomUUID();
export const copy=value=>structuredClone(value);
export const snap=value=>Math.round(value*10)/10;
export const materials={oak:{label:'Chêne naturel',color:'#b69b78'},stone:{label:'Pierre claire',color:'#c6c3b2'},sage:{label:'Sauge',color:'#82977b'},clay:{label:'Terre cuite',color:'#b1836b'}};
export const catalog={sofa:{label:'Canapé',w:2.2,d:.9,icon:'sofa'},bed:{label:'Lit double',w:1.6,d:2,icon:'bed'},table:{label:'Table',w:1.5,d:.9,icon:'table'},kitchen:{label:'Cuisine',w:2.4,d:.6,icon:'kitchen'},plant:{label:'Plante',w:.5,d:.5,icon:'plant'},bath:{label:'Baignoire',w:.75,d:1.7,icon:'bath'},sink:{label:'Vasque',w:.8,d:.5,icon:'sink'},wardrobe:{label:'Placard',w:1.8,d:.6,icon:'wardrobe'}};
export function blankProject(name='Ma maison'){return {version:1,id:uid(),name,updatedAt:new Date().toISOString(),floors:[{id:uid(),name:'Rez-de-chaussée',height:2.6,rooms:[],openings:[],objects:[],reference:null}]};}
export function exampleProject(){
 const p=blankProject('Maison Atelier');p.example=true;const f=p.floors[0];
 f.rooms=[{id:'living',name:'Séjour',x:0,y:0,w:5.8,d:4.2,material:'oak'},{id:'kitchen',name:'Cuisine',x:5.8,y:0,w:3.2,d:4.2,material:'stone'},{id:'bedroom',name:'Chambre',x:0,y:4.2,w:4,d:3.4,material:'oak'},{id:'hall',name:'Entrée',x:4,y:4.2,w:1.8,d:3.4,material:'stone'},{id:'bathroom',name:'Salle de bain',x:5.8,y:4.2,w:3.2,d:3.4,material:'stone'}];
 f.openings=[['living','n',1.2,2,'window'],['kitchen','n',.5,1.7,'window'],['living','e',1.1,1.5,'door'],['living','s',4.3,1,'door'],['bedroom','e',.7,.9,'door'],['bathroom','w',.7,.9,'door'],['hall','s',.4,1,'door'],['bedroom','s',.7,1.8,'window'],['bathroom','e',1,1,'window']].map(([roomId,side,offset,width,kind])=>({id:uid(),roomId,side,offset,width,kind}));
 f.objects=[['sofa',.35,1.1,90],['table',3.3,1.5,0],['plant',.45,.4,0],['kitchen',6.1,.2,0],['bed',.75,4.6,0],['wardrobe',2,6.9,0],['bath',7.9,4.6,0],['sink',6.2,4.4,0],['plant',8.3,3.4,0]].map(([kind,x,y,rotation])=>({id:uid(),kind,x,y,rotation,...catalog[kind]}));
 const upper={id:uid(),name:'Premier étage',height:2.6,rooms:[{id:uid(),name:'Bureau',x:0,y:0,w:5,d:4,material:'oak'}],openings:[],objects:[],reference:null};
 upper.openings=[{id:uid(),roomId:upper.rooms[0].id,side:'n',offset:1,width:2,kind:'window'}];upper.objects=[{id:uid(),kind:'table',x:1,y:1,rotation:0,...catalog.table}];p.floors.push(upper);return p;
}
const finite=(n,min,max)=>typeof n==='number'&&Number.isFinite(n)&&n>=min&&n<=max;
const nameOK=s=>typeof s==='string'&&s.trim().length>0&&s.length<=80;
export function validateProject(p){
 const fail=m=>{throw new Error(m);};
 if(!p||p.version!==1||!nameOK(p.name)||!nameOK(p.id))fail('Ce fichier n’est pas un projet Bonaparks compatible.');
 if(!Array.isArray(p.floors)||!p.floors.length||p.floors.length>12)fail('Un projet doit contenir de 1 à 12 niveaux.');
 const ids=new Set();const id=s=>{if(typeof s!=='string'||!/^[A-Za-z0-9_-]{1,80}$/.test(s)||ids.has(s))fail('Identifiant absent ou dupliqué.');ids.add(s);};id(p.id);
 for(const f of p.floors){id(f.id);if(!nameOK(f.name)||!finite(f.height,2,5))fail('Niveau invalide.');
  for(const key of ['rooms','objects','openings'])if(!Array.isArray(f[key])||f[key].length>300)fail('Le plan contient trop d’éléments.');
  for(const r of f.rooms){id(r.id);if(!nameOK(r.name)||!finite(r.x,-100,100)||!finite(r.y,-100,100)||!finite(r.w,.5,40)||!finite(r.d,.5,40)||!Object.hasOwn(materials,r.material))fail('Dimensions de pièce invalides.');}
  for(const o of f.objects){id(o.id);if(!Object.hasOwn(catalog,o.kind)||!finite(o.x,-100,100)||!finite(o.y,-100,100)||!finite(o.w,.1,10)||!finite(o.d,.1,10)||!finite(o.rotation,0,359))fail('Mobilier invalide.');}
  for(const o of f.openings){id(o.id);const r=f.rooms.find(r=>r.id===o.roomId);if(!r||!['n','s','e','w'].includes(o.side)||!['door','window'].includes(o.kind)||!finite(o.width,.4,6)||!finite(o.offset,0,40)||o.offset+o.width>sideLength(r,o.side)+.001)fail('Une ouverture dépasse de son mur.');}
  if(f.rooms.some(r=>roomOverlap(f,r)))fail('Les pièces ne peuvent pas se chevaucher.');
  const lines=f.openings.map(o=>openingLine(f,o));
  for(let i=0;i<lines.length;i++)for(let j=i+1;j<lines.length;j++){const a=lines[i],b=lines[j];if(a.axis===b.axis&&Math.abs(a.fixed-b.fixed)<.001&&a.start<b.end-.001&&a.end>b.start+.001)fail('Deux ouvertures se chevauchent sur un mur.');}
  if(f.reference){const r=f.reference;if(typeof r.src!=='string'||r.src.length>3000000||!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(r.src)||!finite(r.x,-100,100)||!finite(r.y,-100,100)||!finite(r.w,.5,80)||!finite(r.d,.5,80)||!finite(r.opacity,.1,1))fail('Image de référence invalide.');}
 }
 return copy(p);
}
export const sideLength=(r,s)=>['n','s'].includes(s)?r.w:r.d;
export function openingLine(f,o){const r=f.rooms.find(r=>r.id===o.roomId);if(!r)return null;const horizontal=['n','s'].includes(o.side);return {axis:horizontal?'x':'y',fixed:horizontal?r.y+(o.side==='s'?r.d:0):r.x+(o.side==='e'?r.w:0),start:(horizontal?r.x:r.y)+o.offset,end:(horizontal?r.x:r.y)+o.offset+o.width,...o};}
export function roomOverlap(f,r,exclude=r.id){return f.rooms.some(a=>a.id!==exclude&&r.x<a.x+a.w-.001&&r.x+r.w>a.x+.001&&r.y<a.y+a.d-.001&&r.y+r.d>a.y+.001);}
export function nearestWall(f,p){let best=null;for(const r of f.rooms)for(const s of ['n','s','e','w']){const h=['n','s'].includes(s);const fixed=h?r.y+(s==='s'?r.d:0):r.x+(s==='e'?r.w:0);const start=h?r.x:r.y;const t=(h?p.x:p.y)-start;const distance=Math.hypot((h?p.y:p.x)-fixed,Math.max(0,-t,t-sideLength(r,s)));if(!best||distance<best.distance)best={room:r,side:s,distance,t};}return best;}
export function addOpening(f,kind,p){const n=nearestWall(f,p);if(!n||n.distance>.45)throw new Error('Cliquez sur le mur qui accueillera l’ouverture.');const width=Math.min(kind==='door'?.9:1.2,sideLength(n.room,n.side)-.2);if(width<.4)throw new Error('Ce mur est trop court.');const o={id:uid(),kind,roomId:n.room.id,side:n.side,width,offset:Math.max(.1,Math.min(sideLength(n.room,n.side)-width-.1,snap(n.t-width/2)))};const line=openingLine(f,o);if(f.openings.some(a=>{const l=openingLine(f,a);return l.axis===line.axis&&Math.abs(l.fixed-line.fixed)<.01&&l.start<line.end+.1&&l.end>line.start-.1;}))throw new Error('Une ouverture occupe déjà cet emplacement.');f.openings.push(o);return o;}
export function bounds(f){const rr=f.rooms;let x=0,y=0,w=10,d=8;if(rr.length){x=Math.min(...rr.map(r=>r.x));y=Math.min(...rr.map(r=>r.y));w=Math.max(...rr.map(r=>r.x+r.w))-x;d=Math.max(...rr.map(r=>r.y+r.d))-y;}if(f.reference){const r=f.reference;const right=Math.max(x+w,r.x+r.w),bottom=Math.max(y+d,r.y+r.d);x=Math.min(x,r.x);y=Math.min(y,r.y);w=right-x;d=bottom-y;}return{x,y,w,d};}
export const floorArea=f=>f.rooms.reduce((a,r)=>a+r.w*r.d,0);
// Merge coincident room edges, then split at all openings. A shared door cuts both rooms.
export function wallRuns(f){
 const lines=new Map();for(const r of f.rooms)for(const side of ['n','s','e','w']){const line=openingLine(f,{roomId:r.id,side,offset:0,width:sideLength(r,side)});const key=line.axis+':'+line.fixed.toFixed(4);const list=lines.get(key)||[];list.push(line);lines.set(key,list);}
 const output=[];for(const list of lines.values()){list.sort((a,b)=>a.start-b.start);const merged=[];for(const l of list){const last=merged.at(-1);if(last&&l.start<=last.end+.001)last.end=Math.max(last.end,l.end);else merged.push({...l});}for(const l of merged){const opens=f.openings.map(o=>openingLine(f,o)).filter(o=>o.axis===l.axis&&Math.abs(o.fixed-l.fixed)<.001&&o.end>l.start&&o.start<l.end);const cuts=[l.start,l.end,...opens.flatMap(o=>[o.start,o.end])].sort((a,b)=>a-b);for(let i=0;i<cuts.length-1;i++){const start=cuts[i],end=cuts[i+1];if(end-start<.001)continue;const mid=(start+end)/2;const opening=opens.find(o=>mid>=o.start&&mid<=o.end);output.push({axis:l.axis,fixed:l.fixed,start,end,kind:opening?.kind||'wall'});}}}return output;
}
export class History{constructor(limit=40){this.past=[];this.future=[];this.limit=limit;}record(p){this.past.push(copy(p));if(this.past.length>this.limit)this.past.shift();this.future=[];}undo(p){if(!this.past.length)return null;this.future.push(copy(p));return this.past.pop();}redo(p){if(!this.future.length)return null;this.past.push(copy(p));return this.future.pop();}}
