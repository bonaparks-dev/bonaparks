import {fixtures} from './studio-fixtures.mjs';
import {roomSurfaces,polygonPoints,surfaceBox} from './studio-home-surfaces.mjs';

// Local light fields over the approved architectural images. Closed rooms have
// separate masks; the open kitchen/living area shares a continuous light boundary.
// Diffusion uses CSS transitions on stable keyed nodes, not another animation clock.
export function lightFields(state,floor){
 const surfaces=roomSurfaces[floor]||{};
 return Object.entries(fixtures[floor]||{}).flatMap(([id,positions])=>{
  const polygon=surfaces[id];if(!polygon)return [];
  const bounds=surfaceBox(polygon),outdoor=['garden','entry','garage','gazebo','stairs'].includes(id);
  const radius=Math.min(outdoor?110:170,Math.max(48,Math.hypot(bounds.w,bounds.h)*(positions.length>1?.45:.58)));
  const light=state.lights[id],level=light.on?Math.max(0,Math.min(1,light.brightness/100)):0;
  return positions.map(([x,y],i)=>({key:id+'-'+i,id,x,y:y+8,radius,level,polygon,outdoor}));
 });
}
function spread(field,kind){
 const {key,x,y,radius,level}=field;
 // The light expands from its source and settles; no repeating pulse or rings.
 return `<g data-key="${kind}-${key}" class="light-diffusion ${level?'is-lit':''}" style="--light-level:${level};transform-origin:${x}px ${y}px"><ellipse cx="${x}" cy="${y}" rx="${radius}" ry="${radius*.72}" fill="url(#${kind}-falloff)"/></g>`;
}
export function lightingMarkup(state,floor){
 const fields=lightFields(state,floor),rooms=[...new Set(fields.map(f=>f.id))];
 let html='<defs><radialGradient id="reveal-falloff"><stop stop-color="white" stop-opacity=".98"/><stop offset=".22" stop-color="white" stop-opacity=".91"/><stop offset=".48" stop-color="white" stop-opacity=".64"/><stop offset=".73" stop-color="white" stop-opacity=".22"/><stop offset="1" stop-color="white" stop-opacity="0"/></radialGradient><radialGradient id="warm-falloff"><stop stop-color="#fff0c4" stop-opacity=".30"/><stop offset=".24" stop-color="#ffe1a3" stop-opacity=".22"/><stop offset=".55" stop-color="#ffc36d" stop-opacity=".12"/><stop offset="1" stop-color="#ffb052" stop-opacity="0"/></radialGradient><filter id="room-edge-feather" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="1.6"/></filter>';
 const openArea={overview:[[442,244],[600,316],[532,461],[421,405],[414,305]],rdc:[[435,166],[741,310],[738,410],[642,545],[455,450],[390,278]]};
 for(const id of rooms){
  const open=['kitchen','living'].includes(id)&&openArea[floor];
  html+=`<mask id="light-room-${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="1000"><polygon points="${polygonPoints(open||roomSurfaces[floor][id])}" fill="white" filter="url(#room-edge-feather)"/>${open?'<polygon points="'+polygonPoints(roomSurfaces[floor]['bath-down'])+'" fill="black"/>':''}</mask>`;
 }
 html+='<mask id="lit-rooms" maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="1000">';
 for(const id of rooms)html+=`<g data-key="reveal-room-${id}" mask="url(#light-room-${id})">${fields.filter(f=>f.id===id).map(f=>spread(f,'reveal')).join('')}</g>`;
 const files={overview:'overview_rdc_v23.png',rdc:'rdc_pro.png',etage:'etage_natif_v22.png'};
 html+=`</mask></defs><image data-key="illuminated-materials" class="illuminated-materials" href="supranu/${files[floor]}" width="1000" height="1000" preserveAspectRatio="none" mask="url(#lit-rooms)"/>`;
 for(const id of rooms)html+=`<g data-key="warm-room-${id}" mask="url(#light-room-${id})">${fields.filter(f=>f.id===id).map(f=>spread(f,'warm')).join('')}</g>`;
 return html;
}
