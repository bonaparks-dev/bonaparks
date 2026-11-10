// Shared presentation basis for the render, water, fixtures and hit targets.
// The overview uses the plot's two boundary directions as horizontal/vertical
// axes. Interior views keep their native camera and architectural coordinates.
export const presentations={
 overview:{across:[1115,411],down:[-299,667],outline:[[.211,.004],[.982,.382],[.767,1],[.006,.618]],clip:'polygon(21.1% 0.4%,98.2% 38.2%,76.7% 100%,0.6% 61.8%)'},
 rdc:{across:[540,245],down:[-490,800],outline:[[.41,.04],[.85,.25],[1,.36],[1,.45],[.60,1],[.02,.77],[0,.62]]},
 etage:{across:[683,302],down:[-351,576],outline:[[.425,.04],[.865,.235],[.865,.416],[.975,.46],[.635,1],[.05,.77],[.195,.40]],clip:'polygon(42.3% 4%,86.5% 23.5%,86.5% 41.6%,97.5% 46%,63.5% 100%,5% 77%,19.5% 40%)'}
};
export function presentationMatrix(floor){
 if(floor!=='overview')return [1,0,0,1];
 const [x,y]=presentations.overview.across,[vx,vy]=presentations.overview.down,length=Math.hypot(x,y);
 const a=x/length,b=-y/length,c=y/length,d=x/length;
 const lean=(a*vx+c*vy)/(b*vx+d*vy);
 return [a-lean*b,b,c-lean*d,d];
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
 stage.style.width=view.width+'px';stage.style.height=view.height+'px';stage.style.setProperty('--scene-inverse',view.inverse);stage.style.setProperty('--scene-clip',view.clip);stage.dataset.presentation=floor;return view.transform;
}
