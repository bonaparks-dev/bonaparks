import {presentationBounds,presentationMatrix} from './studio-presentation.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {initialHome,restoreHome,applyScene,tickGate,dueRoutines,validRoutine,lights,changeTV,lightingForFloor,setFloorLights} from './studio-home-model.mjs';
import {mapMarkup,mapPoints} from './studio-home-map.mjs';
import {spacesForFloor,spaceCamera,clampHouseZoom} from './studio-home-spaces.mjs';

test('floor lighting commands only affect the displayed level',()=>{
 const h=applyScene(initialHome(),'off'),up=setFloorLights(h,'etage',true);
 assert.equal(lightingForFloor('etage').length,7);
 assert.ok(lights.every(l=>up.lights[l.id].on===(l.zone==='etage'||l.id==='stairs')));
 assert.equal(setFloorLights(up,'etage',false).lights.stairs.on,false);
 assert.ok(Object.values(h.lights).every(l=>!l.on));
 const outside=setFloorLights(up,'outside',true),down=setFloorLights(outside,'rdc',false);
 assert.equal(down.lights.master.on,true);assert.equal(down.lights.pool.on,true);assert.equal(down.lights.patio.on,false);
 assert.ok(Object.values(setFloorLights(down,'overview',false).lights).every(l=>!l.on));
});

test('TV remotes clamp inputs, keep each device independent and persist valid settings',()=>{
 const h=initialHome();h.tv.living=changeTV(h.tv.living,'power');h.tv.living=changeTV(h.tv.living,'volume',48);h.tv.living=changeTV(h.tv.living,'channel',24);h.tv.living=changeTV(h.tv.living,'next');h.tv.living=changeTV(h.tv.living,'mute');
 assert.deepEqual(h.tv.children,{on:false,volume:25,muted:false,channel:1,source:'tv'});
 assert.equal(h.tv.living.channel,25);assert.equal(h.tv.living.muted,true);assert.deepEqual(restoreHome(h).tv,h.tv);
 assert.equal(changeTV(h.tv.living,'volume',500).volume,100);assert.equal(changeTV(h.tv.living,'channel',-5).channel,1);assert.equal(changeTV({...h.tv.living,channel:999},'next').channel,999);
 assert.equal(changeTV(h.tv.living,'source','hdmi2').source,'hdmi2');assert.equal(changeTV(h.tv.living,'source','constructor').source,'tv');assert.equal(changeTV(h.tv.living,'channel',NaN).channel,25);
 assert.equal(applyScene(h,'night').tv.living.on,false);assert.equal(applyScene(h,'off').tv.living.on,false);
 const old=initialHome();delete old.tv;assert.deepEqual(restoreHome(old).tv,initialHome().tv);
 const corrupt=restoreHome({...h,tv:{living:{on:'yes',source:'<script>',volume:Infinity,channel:0}}});assert.equal(corrupt.tv.living.on,false);assert.equal(corrupt.tv.living.source,'tv');assert.equal(corrupt.tv.living.volume,25);assert.equal(corrupt.tv.living.channel,1);
});

test('house zoom never shrinks below the complete view',()=>{
 assert.equal(clampHouseZoom(.4),1);assert.equal(clampHouseZoom(-10),1);assert.equal(clampHouseZoom(999),3.4);assert.equal(clampHouseZoom(2),2);assert.equal(clampHouseZoom(NaN),1);
});

test('four patio speakers and independent pool, spa light and spa motor',()=>{
 const h=initialHome();assert.equal(h.music.speakers.length,4);h.spa.jets=true;h.lights.spa.on=false;h.lights.pool.on=true;
 const restored=restoreHome(h);assert.equal(restored.spa.jets,true);assert.equal(restored.lights.spa.on,false);assert.equal(restored.lights.pool.on,true);
});
test('scenes update coordinated devices without changing input or unrelated climate state',()=>{
 const h=initialHome();h.climate.etage.on=true;h.climate.etage.temperature=19;
 const t=applyScene(h,'terrace');assert.equal(h.music.playing,false);assert.equal(t.music.playing,true);assert.equal(t.lights.patio.brightness,75);assert.deepEqual(t.music.speakers,[true,true,true,true]);assert.equal(t.climate.etage.temperature,19);
 const b=applyScene(t,'swim');assert.equal(b.lights.pool.on,true);assert.equal(b.lights.spa.on,true);assert.equal(b.spa.jets,true);assert.equal(b.pool.pump,true);assert.equal(applyScene(b,'night').pool.pump,false);assert.equal(applyScene(b,'off').pool.pump,false);
 const c=applyScene(h,'comfort');assert.deepEqual(c.climate.rdc,c.climate.etage);assert.equal(c.climate.rdc.temperature,23);
 const off=applyScene(c,'off');assert.ok(Object.values(off.lights).every(x=>!x.on));assert.ok(Object.values(off.climate).every(x=>!x.on));assert.equal(off.gate.target,0);assert.equal(off.spa.jets,false);assert.equal(off.music.playing,false);
});
test('gate can open, stop halfway, reverse, and cannot exceed bounds',()=>{
 let g={position:0,target:1};for(let i=0;i<8;i++)g=tickGate(g,.25);assert.equal(g.position,.5);
 g.target=g.position;assert.equal(tickGate(g,.5).position,.5);
 g.target=0;for(let i=0;i<20;i++)g=tickGate(g,.25);assert.deepEqual(g,{position:0,target:0});
 g.target=1;for(let i=0;i<30;i++)g=tickGate(g,.25);assert.equal(g.position,1);
});
test('reload keeps settings but never autoplays music or resumes gate movement',()=>{
 const h=initialHome();h.gate={position:.42,target:1};h.music.playing=true;h.music.volume=51;h.music.speakers=[true,false,true,false];
 const r=restoreHome(h);assert.deepEqual(r.gate,{position:.42,target:.42});assert.equal(r.music.playing,false);assert.equal(r.music.volume,51);assert.deepEqual(r.music.speakers,[true,false,true,false]);
});
test('corrupt saved values cannot inject markup or invalid device ranges',()=>{
 const r=restoreHome({version:1,lights:{pool:{on:true,brightness:999,color:'"/><script>alert(1)</script>'}},music:{volume:-5,speakers:[true]},climate:{rdc:{on:true,temperature:999,mode:'fake'}},gate:{position:-2},routines:[{id:'bad'}]});
 assert.equal(r.lights.pool.brightness,100);assert.equal(r.lights.pool.color,'#55e5ff');assert.equal(r.music.volume,0);assert.equal(r.music.speakers.length,4);assert.equal(r.climate.rdc.temperature,30);assert.equal(r.climate.rdc.mode,'cool');assert.equal(r.gate.position,0);assert.deepEqual(r.routines,[]);
});
test('routine triggers at local time on chosen days once per date with no catchup',()=>{
 const h=initialHome();h.routines=[{id:'test',name:'Terrasse',time:'20:00',days:[2],scene:'terrace',enabled:true,lastRun:''}];
 const t=new Date(2026,10,10,20,0);assert.equal(t.getDay(),2);assert.equal(validRoutine(h.routines[0]),true);
 const due=dueRoutines(h,t);assert.equal(due.length,1);h.routines[0].lastRun=due[0].day;assert.equal(dueRoutines(h,t).length,0);
 h.routines[0].lastRun='';assert.equal(dueRoutines(h,new Date(2026,10,10,20,1)).length,0);assert.equal(dueRoutines(h,new Date(2026,10,11,20,0)).length,0);
 h.routines[0].enabled=false;assert.equal(dueRoutines(h,t).length,0);assert.equal(validRoutine({...h.routines[0],days:[]}),false);assert.equal(validRoutine({...h.routines[0],time:'25:60'}),false);
});
test('every lighting circuit has a floor hotspot and all effects follow state',()=>{
 for(const l of lights)assert.ok(Object.values(mapPoints).some(p=>p[l.id]),l.id);
 const h=initialHome();h.music.playing=true;h.spa.jets=true;h.climate.rdc.on=true;
 const html=mapMarkup(h,'overview',lights,null);assert.equal((html.match(/map-speaker is-playing/g)||[]).length,4);assert.ok(!html.includes('pool-contour'));assert.ok(!html.includes('spa-contour'));assert.ok(html.includes('ac-unit running'));
 const off=mapMarkup(applyScene(h,'off'),'overview',lights,null);assert.ok(!off.includes('ac-unit running'));assert.ok(!off.includes('map-speaker is-playing'));assert.ok(off.includes('sound-ring'));assert.ok(!off.includes('home-pin'));assert.ok(off.includes('data-home-direct="gate"'));
});

test('all four water circuits restore independently in every combination',()=>{
 for(let mask=0;mask<16;mask++){
  const h=initialHome();const expected=[0,1,2,3].map(bit=>!!(mask&(1<<bit)));
  [h.pool.pump,h.spa.jets,h.lights.pool.on,h.lights.spa.on]=expected;
  const r=restoreHome(h);assert.deepEqual([r.pool.pump,r.spa.jets,r.lights.pool.on,r.lights.spa.on],expected);
 }
});
test('old saved homes preserve devices and gain safe pump and demo humidity defaults',()=>{
 const old=initialHome();delete old.pool;delete old.humidity;old.spa.jets=true;
 const r=restoreHome(old);assert.equal(r.pool.pump,false);assert.equal(r.spa.jets,true);assert.deepEqual(r.humidity,{'bath-down':58,'bath-up':64});
 const invalid=restoreHome({...old,humidity:{'bath-down':-40,'bath-up':130}});assert.deepEqual(invalid.humidity,{'bath-down':0,'bath-up':100});
});
test('space cameras center each selected room on desktop and mobile',()=>{
 for(const floor of ['overview','rdc','etage']){
  assert.ok(spacesForFloor(floor).length>0);
  for(const size of [[800,600,900,600],[300,280,360,400]])for(const room of spacesForFloor(floor)){
   const [w,h,hw,hh]=size,c=spaceCamera(floor,room.id,w,h,hw,hh),p=mapPoints[floor][room.id];
   const [a,b,cc,d]=presentationMatrix(floor),bounds=presentationBounds(floor,w,h),x=(p[0]/1000-.5)*w,y=(p[1]/1000-.5)*h;
   assert.ok(c.zoom>=1&&c.zoom<=3.4);assert.ok(Math.abs(c.x+(a*x+cc*y-(bounds.left+bounds.right)/2)*c.zoom)<.00001);assert.ok(Math.abs(c.y+(b*x+d*y-(bounds.top+bounds.bottom)/2)*c.zoom)<.00001);
  }
 }
 assert.deepEqual(spaceCamera('overview','all',800,600,900,600),{x:0,y:0,zoom:1});
 assert.deepEqual(spaceCamera('etage','pool',600,600,800,600),{x:0,y:0,zoom:1});
});
