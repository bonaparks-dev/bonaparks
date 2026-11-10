// Demonstration inventory, not a survey of physical sockets in Su Pranu.
export const fans=[{id:'patio',name:'Ventilateur · terrasse',zone:'rdc',room:'patio'},{id:'living',name:'Ventilateur · séjour',zone:'rdc',room:'living'}];
export const sockets=[{id:'kitchen',name:'Prise · cuisine',zone:'rdc'},{id:'living',name:'Prise · séjour',zone:'rdc'},{id:'patio',name:'Prise · terrasse',zone:'rdc'},{id:'children',name:'Prise · enfants',zone:'etage'}];
export const quickModes=[{id:'morning',name:'Bonjour',icon:'sun',detail:'Volets ouverts, lumières éteintes : place à la lumière du jour.'},{id:'evening',name:'Soirée',icon:'moon',detail:'Lumières douces, jardin, piscine et terrasse.'},{id:'night',name:'Bonne nuit',icon:'moon',detail:'Intérieurs éteints, ventilateurs et prises arrêtés, volets fermés.'}];
export const initialFans=()=>Object.fromEntries(fans.map(f=>[f.id,{on:false,speed:2}]));
export const initialSockets=()=>Object.fromEntries(sockets.map(s=>[s.id,{on:false}]));
export function equipmentSummary(s){
 const lights=Object.values(s.lights),plugs=Object.values(s.sockets||{}),running=xs=>xs.filter(v=>v.on).length,lit=lights.filter(v=>v.on),dimmable=lit.length?lit:lights;
 const extras=[...Object.values(s.fans||{}),...Object.values(s.climate),...Object.values(s.tv),{on:s.pool.pump},{on:s.spa.jets},...s.music.speakers.map(on=>({on:on&&s.music.playing})),{on:s.car.on},...Object.values(s.shutters).map(v=>({on:v.position!==v.target})),{on:s.gate.position!==s.gate.target}];
 return {lights:{on:running(lights),total:lights.length},sockets:{on:running(plugs),total:plugs.length},devices:{on:running([...lights,...plugs,...extras]),total:lights.length+plugs.length+extras.length},brightness:Math.round(dimmable.reduce((n,v)=>n+v.brightness,0)/dimmable.length)};
}
export const fanPositions={overview:{patio:[414,524],living:[506,354]},rdc:{patio:[343,614],living:[584,367]}};
export function fansMarkup(s,floor){return Object.entries(fanPositions[floor]||{}).map(([id,[x,y]])=>{
 const f=s.fans?.[id]||{on:false,speed:2};
 return `<g data-key="ceiling-fan-${id}" class="ceiling-fan ${f.on?'running':''}" transform="translate(${x} ${y})"><ellipse cy="7" rx="20" ry="11" fill="#02050b" opacity=".15"/><path d="M0 -7V0" stroke="#89909b" stroke-width="2"/><g transform="scale(1 .66)"><g class="fan-rotor" style="--fan-duration:${[0,1.8,1.05,.65][f.speed]}s">${[0,90,180,270].map(a=>`<path transform="rotate(${a})" d="M-2 -2C-6 -8 -5 -17 -1 -21C2 -23 5 -20 5 -16L3 0Z" fill="#87939f" stroke="#d2d8dc" stroke-width=".45"/>`).join('')}</g><circle r="4" fill="#263644" stroke="#bdc9d2" stroke-width=".8"/><circle r="1.7" fill="#b2bdc6"/></g></g>`;
 }).join('');}
