import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=name=>fs.readFileSync(new URL('./'+name,import.meta.url),'utf8');
test('the homepage keeps public controls and moves explanations to a linked page',()=>{
 const html=read('index.html');assert.match(html,/<h1>Ma maison<\/h1>/);assert.match(html,/href="comment-ca-marche.html"/);
 for(const id of ['demo-modes','demo-inventory','demo-access-note','demo-screen','demo-scenarios','demo-equipment'])assert.match(html,new RegExp('id="'+id+'"'));
 assert.doesNotMatch(html,/class="(?:closing|experience|demo-intro)/);assert.doesNotMatch(html,/Su Pranu/);
 assert.match(read('comment-ca-marche.html'),/Personnages|simulés/);
});
test('indexable pages have unique titles, descriptions and canonical URLs; private pages are excluded',()=>{
 const sitemap=read('sitemap.xml');assert.doesNotMatch(sitemap,/studio|compte|demo.html/);
 const titles=new Set();for(const [,url] of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)){
  const path=new URL(url).pathname.slice(1);const html=read(path?path+'.html':'index.html');
  assert.ok(html.includes('<link rel="canonical" href="'+url+'">'),url);
  const title=html.match(/<title>([^<]+)<\/title>/)?.[1];assert.ok(title&&!titles.has(title),url);titles.add(title);
  assert.match(html,/<meta name="description" content="[^\"]{35,}"/);assert.doesNotMatch(html,/name="robots" content="noindex/);
 }
 for(const page of ['compte','studio','404'])assert.match(read(page+'.html'),/name="robots" content="noindex/);
 const data=JSON.parse(read('index.html').match(/<script type="application\/ld\+json">([^<]+)<\/script>/)[1]);assert.equal(data['@graph'][0].name,'Parks 3D');
});
