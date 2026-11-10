import test from 'node:test';
import assert from 'node:assert/strict';
import {initialSpatial,restoreSpatial,validMember,memberPosition,scenarios,sampleTrack,trailAt,eventsAt,videoToScene,sceneToVideo,advancePlayback} from './studio-spatial-model.mjs';

test('family profiles round-trip without restoring an active alarm or real tracking',()=>{
 const s=initialSpatial();assert.equal(s.members.length,4);assert.deepEqual(restoreSpatial(s),s);assert.ok(s.members.every(validMember));assert.equal(s.members.filter(m=>m.kind==='child').length,1);assert.ok(!('playing' in s));
 s.members[0].name='Alex <3';s.members[0].zone='blue';s.visible=false;const r=restoreSpatial(s);assert.equal(r.members[0].name,'Alex <3');assert.equal(r.members[0].zone,'blue');assert.equal(r.visible,false);
});
test('malformed profiles, duplicate IDs and prototype types are rejected',()=>{
 const s=initialSpatial(),m=s.members[0];s.members.push({...m},{...m,id:'bad-id',kind:'constructor'},{...m,id:'<script>'},{...m,id:'bad-color',color:'url(attack)'},{...m,id:'bad-zone',zone:'roof'},{...m,id:'bad-name',name:' '});
 assert.equal(restoreSpatial(s).members.length,4);assert.deepEqual(restoreSpatial({...s,members:[]}).members,[]);assert.deepEqual(restoreSpatial(null),initialSpatial());
});
test('avatars stay on their assigned level and inside a small authored room path',()=>{
 const m=initialSpatial().members[0];assert.equal(memberPosition(m,'etage'),null);const still=memberPosition(m,'overview',0,false);
 assert.deepEqual(memberPosition(m,'overview',999,false),still);
 for(let t=0;t<300;t++){const p=memberPosition(m,'overview',t,true);assert.ok(Math.abs(p.x-still.x)<=6);assert.ok(Math.abs(p.y-still.y)<=2.7);assert.ok(Number.isFinite(p.heading));}
 const upstairs={...m,zone:'blue'};assert.ok(memberPosition(upstairs,'etage'));assert.equal(memberPosition(upstairs,'overview'),null);
});
test('replay interpolates between waypoints, clamps endpoints and stops at the end',()=>{
 const track=scenarios.intrusion.track;assert.equal(sampleTrack(track,-1).x,track[0][1]);assert.equal(sampleTrack(track,999).x,track.at(-1)[1]);assert.equal(sampleTrack(track,999).moving,false);
 const p=sampleTrack(track,3);assert.equal(p.x,(track[0][1]+track[1][1])/2);assert.equal(p.y,(track[0][2]+track[1][2])/2);
 const trail=trailAt(track,8);assert.equal(trail.length,3);assert.deepEqual(trail.at(-1),[sampleTrack(track,8).x,sampleTrack(track,8).y]);
 assert.equal(advancePlayback(39.9,.1,2,40),40);assert.equal(advancePlayback(0,20,1,40),.15);
});

test('family movement is subdued in the full view while the security replay remains spatial',()=>{
 const m=initialSpatial().members[0],origin=memberPosition(m,'overview',0,false);
 for(let t=0;t<300;t++){const far=memberPosition(m,'overview',t,true,1),near=memberPosition(m,'overview',t,true,2.6);assert.equal(far.moving,false);assert.ok(Math.abs(far.x-origin.x)<=.45);assert.ok(Math.abs(far.x-origin.x)<=Math.abs(near.x-origin.x)+1e-8);}
 assert.ok(Math.abs(sampleTrack(scenarios.intrusion.track,25).x-sampleTrack(scenarios.intrusion.track,0).x)>100);
});
test('alerts follow timeline thresholds and rewind removes future events',()=>{
 assert.equal(eventsAt('intrusion',5.9).length,0);assert.equal(eventsAt('intrusion',6).length,1);assert.equal(eventsAt('intrusion',40).length,3);assert.equal(eventsAt('intrusion',0).length,0);
 assert.equal(eventsAt('pool',18).at(-1).id,'pool-zone');assert.equal(eventsAt('pool',17.9).at(-1).id,'approach');
});
test('video and spatial timelines stay proportional for clips of different lengths',()=>{
 for(const duration of [3,24,120])for(const t of [0,5,20,40])assert.ok(Math.abs(videoToScene(sceneToVideo(t,duration,40),duration,40)-t)<1e-8);
 assert.equal(videoToScene(10,0,40),0);assert.equal(videoToScene(200,100,40),40);assert.equal(sceneToVideo(-10,100,40),0);
});
