import * as T from './vendor/three.module.min.js';

// A transparent, orthographic 3D layer. Its pixel origin is shared with the
// architectural image so camera pan/zoom never drifts away from the floor.
export class AvatarRenderer{
 constructor(host){
  this.host=host;this.actors=new Map();this.scene=new T.Scene();
  this.camera=new T.OrthographicCamera(-500,500,500,-500,.1,2000);this.camera.position.z=1000;
  this.renderer=new T.WebGLRenderer({alpha:true,antialias:true});this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));this.renderer.setClearColor(0,0);this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.3;
  this.renderer.domElement.setAttribute('aria-label','Avatars 3D de démonstration');this.renderer.domElement.setAttribute('role','img');host.append(this.renderer.domElement);
  this.scene.add(new T.HemisphereLight(0xe8f3ff,0x6a7666,2.5));const sun=new T.DirectionalLight(0xffe8c5,3.5);sun.position.set(-200,350,500);this.scene.add(sun);const rim=new T.DirectionalLight(0xb3d7ff,2);rim.position.set(300,150,-200);this.scene.add(rim);
  this.geometry={sphere:new T.SphereGeometry(1,20,16),capsule:new T.CapsuleGeometry(1,1,6,14),ring:new T.TorusGeometry(.43,.013,8,56),disc:new T.CircleGeometry(.44,40)};this.materials=new Map();
 }
 mat(color){if(!this.materials.has(color))this.materials.set(color,new T.MeshStandardMaterial({color,roughness:.67}));return this.materials.get(color);}
 ellipsoid(parent,color,position,scale){const mesh=new T.Mesh(this.geometry.sphere,this.mat(color));mesh.position.set(...position);mesh.scale.set(...scale);parent.add(mesh);return mesh;}
 limb(parent,color,x,y,length,radius){const pivot=new T.Group();pivot.position.set(x,y,0);parent.add(pivot);const mesh=new T.Mesh(this.geometry.capsule,this.mat(color));mesh.scale.set(radius,length/3,radius);mesh.position.y=-length/2;pivot.add(mesh);return pivot;}
 build(info){
  const root=new T.Group(),body=new T.Group();body.rotation.x=.53;root.add(body);
  const ring=new T.Mesh(this.geometry.ring,new T.MeshBasicMaterial({color:info.alert?'#f98680':'#b7e9ff',transparent:true,opacity:.8,depthTest:false}));ring.scale.y=.38;ring.position.y=.015;root.add(ring);
  const shadow=new T.Mesh(this.geometry.disc,new T.MeshBasicMaterial({color:'#14202b',transparent:true,opacity:.18,depthWrite:false}));shadow.scale.set(1.1,.36,1);shadow.position.z=-.5;root.add(shadow);
  const bones=[];const skin=info.look?'#bd8e6f':'#e5bda0',hair=info.look?'#44312b':'#574639';
  if(info.kind==='dog'){
   this.ellipsoid(body,'#b09066',[0,.37,0],[.27,.22,.48]);this.ellipsoid(body,'#c5a678',[0,.61,.36],[.22,.24,.23]);this.ellipsoid(body,'#d7bf96',[0,.54,.56],[.15,.10,.19]);this.ellipsoid(body,'#302c27',[0,.56,.71],[.06,.05,.035]);
   for(const x of [-.16,.16]){this.ellipsoid(body,'#866546',[x,.59,.32],[.10,.23,.075]);this.ellipsoid(body,'#181f22',[x*.65,.66,.55],[.025,.028,.025]);for(const z of [-.30,.3]){const leg=this.limb(body,'#a1845d',x,.35,.32,.065);leg.position.z=z;bones.push(leg);}}
   const tail=this.ellipsoid(body,'#a1845d',[0,.5,-.48],[.055,.22,.065]);tail.rotation.x=-.8;bones.push(tail);
  }else{
   const child=info.kind==='child';this.ellipsoid(body,info.color,[0,1.13,0],[.25,.35,.15]);this.ellipsoid(body,'#354657',[0,.82,0],[.23,.13,.14]);
   for(const x of [-.12,.12]){const leg=this.limb(body,'#405165',x,.84,.65,.085);bones.push(leg);this.ellipsoid(leg,'#e8e7dc',[0,-.65,.055],[.10,.075,.16]);}
   for(const x of [-.28,.28]){const arm=this.limb(body,info.color,x,1.36,.42,.075);bones.push(arm);this.ellipsoid(arm,skin,[0,-.45,0],[.072,.105,.07]);}
   this.ellipsoid(body,skin,[0,1.5,0],[.08,.10,.085]);this.ellipsoid(body,skin,[0,1.74,0],[.19,.23,.18]);this.ellipsoid(body,hair,[0,1.87,-.015],[.20,.13,.18]);
   if(info.look){this.ellipsoid(body,hair,[0,1.68,-.14],[.19,.23,.085]);this.ellipsoid(body,hair,[.13,1.79,-.13],[.095,.12,.08]);}
   for(const x of [-.07,.07]){this.ellipsoid(body,'#f4f0e7',[x,1.77,.158],[.035,.028,.02]);this.ellipsoid(body,'#27323a',[x,1.77,.175],[.013,.018,.008]);}
   this.ellipsoid(body,skin,[0,1.71,.184],[.033,.045,.035]);this.ellipsoid(body,'#986854',[0,1.64,.162],[.042,.009,.009]);
   if(child)body.scale.set(.76,.74,.76);
  }
  root.add(body);this.scene.add(root);return {root,body,ring,shadow,bones,signature:[info.kind,info.color,info.look,info.alert].join('|')};
 }
 remove(id){const a=this.actors.get(id);if(!a)return;this.scene.remove(a.root);a.ring.material.dispose();a.shadow.material.dispose();this.actors.delete(id);}
 render(list,time,floor,animate){
  const w=this.host.clientWidth,h=this.host.clientHeight;if(!w||!h)return;const aspect=w/h;
  const zoom=Number(this.host.parentElement.parentElement.style.getPropertyValue('--camera-zoom'))||1,ratio=Math.min(3,Math.ceil(devicePixelRatio*zoom));
  if(ratio!==this.pixelRatio){this.pixelRatio=ratio;this.renderer.setPixelRatio(ratio);}
  if(this.w!==w||this.h!==h){this.w=w;this.h=h;this.renderer.setSize(w,h,false);this.camera.left=-500*aspect;this.camera.right=500*aspect;this.camera.updateProjectionMatrix();}
  const alive=new Set(list.map(n=>n.id));for(const id of this.actors.keys())if(!alive.has(id))this.remove(id);
  list.forEach((info,index)=>{
   const signature=[info.kind,info.color,info.look,info.alert].join('|');let actor=this.actors.get(info.id);if(actor&&actor.signature!==signature){this.remove(info.id);actor=null;}if(!actor){actor=this.build(info);this.actors.set(info.id,actor);}
   const scale=floor==='overview'?27:38;actor.root.position.set((info.x-500)*aspect,500-info.y,index*3);actor.root.scale.setScalar(scale);
   actor.body.rotation.y=info.heading||0;const gait=animate&&info.moving?Math.sin(time*2+index)*(info.motion??1):0;
   actor.body.position.y=animate?Math.sin(time*3+index)*.012:0;
   actor.bones.forEach((bone,i)=>{if(info.kind==='dog'&&i===4)bone.rotation.z=animate?Math.sin(time*2)*.1:0;else bone.rotation.x=gait*(i%2?1:-1)*(i<2?.31:.25);});
   actor.ring.material.opacity=info.selected?.98:info.alert?.8:.55;actor.ring.material.color.set(info.alert?'#fb7977':info.selected?'#c7baff':'#9dd8ff');
  });this.renderer.render(this.scene,this.camera);
 }
 dispose(){for(const id of [...this.actors.keys()])this.remove(id);for(const g of Object.values(this.geometry))g.dispose();for(const m of this.materials.values())m.dispose();this.renderer.dispose();this.renderer.domElement.remove();}
}
