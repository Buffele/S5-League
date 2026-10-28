import {createRevolverState,advanceRevolverState} from './revolver-runtime.js';
import {REVOLVER_PRESENTATION as mapping} from './revolver-data.js';
export function createRevolverGameplay(){return {...createRevolverState(),capacity:7,pendingShots:[],shotSerial:0,held:false,aimPitch:0,aimTarget:null,muzzle:'Revolver_Fire_Dummy'};}
export function advanceRevolverGameplay(s,dt,input,events){
 const pressed=!!input.lightPressed||!!input.light&&!s.held;s.held=!!input.light;
 if(Number.isFinite(input.aimPitch))s.aimPitch=Math.max(-Math.PI/2,Math.min(Math.PI/2,input.aimPitch));
 if(input.aimTarget)s.aimTarget={...input.aimTarget};
 const start=events.length;
 advanceRevolverState(s,dt*1000,{firePressed:pressed,fireHeld:s.held,reload:input.reload},events);
 if(events.slice(start).includes('shot'))s.shotSerial++;
}
export function revolverGameplayPose(s,direction,moving){
 const base={loop:true,speed:1,fade:.1,restartKey:s.serial};
 if(s.phase==='reload')return {...base,clip:'Q0004',loop:false,time:s.phaseMs/1000,...(moving?{lower:mapping.runLower[direction]}:{})};
 if(s.phase==='fire')return {...base,clip:'Q0002',loop:false,time:s.phaseMs/1000,
  aimBlend:{clip:s.aimPitch>=0?'Q0001':'Q0003',weight:Math.min(1,Math.abs(s.aimPitch)/(Math.PI/2))},
  ...(moving?{lower:mapping.fireLower[direction]}:{})};
 return moving?{...base,clip:mapping.run[direction],lower:mapping.runLower[direction]}:{...base,clip:'Q0000'};
}
