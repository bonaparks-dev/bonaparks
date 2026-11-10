import {nativeOverview,inverseOverview} from './studio-overview-projection.mjs';
// Native pier anchors. The image contains no closed gate beneath these leaves.
export const gateHinges=nativeOverview.gate;
export function gateLeaves(opening){
 const t=Math.max(0,Math.min(1,opening)),c=Math.cos(t*Math.PI/2),s=Math.sin(t*Math.PI/2),[a,b]=gateHinges,half=(b[0]-a[0])/2,depth=half*1.6*.84;
 return [[a,[a[0]+half*c,a[1]+depth*s]],[b,[b[0]-half*c,b[1]+depth*s]]];
}
export function gateMarkup(opening){
 const h=31,leaves=gateLeaves(opening);
 const leaf=([p,q])=>`<g><path d="M${p}L${q}l0 ${-h}L${p[0]} ${p[1]-h}Z" fill="url(#gate-wood)" stroke="#966c42" stroke-width=".7"/>${Array.from({length:9},(_,i)=>`<path d="M${p[0]} ${p[1]-2-i*3.2}L${q[0]} ${q[1]-2-i*3.2}" stroke="#815934" stroke-opacity=".55" stroke-width=".5"/>`).join('')}<path d="M${q}l0 ${-h}" stroke="#60482f" stroke-width="1"/></g>`;
 return `<g transform="matrix(${inverseOverview().join(' ')})">${leaves.map(leaf).join('')}</g>`;
}
