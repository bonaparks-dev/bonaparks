import {lights} from './studio-home-model.mjs';
import {mapPoints} from './studio-home-map.mjs';
import {presentationMatrix,presentationBounds} from './studio-presentation.mjs';

export function spacesForFloor(floor){return lights.filter(l=>mapPoints[floor]?.[l.id]);}
export function clampHouseZoom(value){return Number.isFinite(value)?Math.max(1,Math.min(3.4,value)):1;}

// Camera target in the render's coordinate system, independent of screen size.
export function spaceCamera(floor,id,width,height,hostWidth,hostHeight){
 const point=mapPoints[floor]?.[id];
 if(!point||id==='all')return {x:0,y:0,zoom:1};
 const broad=['garden','patio','living'].includes(id);
 const fraction=id==='garden'?.56:floor==='overview'?(broad?.29:.23):(broad?.48:.36);
 const zoom=Math.max(1.35,Math.min(1.85,hostWidth*.78/(width*fraction),hostHeight*.72/(height*fraction)));
 const [a,b,c,d]=presentationMatrix(floor),bounds=presentationBounds(floor,width,height);
 const px=(point[0]/1000-.5)*width,py=(point[1]/1000-.5)*height;
 return {x:((bounds.left+bounds.right)/2-a*px-c*py)*zoom,y:((bounds.top+bounds.bottom)/2-b*px-d*py)*zoom,zoom};
}

// Update existing nodes so running SVG/CSS animations retain their phase.
// Keyed groups also retain DOM identity when another effect appears or disappears.
export function morphChildren(parent,nextParent){
 const key=n=>n.nodeType===1?(n.getAttribute('data-key')||n.id||null):null;
 const existing=[...parent.childNodes],keyed=new Map(existing.filter(key).map(n=>[key(n),n]));
 const used=new Set();let cursor=parent.firstChild;
 for(const source of [...nextParent.childNodes]){
  const k=key(source);let target=k?keyed.get(k):cursor;
  if(target&&(used.has(target)||(!k&&key(target))||target.nodeType!==source.nodeType||target.nodeName!==source.nodeName))target=null;
  if(!target){target=source.cloneNode(true);parent.insertBefore(target,cursor);}
  else{
   if(target!==cursor)parent.insertBefore(target,cursor);
   if(target.nodeType===1){
    for(const a of [...target.attributes])if(!source.hasAttribute(a.name))target.removeAttribute(a.name);
    for(const a of [...source.attributes])if(target.getAttribute(a.name)!==a.value)target.setAttribute(a.name,a.value);
    if(target.nodeName==='INPUT'&&['range','number'].includes(target.type)&&target.value!==source.value)target.value=source.value;
    if(!target.hasAttribute('data-preserve'))morphChildren(target,source);
   }else if(target.nodeValue!==source.nodeValue)target.nodeValue=source.nodeValue;
  }
  used.add(target);cursor=target.nextSibling;
 }
 for(const n of existing)if(!used.has(n)&&n.parentNode===parent)parent.removeChild(n);
}
