import {nativeDetails} from './studio-native-details.mjs';
import {legacyPoint} from './studio-overview-projection.mjs';
// Demo fixtures follow native room edges. They are not a device survey.
export const fixtures={
 overview:{kitchen:[[465,263]],living:[[560,388]],'bath-down':[[393,331]],patio:[[346,439],[490,508]],stairs:[[553,475]],garden:[[647.5,348.6],[919.8,482.4],[843,640],[748,707],[75,580],[354,723]],gazebo:[[499,726]],entry:[[255,151],[346,178],[198,136]],garage:[[160,256]]},
 rdc:{kitchen:[[472,207],[575,253]],living:[[670,403],[595,502]],'bath-down':[[358,283]],patio:[[261,487],[513,640]],stairs:[[674,543]]},
 etage:{master:[[440,156],[567,213]],guest:[[721,249],[746,346]],children:[[344,305],[273,425]],blue:[[535,466],[625,552]],'bath-up':[[448,415]],hall:[[573,374]],stairs:[[742,557]]}
};
for(const [id,points] of Object.entries(nativeDetails.fixtures))fixtures.overview[id]=points.map(p=>legacyPoint(...p));
export function lampButtons(state,floor,definitions){return Object.entries(fixtures[floor]||{}).map(([id,positions])=>positions.map(([x,y],i)=>'<button data-key="lamp-button-'+id+'-'+i+'" class="map-lamp-button" data-home-toggle="'+id+'" aria-label="'+definitions.find(l=>l.id===id).name+'" aria-pressed="'+state.lights[id].on+'" style="left:'+x/10+'%;top:'+y/10+'%"><span><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 11h4M6.5 13h3M5.4 8.5a4 4 0 1 1 5.2 0L10 10H6Z"/></svg></span></button>').join('')).join('');}
export function breezeMarkup(state,id,point){const [x,y]=point,c=state.climate[id];return `<g data-key="ac-unit-${id}" class="ac-unit ${c.on?'running':''} ${c.mode==='heat'?'warm':''}" transform="translate(${x-15} ${y})"><path d="m0-10 30 15v7L0-3Z" fill="#d9e0e7" stroke="#6b7b8c" stroke-width=".7"/><path d="m3-4 23 11.5" stroke="#617182" stroke-width="1.3"/><circle cx="26" cy="8" r="1" fill="${c.on?'#9edbff':'#7e858e'}"/><g class="breeze-streams" opacity="${c.on?1:0}">${[0,1,2,3].map(i=>`<path class="breeze-soft" d="M${5+i*6} ${1+i*3}q${-12-i*2} 23 ${-3-i*4} 37t-3 25"/><path class="breeze-streak" pathLength="100" style="--delay:-${i*.7}s" d="M${5+i*6} ${1+i*3}q${-12-i*2} 23 ${-3-i*4} 37t-3 25"/>`).join('')}</g></g>`;}
