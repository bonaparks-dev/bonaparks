// Hinges calibrated to the original overview image (1448 × 1086).
// Rotate two rigid leaves in the ground plane, rather than sliding / shrinking
// the leaves across the image. All points are in the shared 1000 × 1000 space.
export const gateHinges=[[236.9,128.9],[309.4,159.3]];
export function gateLeaves(opening){
 const t=Math.max(0,Math.min(1,opening)),angle=t*Math.PI/2,c=Math.cos(angle),s=Math.sin(angle);
 const [a,b]=gateHinges,u=[(b[0]-a[0])/2,(b[1]-a[1])/2],v=[-18.5,43];
 return [[a,[a[0]+u[0]*c+v[0]*s,a[1]+u[1]*c+v[1]*s]],
         [b,[b[0]-u[0]*c+v[0]*s,b[1]-u[1]*c+v[1]*s]]];
}
export function gateMarkup(opening){
 const leaves=gateLeaves(opening),h=27.5;
 const leaf=([p,q])=>`<g><path d="M${p}L${q}l0 ${-h}L${p[0]} ${p[1]-h}Z" fill="url(#gate-wood)" stroke="#ac753f" stroke-width="1.1"/>${Array.from({length:7},(_,i)=>`<path d="M${p[0]} ${p[1]-3-i*3.5}L${q[0]} ${q[1]-3-i*3.5}" stroke="#ad793f" stroke-width=".45"/>`).join('')}<path d="M${q}l0 ${-h}" stroke="#8f6337" stroke-width="1.1"/></g>`;
 return `<defs><pattern id="gate-ground" width="9" height="9" patternUnits="userSpaceOnUse"><rect width="9" height="9" fill="#d3b79c"/><path d="m1 2 2-1 1 2-1 2-2-1ZM6 6l2-1 1 2-2 1Z" fill="#e0c7aa"/><path d="m5 1 2 1M0 7l3 1" stroke="#bda48c" stroke-width=".5"/></pattern></defs><path d="M237 101 309 131 309 159 237 129Z" fill="url(#gate-ground)"/>${leaves.map(leaf).join('')}`;
}
