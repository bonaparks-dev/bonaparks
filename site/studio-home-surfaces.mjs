// Presentation polygons aligned to the existing renders, in a 1000 × 1000 space.
// These are interaction / lighting masks, not architectural measurements.
export const roomSurfaces={
 overview:{kitchen:[[442,244],[580,316],[520,367],[414,305]],living:[[468,335],[586,375],[532,461],[421,405]],'bath-down':[[388,311],[447,343],[408,390],[365,362]],patio:[[346,408],[527,491],[459,586],[282,501]],stairs:[[550,437],[598,461],[544,571],[506,553]],garden:[[634,362],[927,445],[800,739],[623,664],[530,605]],gazebo:[[485,696],[562,739],[526,793],[468,754]],entry:[[230,153],[319,190],[278,294],[190,257]],garage:[[160,211],[216,244],[184,342],[125,306]]},
 rdc:{kitchen:[[435,166],[643,265],[569,366],[390,278]],living:[[565,327],[738,410],[642,545],[455,450]],'bath-down':[[340,245],[435,294],[377,392],[282,344]],patio:[[252,424],[604,600],[427,833],[112,664]],stairs:[[672,487],[746,525],[600,856],[530,807]]},
 etage:{master:[[432,60],[655,163],[571,307],[345,229]],guest:[[687,177],[852,246],[754,413],[592,340]],children:[[340,252],[466,298],[343,505],[211,454]],blue:[[522,414],[713,490],[629,650],[451,563]],'bath-up':[[454,360],[518,399],[442,557],[349,514]],hall:[[475,312],[748,435],[712,472],[445,352]],stairs:[[760,478],[832,503],[654,872],[583,833]]}
};
export const polygonPoints=points=>points.map(p=>p.join(',')).join(' ');
export function surfaceBox(points){
 const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),x=Math.min(...xs),y=Math.min(...ys),w=Math.max(...xs)-x,h=Math.max(...ys)-y;
 return {x,y,w,h,clip:points.map(p=>`${(p[0]-x)/w*100}% ${(p[1]-y)/h*100}%`).join(',')};
}
