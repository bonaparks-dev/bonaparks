import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const at=name=>new URL('./'+name,import.meta.url),read=name=>fs.readFileSync(at(name),'utf8');
const manifest=JSON.parse(read('business/rooftop.json')),page=read('business3d.mjs'),html=read('business3d.html');
const list=key=>[...page.matchAll(new RegExp(key+":\\[([^\\]]*)\\]",'g'))].flatMap(m=>[...m[1].matchAll(/'([^']+)'/g)].map(k=>k[1]));

test('the rooftop model is one binary glTF file of a size a phone can load',()=>{
 const file=fs.readFileSync(at('business/'+manifest.model));
 assert.equal(file.subarray(0,4).toString('latin1'),'glTF');assert.equal(file.readUInt32LE(4),2);assert.equal(file.readUInt32LE(8),file.length);
 assert.ok(file.length<8*1048576,'model under 8 MiB: '+file.length);assert.equal(manifest.stats.bytes,file.length);
 assert.ok(manifest.stats.triangles<160000,'triangles: '+manifest.stats.triangles);
});
test('every area of the rooftop is a rectangle of the floor, and the page knows them all',()=>{
 const ids=Object.keys(manifest.zones);assert.deepEqual(ids.sort(),['bar','entrance','lounge','stage','sunset','terrace','vip']);
 for(const [id,z] of Object.entries(manifest.zones)){assert.ok(z.name.length>2,id);const [a,b,c,d]=z.rect;assert.ok(a<c&&b<d,id+' rectangle');}
 const order=page.match(/zoneOrder=\[([^\]]+)\]/)[1].match(/'([^']+)'/g).map(s=>s.slice(1,-1));assert.deepEqual([...order].sort(),ids.sort());
 // a point of the hall belongs to the entrance, a point in front of the bar to the bar
 const inside=(id,x,z)=>{const r=manifest.zones[id].rect;return x>=r[0]&&x<=r[2]&&z>=r[1]&&z<=r[3];};
 assert.ok(inside('entrance',0,2));assert.ok(inside('bar',-10.7,9));assert.ok(inside('vip',-20,13.5));assert.ok(!inside('entrance',-10,9));
});
test('each light circuit of the dashboard switches surfaces and bulbs that exist in the model',()=>{
 const lit=list('mats'),glows=list('glow');assert.ok(lit.length>=10);
 for(const name of lit)assert.ok(manifest.materials.includes(name),'material in the model: '+name);
 for(const key of glows)assert.ok(manifest.circuits[key]?.points.length>0,'bulbs in the manifest: '+key);
 for(const name of manifest.materials.filter(n=>n.startsWith('Light ')))assert.ok(lit.includes(name),'switched by a circuit: '+name);
 assert.equal((page.match(/\{id:'/g)||[]).length,8);assert.match(html,/id="count">0\/8</);
 for(const p of Object.values(manifest.circuits).flatMap(c=>c.points))assert.ok(p.length===3&&p.every(Number.isFinite));
});
test('the page is a draft of the Business space: simulated, not indexed, and it answers the app',()=>{
 assert.match(html,/name="robots" content="noindex"/);assert.doesNotMatch(read('sitemap.xml'),/business3d/);
 assert.match(html,/simulés/);assert.match(html,/href="maison3d\.css/);assert.match(html,/src="business3d\.mjs/);
 for(const id of ['view','labels','status','who','back','loading','toast','hint','count','active','door-tile','door-state','sail-tile','sail-state','temp','scenes','transport','stop','caption','bar','alert','music-state','music-power','music-less','music-set','music-more','all-on','all-off','list'])assert.match(html,new RegExp('id="'+id+'"'),id);
 for(const scene of ['opening','closing','intrusion']){assert.match(html,new RegExp('data-scene="'+scene+'"'));assert.match(page,new RegExp('\\b'+scene+':\\{steps:'));}
 for(const word of ["tell('ready')","tell('failed')",'messageHandlers?.parks3d'])assert.ok(page.includes(word),word);
 assert.match(page,/classList\.toggle\('in-app'/);assert.match(page,/classList\.toggle\('only-scene'/);
 for(const file of ['vendor/GLTFLoader.js','vendor/BufferGeometryUtils.js'])assert.match(read(file),/from '\.\/three\.module\.min\.js'/,file);
});
