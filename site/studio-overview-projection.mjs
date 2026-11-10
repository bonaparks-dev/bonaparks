// Exported from the native Blender camera. Only authored overlays are mapped;
// the architectural render is never rotated, sheared or stretched.
export const overviewProjection=[1.092643663,-0.603470207,0.36735434799999994,1.2278637289999998,-222.213313,188.719869];
export const nativeOverview={"plot":[[9.803928,945.040636],[990.196049,945.040636],[990.196049,66.29914],[9.803928,66.29914]],"tv":{"living":[[487.450987,244.952321],[513.52942,244.952321],[513.52942,258.643687],[487.450987,258.643687]]},"gate":[[83.985955,200.817108],[174.370185,200.817108]],"rearPassage":[[280.882359,251.036048],[613.725483,251.036048],[613.725483,209.976852],[280.882359,209.976852]],"houseCorners":[[325.490206,256.110847],[569.117665,256.110847],[569.117665,581.355035],[325.490206,581.355035]]};
export function overviewPoint(x,y){const [a,b,c,d,e,f]=overviewProjection;return [a*x+c*y+e,b*x+d*y+f];}
export function legacyPoint(x,y){const [a,b,c,d,e,f]=overviewProjection,det=a*d-b*c;return [(d*(x-e)-c*(y-f))/det,(-b*(x-e)+a*(y-f))/det];}
export function inverseOverview(){const [a,b,c,d,e,f]=overviewProjection,det=a*d-b*c;return [d/det,-b/det,-c/det,a/det,(c*f-d*e)/det,(b*e-a*f)/det];}
export function overviewActor(actor){if(!actor)return actor;const [x,y]=overviewPoint(actor.x,actor.y),[a,b,c,d]=overviewProjection,dx=Math.sin(actor.heading||0)/1.12,dy=Math.cos(actor.heading||0);return {...actor,x,y,heading:Math.atan2((a*dx+c*dy)*1.6,b*dx+d*dy)};}
export function overviewVehicle(vehicle){const p=overviewActor(vehicle);return p?{...p,heading:p.moving?p.heading:0}:p;}
export function overlayStyles(width,height){const [a,b,c,d,e,f]=overviewProjection,det=a*d-b*c;return {transform:`matrix(${a},${b*height/width},${c*width/height},${d},${e*width/1000},${f*height/1000})`,inverse:`matrix(${d/det},${-b*height/width/det},${-c*width/height/det},${a/det},0,0)`};}
