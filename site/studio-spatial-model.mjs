import {lights} from './studio-home-model.mjs';
import {mapPoints} from './studio-home-map.mjs';

export const SPATIAL_KEY='bonaparks.supranu.spatial.v1';
export const palette=['#b9d7c0','#91b9e8','#dfad8d','#b9a0d6','#d5bf79','#a5d4d4'];
export const types={adult:'Adulte',child:'Enfant',dog:'Chien'};
export const zones=lights.filter(l=>!['pool','spa','stairs'].includes(l.id));
const walkable={
 overview:{kitchen:[470,344],living:[465,403],'bath-down':[395,367],patio:[416,538],gazebo:[521,763]},
 rdc:{kitchen:[506,333],living:[515,438],'bath-down':[364,358],patio:[407,680]},
 etage:{master:[556,255],guest:[691,301],children:[374,322],blue:[651,582],'bath-up':[454,450],hall:[584,396]}
};
export const cameras=[
 {id:'entry',name:'Entrée',zone:'entry',point:[277,185],target:[273,385],crop:[27,24]},
 {id:'side',name:'Côté de la maison',zone:'garden',point:[895,526],target:[740,548],crop:[82,54]},
 {id:'patio',name:'Terrasse',zone:'patio',point:[490,565],target:[360,490],crop:[41,52]},
 {id:'garden',name:'Jardin',zone:'garden',point:[890,414],target:[650,665],crop:[72,56]},
 {id:'pool',name:'Piscine',zone:'pool',point:[796,870],target:[676,746],crop:[68,84]}
];
export const scenarios={
 intrusion:{name:'Intrusion par le côté',duration:40,actor:'Personne non identifiée',kind:'adult',color:'#ee827b',camera:'side',
  track:[[0,950,530],[6,890,552],[12,812,550],[18,742,540],[25,653,540],[32,604,598],[40,645,704]],
  events:[{id:'entry',time:6,title:'Franchissement latéral',detail:'Une personne entre par le côté de la propriété. Le portail reste fermé.',camera:'side',zone:'garden',level:'warning'},
   {id:'intrusion',time:18,title:'Présence non identifiée',detail:'La caméra du jardin reprend la trajectoire vers la maison.',camera:'garden',zone:'garden',level:'alert'},
   {id:'pool-side',time:32,title:'Déplacement vers la piscine',detail:'La trajectoire atteint les abords du bassin.',camera:'pool',zone:'pool',level:'alert'}]},
 pool:{name:'Enfant près de la piscine',duration:36,actor:'Enfant · scénario',kind:'child',color:'#f4bd6d',camera:'garden',
  track:[[0,540,635],[6,581,681],[12,615,714],[18,627,747],[23,633,756],[30,613,700],[36,580,657]],
  events:[{id:'approach',time:8,title:'Approche de la piscine',detail:'Un enfant de démonstration s’approche du bassin.',camera:'garden',zone:'garden',level:'warning'},
   {id:'pool-zone',time:18,title:'Enfant trop proche du bassin',detail:'Zone de vigilance franchie : vérifiez immédiatement la présence d’un adulte. Alerte simulée.',camera:'pool',zone:'pool',level:'alert'},
   {id:'safe-return',time:30,title:'Retour hors de la zone de vigilance',detail:'L’enfant de démonstration s’éloigne du bord. L’événement reste dans la chronologie.',camera:'pool',zone:'pool',level:'info'}]}
};
export function safetyState(id,time){const last=eventsAt(id,time).at(-1);return last?.level||'idle';}
export function cameraAt(id,time){return eventsAt(id,time).at(-1)?.camera||scenarios[id].camera;}

export function initialSpatial(){return {version:1,visible:true,animate:true,members:[
 {id:'adult-1',name:'Adulte 1',kind:'adult',color:palette[0],zone:'kitchen',look:0},
 {id:'adult-2',name:'Adulte 2',kind:'adult',color:palette[2],zone:'patio',look:1},
 {id:'child-1',name:'Enfant',kind:'child',color:palette[1],zone:'living',look:0},
 {id:'dog-1',name:'Chien',kind:'dog',color:palette[4],zone:'garden',look:0}
 ]};}
export function validMember(m){return !!m&&typeof m.id==='string'&&/^[a-z0-9-]{1,80}$/i.test(m.id)&&typeof m.name==='string'&&m.name.trim().length>0&&m.name.length<=40&&Object.hasOwn(types,m.kind)&&palette.includes(m.color)&&zones.some(z=>z.id===m.zone)&&[0,1].includes(m.look);}
export function restoreSpatial(raw){const state=initialSpatial();if(raw?.version!==1)return state;state.visible=raw.visible!==false;state.animate=raw.animate!==false;if(Array.isArray(raw.members)){const seen=new Set();state.members=raw.members.slice(0,12).filter(m=>validMember(m)&&!seen.has(m.id)&&seen.add(m.id)).map(m=>({id:m.id,name:m.name,kind:m.kind,color:m.color,zone:m.zone,look:m.look}));}return state;}

// Coordinates are authored presentation positions over the retained renders,
// never inferred locations of actual people or camera detections.
export function memberPosition(member,floor,time=0,animate=true,zoom=1){
 const point=walkable[floor]?.[member.zone]||mapPoints[floor]?.[member.zone];if(!point)return null;
 const seed=[...member.id].reduce((n,c)=>n+c.charCodeAt(0),0),phase=time*.065+seed;
 const motion=Math.min(1,Math.max(.15,(zoom-1)/1.6)),radius=(member.zone==='garden'?6:floor==='overview'?3:4)*motion;
 return {x:point[0]+(animate?Math.sin(phase)*radius:0),y:point[1]+(animate?Math.sin(phase*2)*radius*.45:0),heading:animate?-.4+Math.sin(phase)*.18:-.4,moving:animate&&zoom>1.35,motion};
}
export function sampleTrack(track,time){
 const at=seconds=>{const t=Math.max(track[0][0],Math.min(track.at(-1)[0],seconds));let i=1;while(i<track.length-1&&t>track[i][0])i++;const a=track[i-1],b=track[i],k=(t-a[0])/(b[0]-a[0]);return {x:a[1]+(b[1]-a[1])*k,y:a[2]+(b[2]-a[2])*k};};
 const t=Math.max(track[0][0],Math.min(track.at(-1)[0],Number.isFinite(time)?time:0)),p=at(t),before=at(t-.45),after=at(t+.45);
 return {...p,heading:Math.atan2(after.x-before.x,after.y-before.y),moving:t<track.at(-1)[0]};
}
export function trailAt(track,time){const p=sampleTrack(track,time);return [...track.filter(n=>n[0]<=time).map(n=>[n[1],n[2]]),[p.x,p.y]];}
export function eventsAt(id,time){return scenarios[id].events.filter(e=>e.time<=time);}
export function videoToScene(seconds,videoDuration,scenarioDuration){return videoDuration>0?Math.max(0,Math.min(scenarioDuration,seconds/videoDuration*scenarioDuration)):0;}
export function sceneToVideo(seconds,videoDuration,scenarioDuration){return scenarioDuration>0?Math.max(0,Math.min(videoDuration,seconds/scenarioDuration*videoDuration)):0;}
export function advancePlayback(time,delta,speed,duration){return Math.min(duration,Math.max(0,time)+Math.min(.15,Math.max(0,delta))*speed);}
