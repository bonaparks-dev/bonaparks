import test from 'node:test';
import assert from 'node:assert/strict';
import {presentations,presentationMatrix,fitPresentation} from './studio-presentation.mjs';
test('native perspective preserves distances, upright walls and ground-plane angles',()=>{
 for(const [floor,v] of Object.entries(presentations)){
  const [a,b,c,d]=presentationMatrix(floor),[ux,uy]=v.across,[vx,vy]=v.down;
  // A vertical post must stay vertical; a ground-plane rectification fails it.
  assert.equal(c,0,floor+' upright post');assert.equal(b,0,floor+' no raster rotation');assert.ok(Math.abs(a*d-b*c-1)<1e-12);
  const across=Math.hypot(a*ux+c*uy,b*ux+d*uy)/Math.hypot(ux,uy),depth=Math.hypot(a*vx+c*vy,b*vx+d*vy)/Math.hypot(vx,vy);
  assert.ok(Math.abs(across-depth)<1e-12,floor+' axis proportions');assert.ok(across>.95&&across<1.05,floor+' bounded correction');
  for(const [x,y] of [[0,90],[120,0],[23,-78],v.across,v.down])assert.ok(Math.abs(Math.hypot(a*x+c*y,b*x+d*y)-Math.hypot(x,y))<1e-9,floor+' undistorted geometry');
  assert.ok(a*ux+c*uy>0);assert.ok(b*vx+d*vy>0);assert.ok(a*d-b*c>0);
 }
});
test('all three scenes fit wide and narrow frames without cropping their visible outline',()=>{
 for(const floor of Object.keys(presentations))for(const [w,h]of [[790,530],[350,220],[1100,600]]){
  const view=fitPresentation(floor,1448,1086,w,h);assert.ok(view.bounds.width<=w-31.99);assert.ok(view.bounds.height<=h-31.99);assert.ok(view.width>0&&view.height>0);
 }
});
