// Own one RAF chain, including when a frame synchronously changes floor.
export class FrameLoop {
 constructor(step,{request=callback=>requestAnimationFrame(callback),cancel=id=>cancelAnimationFrame(id),now=()=>performance.now()}={}){this.step=step;this.request=request;this.cancel=cancel;this.now=now;this.running=false;this.id=null;this.generation=0;}
 start(){if(this.running)return;this.running=true;const generation=++this.generation;this.previous=this.now();const frame=now=>{if(!this.running||generation!==this.generation)return;const dt=Math.max(0,(now-this.previous)/1000);this.previous=now;this.step(dt,now);if(this.running&&generation===this.generation)this.id=this.request(frame);};this.id=this.request(frame);}
 stop(){this.running=false;this.generation++;if(this.id!==null)this.cancel(this.id);this.id=null;}
}
