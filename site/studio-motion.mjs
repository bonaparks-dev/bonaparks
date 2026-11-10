// Authored demo routes in image coordinates; not measured or tracked positions.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const ease=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
export function smoothTrack(track,time){
 const t=clamp(Number.isFinite(time)?time:0,track[0][0],track.at(-1)[0]);
 const at=t=>{let i=1;while(i<track.length-1&&t>track[i][0])i++;const a=track[i-1],b=track[i],before=track[Math.max(0,i-2)],after=track[Math.min(track.length-1,i+1)],span=b[0]-a[0],u=clamp((t-a[0])/span,0,1);
  return [1,2].map(k=>{if(a[k]===b[k])return a[k];const stoppedBefore=before[1]===a[1]&&before[2]===a[2],stoppedAfter=after[1]===b[1]&&after[2]===b[2];const m0=stoppedBefore?0:(b[k]-before[k])/(b[0]-before[0])*span,m1=stoppedAfter?0:(after[k]-a[k])/(after[0]-a[0])*span;return clamp((2*u**3-3*u*u+1)*a[k]+(u**3-2*u*u+u)*m0+(-2*u**3+3*u*u)*b[k]+(u**3-u*u)*m1,Math.min(a[k],b[k]),Math.max(a[k],b[k]));});};
 const [x,y]=at(t),past=at(Math.max(track[0][0],t-.18)),future=at(Math.min(track.at(-1)[0],t+.18)),dx=future[0]-past[0],dy=future[1]-past[1];
 return {x,y,heading:Math.atan2(dx*1.12,dy),speed:Math.hypot(dx,dy)/.36,moving:Math.hypot(dx,dy)>.035&&t<track.at(-1)[0],motion:1};
}
const routes={
 overview:{kitchen:[[0,470,344],[3,470,344],[9,492,344],[12,492,344],[18,480,318],[22,480,318],[29,470,344]],living:[[0,465,403],[4,465,403],[11,474,433],[15,474,433],[22,461,419],[28,465,403]],patio:[[0,416,538],[4,416,538],[13,365,516],[18,365,516],[29,416,538]],garden:[[0,738,553],[3,738,553],[12,791,592],[15,791,592],[27,735,661],[31,735,661],[43,666,612],[48,666,612],[61,738,553]],gazebo:[[0,521,763],[4,521,763],[12,510,747],[18,510,747],[26,521,763]]},
 rdc:{kitchen:[[0,506,333],[4,506,333],[13,543,323],[17,543,323],[28,506,333]],living:[[0,515,438],[4,515,438],[13,548,460],[17,548,460],[28,515,438]],patio:[[0,407,680],[4,407,680],[16,324,637],[20,324,637],[34,407,680]]},
 etage:{master:[[0,556,255],[5,556,255],[13,530,250],[18,530,250],[28,556,255]],guest:[[0,691,301],[4,691,301],[12,675,324],[17,675,324],[27,691,301]],children:[[0,374,322],[5,374,322],[14,347,366],[20,347,366],[32,374,322]],blue:[[0,651,582],[5,651,582],[14,637,555],[20,637,555],[30,651,582]],hall:[[0,584,396],[3,584,396],[13,638,423],[17,638,423],[28,584,396]]}
};
export function ambientMotion(member,floor,time,origin,animate=true){
 if(!origin)return null;if(!animate)return {...origin,moving:false,motion:0};
 const route=routes[floor]?.[member.zone];if(!route)return {...origin,moving:false,motion:0};
 const seed=[...member.id].reduce((n,c)=>n+c.charCodeAt(0),0)%17;
 return smoothTrack(route,(time+seed)%route.at(-1)[0]);
}
export function easedTrail(track,time){const end=clamp(time,0,track.at(-1)[0]),points=[];for(let t=0;t<end;t+=.55){const p=smoothTrack(track,t);points.push([p.x,p.y]);}const p=smoothTrack(track,end);points.push([p.x,p.y]);return points;}
