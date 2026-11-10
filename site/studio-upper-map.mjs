// Orthographic camera exported from SuPranu_Etage_Natif_v24.blend.
// Use the same projection for windows, thresholds and upstairs walking paths.
// Coordinates of the model remain an approximate Matterpak reconstruction.
export function upperPoint(x,y,z=0){
 const dx=x-10.05,dy=y+18.1,dz=z-30.6,k=1000/15.2;
 return [500+k*(.88378793*dx+.467887729*dy),500-k*(-.39757061*dx+.750966727*dy+.52724433*dz)];
}
const window=(a,b,y,lo,hi)=>[upperPoint(a,y,hi),upperPoint(b,y,hi),upperPoint(b,y,lo),upperPoint(a,y,lo)];
export const upperWindows={master:window(-1.75,-.45,4.01,.82,2.05),guest:window(2.6,3.8,4.01,.82,2.05),children:window(-1.85,-.80,-3.185,.82,2.05),blue:window(1.65,3.15,-3.185,.45,1.25)};
export const upperEntry={p:upperPoint(4.45,-.14),q:upperPoint(4.45,.89),open:upperPoint(3.42,-.14),height:upperPoint(4.45,-.14)[1]-upperPoint(4.45,-.14,1.65)[1]};
