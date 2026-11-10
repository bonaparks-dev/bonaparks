import test from 'node:test';
import assert from 'node:assert/strict';
import {presentations,presentationMatrix,fitPresentation} from './studio-presentation.mjs';
test('overview plot boundaries align with screen axes; interior cameras stay native',()=>{
 for(const [floor,v] of Object.entries(presentations)){
  const [a,b,c,d]=presentationMatrix(floor),[ux,uy]=v.across,[vx,vy]=v.down;
  assert.ok(Math.abs(a*d-b*c-1)<1e-12,'area and handedness preserved');
  if(floor==='overview'){
   assert.ok(Math.abs(b*ux+d*uy)<1e-9,'long boundary is horizontal');
   assert.ok(Math.abs(a*vx+c*vy)<1e-9,'side boundary is vertical');
   assert.ok(a*ux+c*uy>0);assert.ok(b*vx+d*vy>0);
  }else assert.deepEqual([a,b,c,d],[1,0,0,1]);
 }
});
test('overview fills desktop and phone landscape frames; narrow frames retain the whole plot',()=>{
 for(const [w,h]of [[890,528],[390,390/1.65],[1190,720]]){
  const v=fitPresentation('overview',1448,1086,w,h);assert.equal(v.fill,true);
  assert.ok(v.bounds.width>=w-.01&&v.bounds.height>=h-.01);
  assert.ok(v.bounds.width<w*1.1&&v.bounds.height<h*1.1);
 }
 for(const floor of Object.keys(presentations))for(const [w,h]of [[790,530],[350,220],[1100,600],[450,950]]){
  const v=fitPresentation(floor,1448,1086,w,h);
  if(!v.fill){assert.ok(v.bounds.width<=w+.01);assert.ok(v.bounds.height<=h+.01);}
  assert.ok(v.width>0&&v.height>0);
 }
});
