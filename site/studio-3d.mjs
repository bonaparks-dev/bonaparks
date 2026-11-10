import * as T from './vendor/three.module.min.js';
import {bounds,wallRuns,materials} from './studio-model.mjs';
export class HouseRenderer{
 constructor(host){
  this.host=host;this.zoom=1;this.angle=-.65;this.elevation=.95;this.fullWalls=false;
  this.renderer=new T.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.25;host.append(this.renderer.domElement);
  this.scene=new T.Scene();this.camera=new T.OrthographicCamera(-8,8,8,-8,.1,200);
  this.scene.add(new T.HemisphereLight(0xddeee5,0x617057,2.5));const sun=new T.DirectionalLight(0xffe5c3,4);sun.position.set(-6,15,8);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-35;sun.shadow.camera.right=35;sun.shadow.camera.top=35;sun.shadow.camera.bottom=-35;sun.shadow.bias=-.0006;sun.shadow.normalBias=.035;this.scene.add(sun);this.sun=sun;
  const fill=new T.DirectionalLight(0xc8e6ff,1.5);fill.position.set(12,6,-10);this.scene.add(fill);
  this.group=new T.Group();this.scene.add(this.group);this.b={x:0,y:0,w:10,d:8};
  let drag=null;host.addEventListener('pointerdown',e=>{if(e.button!==0)return;drag={x:e.clientX,y:e.clientY,a:this.angle,e:this.elevation};host.setPointerCapture(e.pointerId);});host.addEventListener('pointermove',e=>{if(!drag)return;this.angle=drag.a+(e.clientX-drag.x)*.008;this.elevation=Math.max(.3,Math.min(1.45,drag.e+(e.clientY-drag.y)*.005));this.render();});host.addEventListener('pointerup',()=>drag=null);host.addEventListener('pointercancel',()=>drag=null);
  new ResizeObserver(()=>this.render()).observe(host);
 }
 clear(){const gs=new Set(),ms=new Set();this.group.traverse(o=>{if(o.geometry)gs.add(o.geometry);if(o.material)ms.add(o.material);});this.group.clear();gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());}
 material(color,extra={}){return new T.MeshStandardMaterial({color,roughness:.65,...extra});}
 box(w,h,d,x,y,z,color,parent=this.group){const mesh=new T.Mesh(new T.BoxGeometry(Math.max(w,.002),Math.max(h,.002),Math.max(d,.002)),this.material(color));mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
 sphere(radius,x,y,z,color,parent=this.group,scale=[1,1,1]){const mesh=new T.Mesh(new T.SphereGeometry(radius,20,14),this.material(color));mesh.position.set(x,y,z);mesh.scale.set(...scale);mesh.castShadow=true;parent.add(mesh);return mesh;}
 cylinder(r1,r2,h,x,y,z,color,parent=this.group){const mesh=new T.Mesh(new T.CylinderGeometry(r1,r2,h,32),this.material(color));mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
 rebuild(f,selected){
  this.clear();this.b=bounds(f);const b=this.b,wallH=this.fullWalls?f.height:1.45;
  if(!f.rooms.length){this.render();return;}
  this.box(b.w+.8,.18,b.d+.8,b.x+b.w/2,-.16,b.y+b.d/2,'#c0c4ae');
  for(const r of f.rooms){const color=materials[r.material].color;this.box(r.w,.1,r.d,r.x+r.w/2,-.03,r.y+r.d/2,color);
   if(r.material==='oak')for(let x=r.x+.18;x<r.x+r.w;x+=.25)this.box(.008,.003,r.d,x,.023,r.y+r.d/2,'#8f795f');
   if(r.material==='stone'){for(let x=r.x+.6;x<r.x+r.w;x+=.6)this.box(.008,.003,r.d,x,.023,r.y+r.d/2,'#a9aa9c');for(let y=r.y+.6;y<r.y+r.d;y+=.6)this.box(r.w,.003,.008,r.x+r.w/2,.023,y,'#a9aa9c');}
   if(r.id===selected){const line=new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(r.w,.03,r.d)),new T.LineBasicMaterial({color:'#c6f2a7'}));line.position.set(r.x+r.w/2,.07,r.y+r.d/2);this.group.add(line);}
  }
  for(const s of wallRuns(f)){const length=s.end-s.start,c=(s.start+s.end)/2,horizontal=s.axis==='x';const block=(h,y,color,thickness=.13)=>this.box(horizontal?length:thickness,h,horizontal?thickness:length,horizontal?c:s.fixed,y,horizontal?s.fixed:c,color);
   if(s.kind==='wall'){block(wallH,wallH/2,'#e6e1cf');block(.07,.055,'#b7ad98',.145);block(.025,wallH+.012,'#f4efdf',.145);}
   else if(s.kind==='window'){block(.78,.39,'#e6e1cf');const glass=block(Math.min(wallH-.84,1),.84+Math.min(wallH-.84,1)/2,'#a6d5d0',.035);glass.material.transparent=true;glass.material.opacity=.47;block(.045,.82,'#e8eddf',.19);block(.04,Math.min(wallH,1.86),'#e8eddf',.09);
    const frameH=Math.min(wallH-.84,1.04);for(const t of [s.start+.025,c,s.end-.025])this.box(horizontal?.035:.11,frameH,horizontal?.11:.035,horizontal?t:s.fixed,.84+frameH/2,horizontal?s.fixed:t,'#d6decd');if(wallH>1.9)block(wallH-1.9,(wallH+1.9)/2,'#e6e1cf');
   }else{const doorH=Math.min(wallH,2.05);const g=new T.Group();g.position.set(horizontal?s.start:s.fixed,0,horizontal?s.fixed:s.start);g.rotation.y=horizontal?-.5:Math.PI/2-.5;this.group.add(g);this.box(length-.06,doorH,.045,length/2,doorH/2,0,'#a78b68',g);this.sphere(.035,length-.14,.85,.05,'#d4bb80',g);if(wallH>2.1)block(wallH-2.1,(wallH+2.1)/2,'#e6e1cf');}
  }
  for(const o of f.objects)this.furniture(o,o.id===selected);
  this.sun.target.position.set(b.x+b.w/2,0,b.y+b.d/2);this.scene.add(this.sun.target);this.sun.position.set(b.x-8,16,b.y+10);this.render();
 }
 furniture(o,selected){const g=new T.Group();g.position.set(o.x+o.w/2,0,o.y+o.d/2);g.rotation.y=-o.rotation*Math.PI/180;this.group.add(g);const {w,d}=o;const box=(a,h,c,x,y,z,col)=>this.box(a,h,c,x,y,z,col,g),sphere=(r,x,y,z,col,sc)=>this.sphere(r,x,y,z,col,g,sc),cylinder=(r1,r2,h,x,y,z,col)=>this.cylinder(r1,r2,h,x,y,z,col,g);const wood='#9d7753',cream='#d9d4bf';
  if(o.kind==='sofa'){box(w,.23,d,0,.24,0,'#63765e');box(w,.48,.16,0,.55,-d/2+.08,'#8fa184');box(.15,.42,d,-w/2+.075,.46,0,'#85977b');box(.15,.42,d,w/2-.075,.46,0,'#85977b');for(let i=0;i<3;i++)box((w-.34)/3-.02,.16,d-.2,-(w-.34)/3+i*(w-.34)/3,.43,.06,'#a8b59a');sphere(.2,-w*.28,.67,-d*.2,'#c4be9b',[1,1,.4]);sphere(.18,w*.27,.65,-d*.2,'#718b70',[1,1,.4]);box(w+.7,.02,d+1.7,0,.035,.5,'#c7bda6');}
  else if(o.kind==='bed'){box(w,.26,d,0,.2,0,wood);box(w-.06,.18,d-.05,0,.42,0,'#eeebdd');box(w-.1,.08,d*.64,0,.54,d*.13,'#a2b4ab');box(w,.8,.12,0,.45,-d/2,wood);for(const x of [-w*.24,w*.24])box(w*.4,.12,d*.2,x,.57,-d*.31,'#f8f3e8');box(w+.5,.02,d+.6,0,.035,.1,'#bcb19d');}
  else if(o.kind==='table'){box(w,.09,d,0,.78,0,wood);for(const x of [-w*.38,w*.38])for(const z of [-d*.33,d*.33])box(.055,.71,.055,x,.38,z,'#66543d');for(const z of [-d*.75,d*.75])for(const x of [-w*.28,w*.28]){box(.36,.07,.36,x,.44,z,'#b2ba9e');box(.36,.4,.045,x,.61,z+(z<0?-.15:.15),'#9fae90');for(const a of [-.13,.13])for(const b of [-.13,.13])box(.035,.4,.035,x+a,.22,z+b,'#85765a');}cylinder(.1,.08,.18,0,.91,0,'#d9d6be');sphere(.17,0,1.09,0,'#74895a');}
  else if(o.kind==='kitchen'){box(w,.83,d,0,.43,0,'#8c9d85');box(w+.06,.055,d+.05,0,.88,0,'#dfded1');for(let x=-w/2+.45;x<w/2;x+=.6){box(.009,.72,.01,x,.45,d/2+.01,'#59674e');box(.15,.025,.025,x-.2,.73,d/2+.02,'#414c3b');}box(.55,.018,d*.7,-w*.22,.92,0,'#2c3330');for(const x of [-w*.22-.14,-w*.22+.14])for(const z of [-.12,.12])cylinder(.08,.08,.012,x,.94,z,'#696d64');box(.46,.02,.34,w*.27,.92,0,'#a6b4ad');box(.025,.29,.025,w*.27,1.06,-.22,'#b5c1bb');box(.025,.025,.19,w*.27,1.2,-.14,'#b5c1bb');}
  else if(o.kind==='wardrobe'){box(w,.1,d,0,.08,0,wood);box(w,1.7,d,0,.95,0,'#c6bca5');for(let x=-w/2+w/3;x<w/2;x+=w/3)box(.01,1.6,.01,x,.95,d/2+.005,'#9c927c');for(let x=-w/3;x<w/2;x+=w/3)box(.022,.23,.022,x,1.05,d/2+.025,'#766b57');}
  else if(o.kind==='plant'){cylinder(w*.36,w*.27,.4,0,.22,0,'#b8a68c');cylinder(w*.31,w*.31,.025,0,.43,0,'#514b34');for(let i=0;i<9;i++){const a=i*2.4,r=w*.28;const l=sphere(w*.25,Math.cos(a)*r,.57+(i%3)*.14,Math.sin(a)*r,i%2?'#658551':'#809864',[.8,1.4,.65]);l.rotation.z=Math.cos(a)*.65;}}
  else if(o.kind==='bath'){box(w,.48,d,0,.28,0,'#edeedf');box(w-.12,.03,d-.12,0,.53,0,'#9cbbba');box(w-.27,.025,d-.28,0,.547,0,'#c8dcd5');box(.025,.2,.025,0,.65,-d*.35,'#8caaa4');}
  else if(o.kind==='sink'){box(w,.64,d,0,.42,0,'#a88f70');box(w+.03,.07,d+.03,0,.78,0,'#eeeeE3');box(w*.65,.02,d*.58,0,.822,.03,'#b1c8c2');box(.023,.22,.023,0,.93,-d*.34,'#8aa59d');box(.023,.023,.15,0,1.03,-d*.23,'#8aa59d');for(const y of [.31,.57])box(w*.5,.025,.025,0,y,d/2+.02,'#4e6459');}
  if(selected){const edges=new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(w+.1,.05,d+.1)),new T.LineBasicMaterial({color:'#c4ed9c'}));edges.position.y=.07;g.add(edges);}
 }
 setZoom(z){this.zoom=Math.max(.4,Math.min(3,z));this.render();}
 fit(){this.zoom=1;this.angle=-.65;this.elevation=.95;this.render();}
 render(){const w=this.host.clientWidth,h=this.host.clientHeight;if(!w||!h)return;this.renderer.setSize(w,h,false);const b=this.b,cx=b.x+b.w/2,cz=b.y+b.d/2,aspect=w/h,sin=Math.abs(Math.sin(this.angle)),cos=Math.abs(Math.cos(this.angle)),projectedW=b.w*cos+b.d*sin,projectedH=(b.w*sin+b.d*cos)*Math.sin(this.elevation)+2*Math.cos(this.elevation),size=Math.max(projectedH*.62,projectedW*.62/aspect,3)/this.zoom,distance=Math.max(b.w,b.d)*3+10;this.camera.left=-size*aspect;this.camera.right=size*aspect;this.camera.top=size;this.camera.bottom=-size;this.camera.far=distance+Math.max(b.w,b.d)*3+50;this.camera.position.set(cx+Math.sin(this.angle)*distance*Math.cos(this.elevation),distance*Math.sin(this.elevation),cz+Math.cos(this.angle)*distance*Math.cos(this.elevation));this.camera.lookAt(cx,.1,cz);this.camera.updateProjectionMatrix();this.renderer.render(this.scene,this.camera);}
}
