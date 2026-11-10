// Presentation only: approved images and animation coordinates stay intact.
// Rectify BOTH floor-plane axes. Rotation alone left the side walls leaning.
// Normalize the determinant so the correction preserves area and stays modest.
export const presentations={
 overview:{across:[1115,411],down:[-299,667],outline:[[.211,.004],[.982,.382],[.767,1],[.006,.618]],clip:'polygon(21.1% 0.4%,98.2% 38.2%,76.7% 100%,0.6% 61.8%)'},
 rdc:{across:[540,245],down:[-490,800],outline:[[.41,.04],[.85,.25],[1,.36],[1,.45],[.60,1],[.02,.77],[0,.62]]},
 etage:{across:[683,302],down:[-351,576],outline:[[.425,.04],[.865,.235],[.865,.416],[.975,.46],[.635,1],[.05,.77],[.195,.40]],clip:'polygon(42.3% 4%,86.5% 23.5%,86.5% 41.6%,97.5% 46%,63.5% 100%,5% 77%,19.5% 40%)'}
};
export function presentationMatrix(floor){
 const v=presentations[floor]||presentations.overview;
 const uLength=Math.hypot(...v.across),vLength=Math.hypot(...v.down);
 const [ux,uy]=v.across.map(n=>n/uLength),[vx,vy]=v.down.map(n=>n/vLength);
 const area=ux*vy-uy*vx,k=1/Math.sqrt(area);
 return [vy*k,-uy*k,-vx*k,ux*k];
}
export function fitPresentation(floor,width,height,viewportWidth,viewportHeight){
 const v=presentations[floor]||presentations.overview,[a,b,c,d]=presentationMatrix(floor);
 const points=v.outline.map(([x,y])=>{x=(x-.5)*width;y=(y-.5)*height;return [a*x+c*y,b*x+d*y];});
 const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),left=Math.min(...xs),right=Math.max(...xs),top=Math.min(...ys),bottom=Math.max(...ys);
 const scale=Math.max(.001,Math.min(Math.max(1,viewportWidth-32)/(right-left),Math.max(1,viewportHeight-32)/(bottom-top)));
 const x=-(left+right)*scale/2,y=-(top+bottom)*scale/2,det=a*d-b*c;
 return {width:width*scale,height:height*scale,transform:`matrix(${a},${b},${c},${d},${x},${y})`,inverse:`matrix(${d/det},${-b/det},${-c/det},${a/det},0,0)`,clip:v.clip||'none',bounds:{width:(right-left)*scale,height:(bottom-top)*scale}};
}
export function applyPresentation(stage,floor,width,height,viewportWidth,viewportHeight){
 const view=fitPresentation(floor,width,height,viewportWidth,viewportHeight);
 stage.style.width=view.width+'px';stage.style.height=view.height+'px';stage.style.setProperty('--scene-inverse',view.inverse);stage.style.setProperty('--scene-clip',view.clip);stage.dataset.presentation=floor;return view.transform;
}
