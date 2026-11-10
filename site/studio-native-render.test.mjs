import test from 'node:test';
import assert from 'node:assert/strict';
import {nativeOverview,overviewPoint,legacyPoint} from './studio-overview-projection.mjs';
import {presentationMatrix} from './studio-presentation.mjs';
import {tvSurfaces,televisionMarkup,televisionFloor} from './studio-tv-surfaces.mjs';
import {initialHome,lights} from './studio-home-model.mjs';
import {mapMarkup} from './studio-home-map.mjs';
import {demoCommand} from './studio-demo-controls.mjs';
import {waterSurfaces,poolPath,spaPath} from './studio-water-surfaces.mjs';
test('native house and terrain are rectangular without shearing any architectural image',()=>{
 for(const floor of ['overview','rdc','etage'])assert.deepEqual(presentationMatrix(floor),[1,0,0,1]);
 for(const corners of [nativeOverview.plot,nativeOverview.houseCorners,nativeOverview.rearPassage]){
  assert.ok(Math.abs(corners[0][1]-corners[1][1])<.001);
  assert.ok(Math.abs(corners[1][0]-corners[2][0])<.001);
  assert.ok(Math.abs(corners[2][1]-corners[3][1])<.001);
  assert.ok(Math.abs(corners[3][0]-corners[0][0])<.001);
 }
 assert.ok(nativeOverview.rearPassage[2][1]<nativeOverview.houseCorners[0][1]-35,'concrete path exists behind the rear facade');
});
test('interaction projection round-trips and the TV corners match the native camera',()=>{
 for(const p of [[0,0],[1000,1000],[672,821],[272,123],[500,500]]){
  const q=legacyPoint(...overviewPoint(...p));assert.ok(Math.hypot(q[0]-p[0],q[1]-p[1])<1e-9);
 }
 tvSurfaces.overview.living.forEach((p,i)=>{const q=overviewPoint(...p),expected=nativeOverview.tv.living[i];assert.ok(Math.hypot(q[0]-expected[0],q[1]-expected[1])<1e-9);});
});

test('animated water clips follow the rendered basin silhouettes without spilling over coping',()=>{
 for(const [id,path]of [['pool',poolPath],['spa',spaPath]]){
  const points=path.slice(1,-1).split('L').map(p=>p.split(' ').map(Number));
  assert.equal(points.length,waterSurfaces[id].length);
  assert.ok(points.length>=64,'use the curved physical mesh rather than a rough polygon');
  points.forEach((p,i)=>{const q=overviewPoint(...p),expected=waterSurfaces[id][i];assert.ok(Math.hypot(q[0]-expected[0],q[1]-expected[1])<.00002);});
 }
});
test('each visible TV powers on and off on its actual floor and survives view changes',()=>{
 for(const [floor,id]of [['overview','living'],['rdc','living'],['etage','children']]){
  let s=initialHome();s.tv[id].on=false;
  assert.ok(televisionMarkup(s,floor).includes('data-power="off" opacity="0"'));
  s=demoCommand(s,floor,'tv',id).state;
  assert.ok(mapMarkup(s,floor,lights,null).includes('data-tv-screen="'+id+'" data-power="on" opacity="1"'));
  for(const other of ['overview','rdc','etage'])mapMarkup(s,other,lights,null);
  assert.equal(s.tv[id].on,true);
  s=demoCommand(s,floor,'tv',id).state;assert.equal(s.tv[id].on,false);
 }
 assert.equal(televisionFloor('children','overview'),'etage');assert.equal(televisionFloor('children','rdc'),'etage');
 assert.equal(televisionFloor('living','overview'),'overview');assert.equal(televisionFloor('living','etage'),'rdc');
 assert.equal(televisionFloor('children','rdc',false),'rdc');
});
