// Demonstration inventory, not a survey of physical sockets in Su Pranu.
export const fans=[{id:'patio',name:'Ventilateur · terrasse',zone:'rdc',room:'patio'},{id:'living',name:'Ventilateur · séjour',zone:'rdc',room:'living'}];
export const sockets=[{id:'kitchen',name:'Prise · cuisine',zone:'rdc'},{id:'living',name:'Prise · séjour',zone:'rdc'},{id:'patio',name:'Prise · terrasse',zone:'rdc'},{id:'children',name:'Prise · enfants',zone:'etage'}];
export const quickModes=[{id:'morning',name:'Bonjour',icon:'sun',detail:'Toutes les lumières à 100 %, volets ouverts.'},{id:'evening',name:'Soirée',icon:'moon',detail:'Lumières douces, terrasse et musique.'},{id:'night',name:'Bonne nuit',icon:'moon',detail:'Intérieurs éteints, ventilateurs et prises arrêtés, volets fermés.'}];
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
 return `<g data-key="ceiling-fan-${id}" class="ceiling-fan ${f.on?'running':''}" transform="translate(${x} ${y})"><ellipse cy="12" rx="23" ry="13" fill="#050915" opacity=".16"/><path d="M0 -13V0" stroke="#d4d4cf" stroke-width="3"/><g transform="scale(1 .66)"><g class="fan-rotor" style="--fan-duration:${[0,1.8,1.05,.65][f.speed]}s">${[0,120,240].map(a=>`<path transform="rotate(${a})" d="M-3 -2C-9 -12 -7 -27 0 -29C6 -29 9 -21 7 -13L3 1Z" fill="#d9dbd6" stroke="#8d98a4" stroke-width=".8"/>`).join('')}</g><circle r="5" fill="#71808e" stroke="#ecede6" stroke-width="1.2"/></g></g>`;
 }).join('');}
