import {overlayStyles} from './studio-overview-projection.mjs';
// Every architectural image keeps its native camera and undistorted proportions.
// The landscape camera itself aligns the rectangle with the screen axes.
export const presentations={
 overview:{across:[1,0],down:[0,1],outline:[[.0098,.048],[.9902,.048],[.9902,.963],[.0098,.963]]},
 rdc:{across:[540,245],down:[-490,800],outline:[[.41,.04],[.85,.25],[1,.36],[1,.45],[.60,1],[.02,.77],[0,.62]]},
 etage:{across:[683,302],down:[-351,576],outline:[[.425,.04],[.865,.235],[.865,.416],[.975,.46],[.635,1],[.05,.77],[.195,.40]],clip:'polygon(42.3% 4%,86.5% 23.5%,86.5% 41.6%,97.5% 46%,63.5% 100%,5% 77%,19.5% 40%)'}
};
export function presentationMatrix(floor){
 return [1,0,0,1];
}
export function presentationBounds(floor,width,height){
 const v=presentations[floor]||presentations.overview,[a,b,c,d]=presentationMatrix(floor);
 const points=v.outline.map(([x,y])=>{x=(x-.5)*width;y=(y-.5)*height;return [a*x+c*y,b*x+d*y];});
 const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
 return {left:Math.min(...xs),right:Math.max(...xs),top:Math.min(...ys),bottom:Math.max(...ys)};
}
export function fitPresentation(floor,width,height,viewportWidth,viewportHeight){
 const v=presentations[floor]||presentations.overview,[a,b,c,d]=presentationMatrix(floor);
 const {left,right,top,bottom}=presentationBounds(floor,width,height),padding=floor==='overview'?0:16;
 const sx=Math.max(1,viewportWidth-padding*2)/(right-left),sy=Math.max(1,viewportHeight-padding*2)/(bottom-top);
 // Fill the normal landscape frame edge-to-edge. On unusually tall/narrow
 // screens keep the complete property rather than cropping out entire zones.
 const fill=floor==='overview'&&Math.max(sx,sy)/Math.min(sx,sy)<1.10;
 const scale=Math.max(.001,fill?Math.max(sx,sy):Math.min(sx,sy));
 const x=-(left+right)*scale/2,y=-(top+bottom)*scale/2,det=a*d-b*c;
 return {width:width*scale,height:height*scale,transform:`matrix(${a},${b},${c},${d},${x},${y})`,inverse:`matrix(${d/det},${-b/det},${-c/det},${a/det},0,0)`,clip:v.clip||'none',fill,bounds:{width:(right-left)*scale,height:(bottom-top)*scale}};
}
export function applyPresentation(stage,floor,width,height,viewportWidth,viewportHeight){
 const view=fitPresentation(floor,width,height,viewportWidth,viewportHeight);
 const overlay=floor==='overview'?overlayStyles(view.width,view.height):{transform:'none',inverse:view.inverse};
 stage.style.width=view.width+'px';stage.style.height=view.height+'px';stage.style.setProperty('--overlay-transform',overlay.transform);stage.style.setProperty('--scene-inverse',overlay.inverse);stage.style.setProperty('--scene-clip',view.clip);stage.dataset.presentation=floor;return view.transform;
}
