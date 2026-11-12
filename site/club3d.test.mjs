import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const at=name=>new URL('./'+name,import.meta.url),read=name=>fs.readFileSync(at(name),'utf8');
const manifest=JSON.parse(read('club/club.json')),page=read('club3d.mjs'),html=read('club3d.html');
const file=fs.readFileSync(at('club/'+manifest.model));
const gltf=JSON.parse(file.subarray(20,20+file.readUInt32LE(12)).toString('utf8'));
const levels=['L0','L1'],channelIds=[...page.match(/const channelList=\[(.*?)\];/s)[1].matchAll(/\{id:'([^']+)'/g)].map(m=>m[1]);
const area=poly=>Math.abs(poly.reduce((s,p,i)=>{const q=poly[(i+1)%poly.length];return s+p[0]*q[1]-q[0]*p[1];},0))/2;
const inside=(poly,x,z)=>{let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const [xi,zi]=poly[i],[xj,zj]=poly[j];if((zi>z)!==(zj>z)&&x<(xj-xi)*(z-zi)/(zj-zi)+xi)c=!c;}return c;};
const bySize=[...manifest.rooms].sort((a,b)=>a.area-b.area),roomAt=(level,x,z)=>bySize.find(r=>r.level===level&&inside(r.poly,x,z));

test('the club model is one binary glTF file of a size a phone can load',()=>{
 assert.equal(file.subarray(0,4).toString('latin1'),'glTF');assert.equal(file.readUInt32LE(4),2);assert.equal(file.readUInt32LE(8),file.length);
 assert.ok(file.length<8*1048576,'model under 8 MiB: '+file.length);assert.equal(manifest.stats.bytes,file.length);
 assert.ok(manifest.stats.triangles<200000,'triangles: '+manifest.stats.triangles);assert.ok(manifest.stats.samples>=1024,'light baked at full quality: '+manifest.stats.samples);
 for(const name of gltf.extensionsRequired)assert.ok(['KHR_mesh_quantization','EXT_texture_webp'].includes(name),name);
});
test('every surface carries its baked light: one layer per lighting channel, and the open sky',()=>{
 assert.ok(gltf.meshes.length>60);
 for(const mesh of gltf.meshes)for(const p of mesh.primitives){const n=gltf.accessors[p.attributes.POSITION].count;
  for(const key of ['_LA','_LB','_LC']){const a=gltf.accessors[p.attributes[key]];assert.ok(a,mesh.name+' '+key);
   assert.equal(a.type,'VEC4');assert.equal(a.componentType,5121);assert.equal(a.normalized,true);assert.equal(a.count,n);}}
 for(const key of ['_LA','_LB','_LC'])assert.ok(page.includes('attribute vec4 '+key.toLowerCase()),'read by the page: '+key);
 assert.ok(manifest.light.open>0);
 for(const node of gltf.nodes){assert.ok([...levels,'F'].includes(node.extras.level),node.name);assert.ok(['main','ceiling'].includes(node.extras.layer),node.name);}
});
test('the lighting channels of the dashboard are those of the model, in the same order',()=>{
 assert.deepEqual(channelIds.slice(0,8),manifest.light.order);assert.deepEqual(manifest.channels.map(c=>c.id),channelIds);assert.equal(channelIds.length,9);
 assert.equal(manifest.light.scales.length,8);assert.match(page,/uniform vec3 uCh\[8\]/);
 for(const [i,c] of manifest.channels.entries()){assert.equal(c.color.length,3,c.id);for(const l of c.lamps)assert.ok(l.length===4&&l.every(Number.isFinite),c.id);
  if(i<8){assert.equal(c.baked,true,c.id);assert.ok(c.scale>0&&c.scale===manifest.light.scales[i],c.id+' scale');}}
 // the moving projectors are not baked: the page lights them, one patch of light each
 const show=manifest.channels[8],projectors=manifest.devices.filter(d=>d.type==='projector');
 assert.equal(show.id,'show');assert.equal(show.baked,false);assert.equal(show.lamps.length,8);assert.equal(projectors.length,8);
 for(const p of projectors)assert.ok(p.target.length===3&&p.target.every(Number.isFinite)&&p.target[1]<p.pos[1],p.label);
 assert.match(page,/uniform vec3 uSpotPos\[8\]/);
 for(const [name,m] of Object.entries(manifest.materials))if(m.channel)assert.ok(channelIds.includes(m.channel),name);
 assert.equal(Object.keys(manifest.materials).filter(n=>/^Arch LED \d$/.test(n)).length,manifest.arches.length);
});
test('levels and zones: each zone is an outline on a floor, large enough to stand in',()=>{
 assert.deepEqual(manifest.levels.map(l=>l.id),levels);assert.ok(manifest.levels[1].y>manifest.levels[0].top,'the upper level is above the room');
 assert.ok(manifest.rooms.length>=10);assert.equal(new Set(manifest.rooms.map(r=>r.id)).size,manifest.rooms.length,'zone ids are unique');
 const {min,max}=manifest.bounds;
 for(const r of manifest.rooms){
  assert.ok(levels.includes(r.level),r.id);assert.ok(r.id.startsWith(r.level.toLowerCase()+'-'),r.id);assert.ok(['hall','bar','vip','stage','entry','stair'].includes(r.kind),r.id+' kind');
  const floor=manifest.levels.find(l=>l.id===r.level);assert.ok(r.y>=floor.y&&r.y<=floor.y+1.01,r.id+' on its floor or on a raised part of it');assert.ok(r.poly.length>=3,r.id);
  for(const [x,z] of r.poly)assert.ok(x>=min[0]-1&&x<=max[0]+1&&z>=min[2]-1&&z<=max[2]+1,r.id+' inside the building');
  // the outline of the room also holds its raised zones and the stage: its area is what is left of the floor
  const a=area(r.poly);assert.ok(a>1.2,r.id+' area');if(r.id==='l0-salle')assert.ok(r.area>100&&r.area<a,r.id);else assert.ok(Math.abs(a-r.area)<Math.max(.6,r.area*.12),r.id+': '+a.toFixed(1)+' vs '+r.area);}
 for(const id of ['l0-salle','l0-scene','l0-carre-vip','l0-estrade','l0-salon-prive','l0-entree','l0-accueil','l1-mezzanine'])assert.ok(manifest.rooms.some(r=>r.id===id),id);
 for(const id of ['all',...levels])assert.match(html,new RegExp('data-storey="'+id+'"'));
 // the stage is where the model says, at one end of the room
 assert.ok(manifest.stage.wall<manifest.stage.front&&manifest.stage.front<manifest.stage.apron&&manifest.stage.apron<manifest.hall.balcony);
 assert.equal(roomAt('L0',manifest.stage.wall+1.5,manifest.stage.z).kind,'stage');
});
test('the table map: thirty-nine tables in seven categories, each standing on the floor of its zone',()=>{
 assert.equal(manifest.tables.length,39);assert.equal(Object.keys(manifest.tiers).length,7);assert.equal(new Set(manifest.tables.map(t=>t.id)).size,39,'table ids are unique');
 assert.match(html,/id="taken">0\/39</);
 const minimums=Object.values(manifest.tiers).map(t=>t.minimum).sort((a,b)=>a-b);assert.equal(minimums[0],1000);assert.equal(minimums[6],8000);
 for(const [id,t] of Object.entries(manifest.tiers)){assert.ok(t.name.length>2,id);assert.ok(t.guests>=2&&t.guests<=20,id);assert.ok(t.color.length===3&&t.color.every(v=>v>=0&&v<=1),id);assert.ok(manifest.tables.some(q=>q.tier===id),'a table in '+id);}
 for(const t of manifest.tables){
  assert.match(t.id,/^[A-Z0-9 ]{2,6}$/,t.id);assert.ok(manifest.tiers[t.tier],t.id+' category');assert.ok(t.r>.15&&t.r<.6,t.id+' radius');
  const room=roomAt('L0',t.pos[0],t.pos[2]);assert.ok(room,t.id+' in a zone');assert.equal(room.y,t.pos[1],t.id+' on the floor of '+room.id);
  assert.ok(t.seats.length>=2&&t.seats.length<=manifest.tiers[t.tier].guests,t.id+' seats');
  for(const [x,z] of t.seats){const d=Math.hypot(x-t.pos[0],z-t.pos[2]);assert.ok(d>t.r&&d<2.2,t.id+' seat at '+d.toFixed(2)+' m');}
  // the eye of somebody sitting there: at seat height, beside the table, in the room
  assert.ok(Math.abs(t.eye[1]-(t.pos[1]+1.18))<.02,t.id+' eye height');assert.ok(Math.hypot(t.eye[0]-t.pos[0],t.eye[2]-t.pos[2])<1.2,t.id+' eye near');assert.ok(roomAt('L0',t.eye[0],t.eye[2]),t.id+' eye in a zone');}
 for(const b of manifest.booths)assert.ok(b.c.length===2&&b.r>.4&&roomAt('L0',b.c[0],b.c[1]),'booth');
 assert.equal(manifest.signs.length,3);for(const s of manifest.signs)assert.ok(s.width>s.height&&Math.hypot(...s.facing)===1,s.id);
});
test('the equipment of the dashboard stands in the model',()=>{
 assert.ok(manifest.devices.length>=30);const {min,max}=manifest.bounds;
 const types=['terminal','fridge','counter','lock','dj','speaker','screen','projector','camera','thermostat','smoke'];
 for(const d of manifest.devices){assert.ok(types.includes(d.type),d.type);assert.ok(d.label.length>3);assert.ok(levels.includes(d.level));
  assert.ok(d.pos.length===3&&d.pos.every(Number.isFinite)&&d.pos[0]>=min[0]&&d.pos[0]<=max[0]&&d.pos[1]>=0&&d.pos[1]<=max[1],d.label);
  assert.ok(new RegExp('\\b'+d.type+':d=>').test(page),'the page says a state for '+d.type);}
 assert.equal(manifest.devices.filter(d=>d.type==='lock').length,1);
});
test('the page is a draft of the Club space: simulated, not indexed, and it answers the app',()=>{
 assert.match(html,/name="robots" content="noindex"/);assert.doesNotMatch(read('sitemap.xml'),/club3d/);
 assert.match(html,/simulés/);assert.match(html,/aucune demande n’est transmise, rien n’est payé/);assert.match(html,/chiffres indicatifs relevés en ligne, à confirmer auprès du club/);assert.match(html,/Minimum indicatif/);
 assert.match(html,/href="maison3d\.css/);assert.match(html,/href="club3d\.css/);assert.match(html,/src="club3d\.mjs/);
 for(const id of ['view','labels','status','who','back','inside','loading','toast','hint','club-name','active','count','taken','lock-tile','lock-state','sound-tile','sound-state','map-tile','map-state','gear-tile','gear-state','scenes','transport','stop','caption','bar','alert','order-title','order-bar','order-light','order-bill','stage-state','lineup','free','tiers','booking','bk-dot','bk-name','bk-zone','bk-state','bk-min','bk-guests','bk-sit','bk-book','bk-form','bk-who','bk-less','bk-n','bk-more','bk-times','bk-go','bk-done','bk-close','tables','all-on','all-off','list','rooms','rooms-of'])
  assert.match(html,new RegExp('id="'+id+'"'),id);
 for(const scene of ['doors','live','parade']){assert.match(html,new RegExp('data-scene="'+scene+'"'));assert.match(page,new RegExp('\\b'+scene+':\\{steps:'));}
 for(const mode of ['house','evening','show']){assert.match(html,new RegExp('data-mode="'+mode+'"'));assert.match(page,new RegExp('\\b'+mode+':\\{level:'));}
 for(const word of ["tell('ready')","tell('failed')",'messageHandlers?.parks3d',"Q.has('visite')","Q.get('table')","Q.get('fx')"])assert.ok(page.includes(word),word);
 assert.match(page,/classList\.toggle\('in-app'/);assert.match(page,/classList\.toggle\('only-scene'/);
 assert.match(page,/Everything that moves or lights up is simulated/);assert.match(page,/no request is sent to anyone and nothing is paid/);
 for(const name of ['vendor/GLTFLoader.js','vendor/BufferGeometryUtils.js'])assert.match(read(name),/from '\.\/three\.module\.min\.js'/,name);
});
test('a booking stays on the page: nothing is sent, nothing is kept, and the name of the place comes from the model',()=>{
 // the only thing the page asks for is its own model
 assert.deepEqual([...page.matchAll(/\bfetch\(([^)]*)\)/g)].map(m=>m[1]),["'club/club.json'"]);
 assert.doesNotMatch(page,/XMLHttpRequest|sendBeacon|WebSocket|EventSource|localStorage|sessionStorage|indexedDB|document\.cookie/);
 assert.doesNotMatch(html,/<form[^>]*\baction=/);assert.doesNotMatch(html,/type="(email|tel)"/);
 // what a visitor types is shown as text, never as markup
 assert.match(page,/done\.textContent=`Réservation simulée au nom de \$\{t\.booking\.who\}/);
 // the music is made by the page: no recording is loaded
 assert.doesNotMatch(page+html,/<audio|new Audio\(|\.mp3|\.ogg|\.wav|\.m4a/);
 // the name is read from the manifest, so that a neutral build changes it everywhere at once
 assert.ok(manifest.name.length>3);assert.ok(!html.includes(manifest.name)&&!page.includes(manifest.name),'the name is not written in the page');
 assert.match(page,/\$\('club-name'\)\.textContent=info\.name/);assert.match(page,/makeSigns\(info\.signs,info\.name\)/);
});
