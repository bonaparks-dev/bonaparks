// Canvas water stays clipped to the approved pool silhouettes.
export const poolPath='M614 763 Q616 746 630 751 L749 799 Q762 804 757 819 L737 876 Q734 888 720 882 L605 841 Q589 836 596 819 Q576 807 584 789 Q594 774 614 779Z';
export const spaPath='M674 728 687 726 699 732 704 742 699 754 687 763 672 759 667 748Z';
export const waterLevels=s=>[s.lights.pool.on?s.lights.pool.brightness/100:0,s.lights.spa.on?s.lights.spa.brightness/100:0,s.pool.pump?1:0,s.spa.jets?s.spa.intensity/100:0];
export class WaterRenderer{
 constructor(stage){this.canvas=document.createElement('canvas');this.canvas.className='home-water-canvas';this.canvas.setAttribute('aria-hidden','true');stage.insertBefore(this.canvas,stage.querySelector('#home-layer'));this.ctx=this.canvas.getContext('2d');this.paths=[new Path2D(poolPath),new Path2D(spaPath)];this.level=[0,0,0,0];this.clock=0;this.previous=0;}
 draw(now,state,floor,animate){this.canvas.hidden=floor!=='overview';if(floor!=='overview'||!this.ctx)return;const dt=Math.min(.1,Math.max(0,now-this.previous));this.previous=now;if(animate)this.clock+=dt;const w=Math.round(this.canvas.clientWidth*Math.min(devicePixelRatio,2)),h=Math.round(this.canvas.clientHeight*Math.min(devicePixelRatio,2));if(!w||!h)return;if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;}const c=this.ctx;c.setTransform(w/1000,0,0,h/1000,0,0);c.clearRect(0,0,1000,1000);
  const settle=Math.max(1/60,dt);waterLevels(state).forEach((v,i)=>this.level[i]+=(v-this.level[i])*(1-Math.exp(-settle*4)));
  for(let basin=0;basin<2;basin++){const small=basin===1,light=this.level[basin],flow=this.level[basin+2],path=this.paths[basin],t=this.clock,x=small?665:577,y=small?726:746,width=small?42:185,height=small?40:145;c.save();c.clip(path);
   const depth=c.createLinearGradient(x,y,x+width*.55,y+height);depth.addColorStop(0,`rgba(10,72,105,${state.night?.78:.35})`);depth.addColorStop(.5,`rgba(15,139,177,${.12+light*.2})`);depth.addColorStop(1,`rgba(6,53,89,${state.night?.7:.3})`);c.fillStyle=depth;c.fillRect(x,y,width,height);
   const color=state.lights[small?'spa':'pool'].color,rgb=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)).join(',');const glow=c.createRadialGradient(x+width*.65,y+height*.25,0,x+width*.5,y+height*.5,width*.8);glow.addColorStop(0,`rgba(${rgb},${light*.65})`);glow.addColorStop(.5,`rgba(${rgb},${light*.3})`);glow.addColorStop(1,`rgba(${rgb},0)`);c.fillStyle=glow;c.fillRect(x,y,width,height);
   // Intersecting curved caustics: fine light refraction, no large circles.
   c.lineWidth=small?.35:.55;for(let family=0;family<2;family++){for(let row=0;row<(small?9:21);row++){c.beginPath();for(let j=0;j<=32;j++){const u=j/32,px=x+u*width,py=y+row*(small?5:8)-12+Math.sin(u*15+row*1.7+t*(.7+flow*.6))*2.4+Math.cos(u*22-row+t*.43)*1.4+(family?u*height*.7:-u*height*.15);j?c.lineTo(px,py):c.moveTo(px,py);}c.strokeStyle=`rgba(210,252,255,${(.07+light*.16+flow*.08)*(family?.65:1)})`;c.stroke();}}
   if(flow>.01){for(let i=0;i<(small?45:23);i++){const p=(t*(small?.22:.09)+i*.173)%1,px=x+width*(.12+((i*37)%79)/100)+Math.sin(p*6+i)*1.4,py=y+height*(1-p),radius=small?.4+Math.sin(p*Math.PI)*1.0:.4;c.beginPath();c.ellipse(px,py,radius,radius*.7,0,0,Math.PI*2);c.strokeStyle=`rgba(225,255,255,${Math.sin(p*Math.PI)*flow*(small?.8:.42)})`;c.lineWidth=.6;c.stroke();}}
   // Low underwater luminaires, following each pool's inside wall.
   if(light>.01){for(const [lx,ly] of small?[[676,735],[697,750]]:[[633,760],[683,781],[733,802]]){const g=c.createRadialGradient(lx,ly,0,lx,ly,small?8:22);g.addColorStop(0,`rgba(211,255,255,${light*.8})`);g.addColorStop(1,'rgba(50,206,247,0)');c.fillStyle=g;c.fillRect(lx-23,ly-23,46,46);c.fillStyle=`rgba(235,255,255,${light})`;c.fillRect(lx-1.8,ly-.6,3.6,1.2);}}
   c.restore();
  }
 }
}
