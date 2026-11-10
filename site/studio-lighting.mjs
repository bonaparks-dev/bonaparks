import {inverseOverview} from './studio-overview-projection.mjs';
import {fixtures} from './studio-fixtures.mjs';
import {roomSurfaces,polygonPoints,surfaceBox} from './studio-home-surfaces.mjs';

// The garden circuit covers two separate lawns. Keep gravel, pool and terrace
// outside these masks; entrance uplights include the planting beside the gate.
export const outdoorLightSurfaces={
 garden:[[[637,326],[966,433],[812,754],[623,671],[543,610]],[[76,493],[274,562],[486,643],[407,790],[12,612]]],
 entry:[[[226,115],[328,170],[278,294],[190,257]],[[304,99],[414,149],[377,250],[294,213]],[[180,78],[235,109],[201,234],[144,209]]]
};

// Local light fields over the approved architectural images. Closed rooms have
// separate masks; the open kitchen/living area shares a continuous light boundary.
// Diffusion uses CSS transitions on stable keyed nodes, not another animation clock.
export function lightFields(state,floor){
 const surfaces=roomSurfaces[floor]||{};
 return Object.entries(fixtures[floor]||{}).flatMap(([id,positions])=>{
  const polygon=surfaces[id];if(!polygon)return [];
  const bounds=surfaceBox(polygon),outdoor=['garden','entry','garage','gazebo','stairs'].includes(id);
  const radius=Math.min(outdoor?110:170,Math.max(48,Math.hypot(bounds.w,bounds.h)*(positions.length>1?.50:.64)));
  const light=state.lights[id],level=light.on?Math.max(0,Math.min(1,light.brightness/100)):0;
  return positions.map(([x,y],i)=>({key:id+'-'+i,id,x,y,radius:floor==='overview'&&id==='garden'?88:radius,level,polygon,outdoor,uplight:floor==='overview'&&id==='entry'&&i>0}));
 });
}
function spread(field,kind){
 const {key,x,y,radius,level,uplight}=field;
 // The light expands from its source and settles; no repeating pulse or rings.
 return `<g data-key="${kind}-${key}" class="light-diffusion ${level?'is-lit':''}" style="--light-level:${level};transform-origin:${x}px ${y}px"><ellipse cx="${x}" cy="${y+(uplight?-20:20)}" rx="${radius*(uplight?.48:1)}" ry="${radius*(uplight?.8:.64)}" transform="rotate(24 ${x} ${y})" fill="url(#${kind}-falloff)"/></g>`;
}
export function lightingMarkup(state,floor){
 const fields=lightFields(state,floor),rooms=[...new Set(fields.map(f=>f.id))];
 let html='<defs><radialGradient id="reveal-falloff"><stop stop-color="white"/><stop offset=".25" stop-color="white" stop-opacity=".98"/><stop offset=".52" stop-color="white" stop-opacity=".68"/><stop offset=".78" stop-color="white" stop-opacity=".20"/><stop offset="1" stop-color="white" stop-opacity="0"/></radialGradient><radialGradient id="warm-falloff"><stop stop-color="#fff8e4" stop-opacity=".44"/><stop offset=".18" stop-color="#ffedc6" stop-opacity=".30"/><stop offset=".50" stop-color="#ffd697" stop-opacity=".13"/><stop offset="1" stop-color="#ffc483" stop-opacity="0"/></radialGradient><radialGradient id="lamp-bloom"><stop stop-color="#fffbea" stop-opacity=".85"/><stop offset=".16" stop-color="#fff1cb" stop-opacity=".7"/><stop offset=".45" stop-color="#ffda9a" stop-opacity=".24"/><stop offset="1" stop-color="#ffc477" stop-opacity="0"/></radialGradient><filter id="room-edge-feather" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="1.6"/></filter>';
 const openArea={overview:[[442,244],[600,316],[532,461],[421,405],[414,305]],rdc:[[435,166],[741,310],[738,410],[642,545],[455,450],[390,278]]};
 for(const id of rooms){
  const open=['kitchen','living'].includes(id)&&openArea[floor];
  const regions=floor==='overview'&&outdoorLightSurfaces[id]||[open||roomSurfaces[floor][id]];
  html+=`<mask id="light-room-${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="1000">${regions.map(p=>`<polygon points="${polygonPoints(p)}" fill="white" filter="url(#room-edge-feather)"/>`).join('')}${open?'<polygon points="'+polygonPoints(roomSurfaces[floor]['bath-down'])+'" fill="black"/>':''}</mask>`;
 }
 html+='<mask id="lit-rooms" maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="1000">';
 for(const id of rooms)html+=`<g data-key="reveal-room-${id}" mask="url(#light-room-${id})">${fields.filter(f=>f.id===id).map(f=>spread(f,'reveal')).join('')}</g>`;
 const files={overview:'property_native_v25.webp',rdc:'rdc_pro.png',etage:'etage_quality_v25.webp'};
 html+=`</mask></defs><g mask="url(#lit-rooms)"><image data-key="illuminated-materials" class="illuminated-materials" href="supranu/${files[floor]}" width="1000" height="1000" preserveAspectRatio="none" transform="${floor==='overview'?'matrix('+inverseOverview().join(' ')+')':''}"/></g>`;
 for(const id of rooms)html+=`<g data-key="warm-room-${id}" mask="url(#light-room-${id})">${fields.filter(f=>f.id===id).map(f=>spread(f,'warm')).join('')}</g>`;
 // A small luminous source and soft bloom, like a real spot. Its footprint
 // brightens the materials below; the interaction target stays transparent.
 for(const {key,x,y,level} of fields)html+=`<g data-key="emitter-${key}" class="lamp-emitter ${level?'is-lit':''}" style="--light-level:${level}"><ellipse cx="${x}" cy="${y}" rx="14" ry="17" fill="url(#lamp-bloom)"/><circle cx="${x}" cy="${y}" r="2.5" fill="#fff9e7"/></g>`;
 return html;
}
