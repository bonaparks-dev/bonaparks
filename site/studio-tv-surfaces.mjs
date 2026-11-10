import {nativeOverview,legacyPoint} from './studio-overview-projection.mjs';
import {upperScreen} from './studio-upper-screen.mjs';

// The overview screen face comes directly from the native Blender camera export.
export const tvSurfaces={
 overview:{living:nativeOverview.tv.living.map(p=>legacyPoint(...p))},
 rdc:{living:[[660,241],[709,265],[709,286],[660,263]]},
 etage:{children:upperScreen}
};
export function televisionFloor(id,current,on=true){
 if(!on)return current;
 if(id==='children')return 'etage';
 return current==='etage'?'rdc':current;
}
export function televisionMarkup(state,floor){
 return Object.entries(tvSurfaces[floor]||{}).map(([id,points])=>{
  const tv=state.tv[id],shape=points.map(p=>p.join(',')).join(' ');
  const visibility=id==='children'?'<mask id="children-tv-visibility" maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="1000" style="mask-type:luminance"><image href="supranu/upper_tv_visibility_v25.png" width="1000" height="1000"/></mask>':'';
  return `<defs>${visibility}<linearGradient id="screen-${id}" x2="1" y2="1"><stop stop-color="#80dafa"/><stop offset=".44" stop-color="#5884dd"/><stop offset=".72" stop-color="#9c85e6"/><stop offset="1" stop-color="#f8b391"/></linearGradient><clipPath id="screen-face-${id}"><polygon points="${shape}"/></clipPath></defs><g data-key="tv-face-${id}" data-tv-screen="${id}" data-power="${tv.on?'on':'off'}" opacity="${tv.on?1:0}" clip-path="url(#screen-face-${id})" ${visibility?'mask="url(#children-tv-visibility)"':''}><polygon class="home-tv-screen" points="${shape}" fill="url(#screen-${id})"/></g>`;
 }).join('');
}
