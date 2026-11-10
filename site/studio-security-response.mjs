// One clock drives the demonstration, including seeking and replaying it.
// These are simulated reactions; no phone, camera or physical motor is connected.
export const securityMessage='Individu non identifié dans le jardin à droite.';
export function securityResponse(time){
 const t=Math.max(0,Math.min(60,Number(time)||0)),k=Math.max(0,Math.min(1,(t-24)/8));
 return {time:t,detected:t>=6,alert:t>=12,phones:t>=12,hub:t>=13,speaking:t>=14&&t<22,announced:t>=22,
  shutterOpening:100*(1-k*k*(3-2*k)),closing:t>=24&&t<32,
  floor:t<22?'overview':t<35?'etage':t<44?'rdc':'overview',message:securityMessage};
}
export function applySecurityResponse(state,time){
 const f=securityResponse(time);state.alertResponse=f;state.presence='home';state.security='disarmed';
 state.gate={position:0,target:0};
 for(const s of Object.values(state.shutters))Object.assign(s,{position:f.shutterOpening,target:time>=24?0:100});
 return f;
}
