import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const at=name=>new URL('./'+name,import.meta.url),read=name=>fs.readFileSync(at(name),'utf8');
const manifest=JSON.parse(read('penthouse/penthouse.json')),page=read('penthouse3d.mjs'),html=read('penthouse3d.html');
const file=fs.readFileSync(at('penthouse/'+manifest.model));
const gltf=JSON.parse(file.subarray(20,20+file.readUInt32LE(12)).toString('utf8'));
const levels=['L0','L1','L2','L3'],zoneIds=[...page.match(/const zoneList=\[(.*?)\];/s)[1].matchAll(/\{id:'([^']+)'/g)].map(m=>m[1]);
const area=poly=>Math.abs(poly.reduce((s,p,i)=>{const q=poly[(i+1)%poly.length];return s+p[0]*q[1]-q[0]*p[1];},0))/2;

test('the penthouse model is one binary glTF file of a size a phone can load',()=>{
 assert.equal(file.subarray(0,4).toString('latin1'),'glTF');assert.equal(file.readUInt32LE(4),2);assert.equal(file.readUInt32LE(8),file.length);
 assert.ok(file.length<8*1048576,'model under 8 MiB: '+file.length);assert.equal(manifest.stats.bytes,file.length);
 assert.ok(manifest.stats.triangles<200000,'triangles: '+manifest.stats.triangles);assert.ok(manifest.stats.samples>=1024,'light baked at full quality: '+manifest.stats.samples);
 for(const name of gltf.extensionsRequired)assert.ok(['KHR_mesh_quantization','EXT_texture_webp'].includes(name),name);
});
test('every surface carries its baked light: the lamps, the day, the shares of the zones, the open sky',()=>{
 assert.ok(gltf.meshes.length>100);
 for(const mesh of gltf.meshes)for(const p of mesh.primitives){const n=gltf.accessors[p.attributes.POSITION].count;
  for(const key of ['_LA','_LB','_LC','_LD']){const a=gltf.accessors[p.attributes[key]];assert.ok(a,mesh.name+' '+key);
   assert.equal(a.type,'VEC4');assert.equal(a.componentType,5121);assert.equal(a.normalized,true);assert.equal(a.count,n);}}
 for(const key of ['_LA','_LB','_LC','_LD'])assert.ok(page.includes('attribute vec4 '+key.toLowerCase()),'read by the page: '+key);
 assert.ok(manifest.light.lamp>0&&manifest.light.day>0&&manifest.light.open>0);
 for(const node of gltf.nodes){assert.ok([...levels,'T'].includes(node.extras.level),node.name);assert.ok(['main','ceiling'].includes(node.extras.layer),node.name);}
});
test('the lighting zones of the dashboard are those of the model, in the same order',()=>{
 assert.deepEqual(zoneIds,manifest.light.order);assert.deepEqual(Object.keys(manifest.zones),manifest.light.order);
 assert.match(html,new RegExp('id="count">0/'+zoneIds.length+'<'));
 for(const [id,z] of Object.entries(manifest.zones)){assert.ok(z.lamps.length>0,'lamps in '+id);for(const l of z.lamps)assert.ok(l.length===4&&l.every(Number.isFinite),id);}
});
test('storeys and rooms: each room is an outline on the floor of its storey, large enough to stand in',()=>{
 assert.deepEqual(manifest.levels.map(l=>l.id),levels);
 for(let i=1;i<4;i++)assert.ok(manifest.levels[i].y>manifest.levels[i-1].y+2,'storeys go up');
 assert.ok(manifest.rooms.length>=20);assert.equal(new Set(manifest.rooms.map(r=>r.id)).size,manifest.rooms.length,'room ids are unique');
 const {min,max}=manifest.bounds;
 for(const r of manifest.rooms){
  assert.ok(levels.includes(r.level),r.id);assert.ok(r.id.startsWith(r.level.toLowerCase()+'-'),r.id);assert.ok(zoneIds.includes(r.zone),r.id+' zone');
  assert.equal(r.y,manifest.levels.find(l=>l.id===r.level).y,r.id+' on its floor');assert.ok(r.poly.length>=3,r.id);
  for(const [x,z] of r.poly)assert.ok(x>=min[0]-1&&x<=max[0]+1&&z>=min[2]-1&&z<=max[2]+1,r.id+' inside the building');
  const a=area(r.poly);assert.ok(a>1.2,r.id+' area');assert.ok(Math.abs(a-r.area)<Math.max(.6,r.area*.12),r.id+': '+a.toFixed(1)+' vs '+r.area);}
 for(const id of ['l1-grand-salon','l1-sejour-et-salle-a-manger','l0-suite-parentale','l2-bureau-et-palier','l2-terrasse','l3-toit-terrasse'])assert.ok(manifest.rooms.some(r=>r.id===id),id);
 for(const id of ['all',...levels])assert.match(html,new RegExp('data-storey="'+id+'"'));
});
test('the equipment of the dashboard stands in the model',()=>{
 assert.ok(manifest.devices.length>=10);
 for(const d of manifest.devices){assert.ok(['lock','tv','thermostat','camera'].includes(d.type),d.type);assert.ok(d.label.length>3);assert.ok(levels.includes(d.level));assert.ok(d.pos.length===3&&d.pos.every(Number.isFinite));}
 assert.equal(manifest.devices.filter(d=>d.type==='lock').length,1);
});
test('the page is a draft of the Residence space: simulated, not indexed, and it answers the app',()=>{
 assert.match(html,/name="robots" content="noindex"/);assert.doesNotMatch(read('sitemap.xml'),/penthouse3d/);
 assert.match(html,/simulés/);assert.match(html,/décor générique/);assert.match(html,/href="maison3d\.css/);assert.match(html,/href="penthouse3d\.css/);assert.match(html,/src="penthouse3d\.mjs/);
 for(const id of ['view','labels','status','who','back','inside','loading','toast','hint','count','active','lock-tile','lock-state','gear-tile','gear-state','temp','scenes','transport','stop','caption','bar','alert','clim-state','clim-power','clim-less','clim-set','clim-more','all-on','all-off','list','rooms','rooms-of'])assert.match(html,new RegExp('id="'+id+'"'),id);
 for(const scene of ['arrival','goodnight','intrusion']){assert.match(html,new RegExp('data-scene="'+scene+'"'));assert.match(page,new RegExp('\\b'+scene+':\\{steps:'));}
 for(const mode of ['day','evening','night'])assert.match(html,new RegExp('data-mode="'+mode+'"'));
 for(const word of ["tell('ready')","tell('failed')",'messageHandlers?.parks3d',"q.has('visite')"])assert.ok(page.includes(word),word);
 assert.match(page,/classList\.toggle\('in-app'/);assert.match(page,/classList\.toggle\('only-scene'/);
 assert.match(page,/Everything that moves or lights up is simulated/);assert.match(page,/not the real panorama/);
 for(const name of ['vendor/GLTFLoader.js','vendor/BufferGeometryUtils.js'])assert.match(read(name),/from '\.\/three\.module\.min\.js'/,name);
});
