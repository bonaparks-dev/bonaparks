import {tvSurfaces,televisionMarkup} from './studio-tv-surfaces.mjs';
import {nativeDetails} from './studio-native-details.mjs';
import {legacyPoint} from './studio-overview-projection.mjs';
import {lightingMarkup} from './studio-lighting.mjs';
import {fansMarkup,fanPositions,fans} from './studio-equipment.mjs';
import {lampButtons,breezeMarkup} from './studio-fixtures.mjs';
import {poolPath as waterPath,spaPath} from './studio-water.mjs';
import {roomSurfaces,polygonPoints,surfaceBox} from './studio-home-surfaces.mjs';
import {shuttersMarkup} from './studio-shutters.mjs';
import {televisions} from './studio-home-model.mjs';
import {doorsMarkup} from './studio-doors.mjs';
import {gateMarkup} from './studio-gate.mjs';
// Hotspots are presentation coordinates over the accepted Su Pranu renders.
// They do not change the scanned architecture or claim measured device positions.
export const mapPoints={
 overview:{kitchen:[463,295],living:[503,399],'bath-down':[398,350],patio:[410,505],stairs:[522,526],garden:[755,543],gazebo:[499,729],entry:[274,242],garage:[181,283],pool:[672,821],spa:[687,746],gate:[272,123],'ac-rdc':[560,292],music:[388,548]},
 rdc:{kitchen:[511,249],living:[600,421],'bath-down':[360,330],patio:[410,570],stairs:[615,679],'ac-rdc':[686,224],music:[328,674]},
 etage:{master:[475,212],guest:[723,331],children:[330,395],blue:[578,548],'bath-up':[440,472],hall:[580,405],stairs:[684,666],'ac-etage':[691,443]}
};
const speakers={overview:[[348,470],[460,521],[334,531],[458,586]],rdc:[[229,469],[549,626],[142,660],[422,796]],etage:[]};
speakers.overview=nativeDetails.speakers.map(p=>legacyPoint(...p));
const iconPaths={car:'M3 10l2-6h14l2 6v9h-3v-3H6v3H3ZM3 10h18M6 13h2m8 0h2',shutter:'M4 3h16v18H4ZM4 7h16M4 11h16M4 15h16M4 19h16',plug:'M7 2v5m10-5v5M5 7h14v4a7 7 0 0 1-14 0ZM12 18v4',fan:'M12 10C4 8 5 2 9 3s5 4 3 7Zm2 2c6-6 10-2 7 1s-6 3-7-1Zm-3 2c1 9-5 9-6 5s2-6 6-5ZM14 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0',tv:'M3 4h18v13H3ZM8 21h8M12 17v4',muted:'M4 9h4l5-5v16l-5-5H4ZM17 9l5 6m0-6-5 6',light:'M9 18h6m-5 3h4M8 14a6 6 0 1 1 8 0l-1 2H9Z',music:'M9 18V5l11-2v13M9 7l11-2M9 18c0 3-6 3-6 0s6-3 6 0m11-2c0 3-6 3-6 0s6-3 6 0',air:'M3 7h12c5 0 5-5 1-5M3 12h15c5 0 5 6 1 6M3 17h7c4 0 4 5 0 5',water:'M2 9q3-4 6 0t6 0 6 0M2 15q3-4 6 0t6 0 6 0',gate:'M3 21V3h18v18M6 7v10m4-10v10m4-10v10m4-10v10',power:'M12 2v10M6 5a9 9 0 1 0 12 0',home:'m3 10 9-7 9 7M5 9v12h14V9M9 21v-8h6v8',moon:'M19 15A9 9 0 0 1 9 3a9 9 0 1 0 10 12',sun:'M12 3v2m0 14v2M3 12h2m14 0h2M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0',play:'m8 4 12 8-12 8Z',pause:'M8 4v16M16 4v16',clock:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M12 7v5l4 2',plus:'M12 4v16M4 12h16',check:'m5 12 4 4L20 5',close:'m6 6 12 12M6 18 18 6',eye:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Zm13 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0',expand:'M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5',speaker:'M4 9h4l5-5v16l-5-5H4ZM16 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14',settings:'M4 7h16M4 17h16M8 4v6M16 14v6'};
export const homeIcon=(id)=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${iconPaths[id]||iconPaths.light}"/></svg>`;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function mapMarkup(s,floor,definitions,selected){
 const points=mapPoints[floor],lights=definitions.filter(l=>points[l.id]);
 let html=`<svg class="home-effects" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true"><defs><radialGradient id="warm-halo"><stop stop-color="#ffe5ad" stop-opacity=".78"/><stop offset=".4" stop-color="#ffc66c" stop-opacity=".34"/><stop offset="1" stop-color="#ffa636" stop-opacity="0"/></radialGradient><radialGradient id="pool-halo"><stop stop-color="${s.lights.pool.color}" stop-opacity=".9"/><stop offset="1" stop-color="${s.lights.pool.color}" stop-opacity=".1"/></radialGradient><linearGradient id="gate-wood"><stop stop-color="#f1c17e"/><stop offset="1" stop-color="#ce9653"/></linearGradient><filter id="soft-glow"><feGaussianBlur stdDeviation="7"/></filter><clipPath id="pool-clip"><path d="${waterPath}"/></clipPath><clipPath id="spa-clip"><path d="${spaPath}"/></clipPath></defs>`;
 const surfaces=roomSurfaces[floor]||{};
 html+=lightingMarkup(s,floor);
 if(floor==='overview'){
  html+=`<g id="animated-gate" opacity="1" style="filter:brightness(${s.night&&!s.lights.entry.on?.43:1})">${gateMarkup(s.gate.position)}</g>`;
 }
 html+=doorsMarkup(s.doors,floor)+fansMarkup(s,floor);
 const ac=floor==='etage'?'etage':'rdc',air=points['ac-'+ac];if(air)html+=breezeMarkup(s,ac,air);
 for(const [i,[x,y]] of speakers[floor].entries()){const on=s.alertResponse?.speaking||s.music.playing&&s.music.speakers[i]&&s.music.volume>0;html+=`<g data-key="speaker-${i}" class="map-speaker ${on?'is-playing':''} ${s.alertResponse?.speaking?'is-announcing':''}" transform="translate(${x} ${y})"><rect x="-5" y="-10" width="10" height="20" rx="3" fill="#303e44" stroke="#b2c5c8" stroke-width="1"/><circle cy="3" r="3" fill="#718894"/><ellipse rx="17" ry="10" class="sound-ring"/><ellipse rx="29" ry="18" class="sound-ring second"/></g>`;}
 html+=televisionMarkup(s,floor);
 if(floor==='etage')html+='<g class="home-shutter-surfaces">'+shuttersMarkup(s.shutters)+'</g>';
 if(surfaces[selected])html+='<polygon class="selected-room-outline" points="'+polygonPoints(surfaces[selected])+'" fill="#6195ef" fill-opacity=".035" stroke="#8bb6f4" stroke-opacity=".5" stroke-width="1.4"/>';
 html+='</svg><div class="home-hit-areas">';
 for(const l of lights){const points=surfaces[l.id];if(!points)continue;const b=surfaceBox(points);html+='<button data-key="room-'+l.id+'" class="home-room-hit" data-home-space="'+l.id+'" style="left:'+b.x/10+'%;top:'+b.y/10+'%;width:'+b.w/10+'%;height:'+b.h/10+'%;clip-path:polygon('+b.clip+')" aria-label="Explorer '+esc(l.name)+'" aria-pressed="'+(selected===l.id)+'" title="Commandes · '+esc(l.name)+'"></button>';}
 if(floor==='overview'){
  for(const [id,x,y,w,h,label]of [['pool',580,752,178,132,'Lumière de la piscine'],['spa',664,724,44,42,'Lumière du jacuzzi'],['gate',234,96,78,70,'Portail d’entrée']])html+=`<button data-key="item-${id}" class="home-item-hit" data-home-direct="${id}" style="left:${x/10}%;top:${y/10}%;width:${w/10}%;height:${h/10}%;${id==='pool'?'clip-path:polygon(26% 0,100% 35%,87% 100%,10% 66%,0 30%);':id==='spa'?'clip-path:ellipse(46% 47%);':''}" aria-label="${label} · action directe" title="${id==='gate'?'Ouvrir / arrêter / fermer le portail':'Allumer / éteindre la '+(id==='pool'?'piscine':'lumière du jacuzzi')}" ${id!=='gate'?`aria-pressed="${s.lights[id].on}"`:''}></button>`;
 }
 for(const t of televisions.filter(t=>tvSurfaces[floor]?.[t.id])){const shape=tvSurfaces[floor][t.id],pos=shape.reduce((p,q)=>[p[0]+q[0]/shape.length,p[1]+q[1]/shape.length],[0,0]);html+='<button class="home-tv-hit" data-home-select="tv:'+t.id+'" style="left:'+(pos[0]-28)/10+'%;top:'+(pos[1]-16)/10+'%;width:5.6%;height:3.2%" aria-label="Télécommande · '+t.name+'" title="Télécommande · '+t.name+'"></button>';}
 html+=lampButtons(s,floor,definitions);if(floor==='overview'&&s.presence!=='away')html+='<button class="home-item-hit car-hit" data-home-direct="car" style="left:18%;top:37%;width:8%;height:12%" aria-label="Voiture · contact et phares" aria-pressed="'+s.car.on+'"></button>';
 for(const [id,[x,y]] of Object.entries(fanPositions[floor]||{}))html+=`<button class="home-fan-hit" data-device="fan" data-id="${id}" aria-label="${fans.find(f=>f.id===id).name}" aria-pressed="${s.fans?.[id]?.on===true}" style="left:${(x+22)/10}%;top:${(y+10)/10}%"><span>${homeIcon('power')}</span></button>`;
 return html+'</div>';

}
export function updateGateElement(svg,position){if(svg){svg.setAttribute('opacity','1');svg.innerHTML=gateMarkup(position);}}
