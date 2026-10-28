import {referenceRifleReserve} from './rifle-ammo-reference.js';
const freezeMap=entries=>Object.freeze(Object.fromEntries(entries));

export const REVOLVER_DIRECTIONS=Object.freeze(['front','rightFront','right','rightBack','back','leftBack','left','leftFront']);

export const REVOLVER_PROFILE=Object.freeze({
  family:'revolver',variant:'classic',itemKey:2010002,weaponType:1,
  idle:'Q0000',
  run:freezeMap(REVOLVER_DIRECTIONS.map((direction,index)=>[direction,['Q0014','Q0017','Q0018','Q0021','Q0019','Q0020','Q0016','Q0015'][index]])),
  runLower:freezeMap(REVOLVER_DIRECTIONS.map((direction,index)=>[direction,['00008','00011','00012','00015','00013','00014','00010','00009'][index]])),
  aim:Object.freeze({up:'Q0001',center:'Q0002',down:'Q0003'}),reload:'Q0004',
  capacity:7,reserve:referenceRifleReserve('revolver'),reloadMs:3000,fireAnimMs:800,rateOfFireMs:1000/1.2,power:30,
  moveSpeedRate:1,attackMoveSpeedRate:.9,accuracy:.08,range:1000,frontOffset:275,
  shot:Object.freeze({kind:'four-ray',powerMultiplier:.25,criticalRate:2.3,
    damageDropoffStart:4000,damageDropoffEnd:8000,minimumDamageRate:.2,
    // StandardRevolver Attack1..4, current archive CRC eb41af7e.
    // Each accepted ray owns this condition; it is not one aggregate Blow.
    push:Object.freeze([120,1125,-5000]),
    directions:Object.freeze([
      Object.freeze([0,0,-1]),Object.freeze([0,-.046188,-1]),
      Object.freeze([.04,.023094,-1]),Object.freeze([-.04,.023094,-1]),
    ])}),
});

export function createRevolverState(){
  return {weapon:'revolver',profile:REVOLVER_PROFILE,phase:'idle',phaseMs:0,cooldownMs:0,
    ammo:REVOLVER_PROFILE.capacity,reserve:REVOLVER_PROFILE.reserve,serial:0,lastShot:null};
}

function beginReload(state,events){
  if(state.phase!=='idle'||state.ammo>=state.profile.capacity||state.reserve<=0)return false;
  state.phase='reload';state.phaseMs=0;state.serial++;events.push('reloadStart');return true;
}

function finishReload(state,events){
  const amount=Math.min(state.profile.capacity-state.ammo,state.reserve);
  state.ammo+=amount;state.reserve-=amount;state.phase='idle';state.phaseMs=0;events.push('reloadComplete');
}

function fire(state,events){
  state.ammo--;state.phase='fire';state.phaseMs=0;state.cooldownMs=state.profile.rateOfFireMs;state.serial++;
  state.lastShot=Object.freeze({weapon:'revolver',serial:state.serial,power:state.profile.power,
    originOffset:state.profile.frontOffset,range:state.profile.range,accuracy:state.profile.accuracy,
    geometry:state.profile.shot,ammo:state.ammo});
  events.push('shot');
}

export function advanceRevolverState(state,dtMs,input={},events=[]){
  if(!(dtMs>=0&&Number.isFinite(dtMs)))throw Error('Invalid revolver delta');
  state.cooldownMs=Math.max(0,state.cooldownMs-dtMs);
  if(state.phase==='reload'){
    state.phaseMs+=dtMs;if(state.phaseMs>=state.profile.reloadMs)finishReload(state,events);
    return events;
  }
  if(state.phase==='fire'){
    state.phaseMs+=dtMs;
    if(state.phaseMs>=state.profile.fireAnimMs){state.phase='idle';state.phaseMs=0;}
  }
  if(state.phase!=='idle')return events;
  if(input.reload){beginReload(state,events);return events;}
  if(input.firePressed||input.fireHeld){
    if(state.ammo<=0){if(input.firePressed)events.push('empty');beginReload(state,events);}
    else if(state.cooldownMs<=0)fire(state,events);
  }
  return events;
}

export function revolverMotionSample(state,direction='front',moving=false){
  if(!REVOLVER_DIRECTIONS.includes(direction))throw Error(`Unknown revolver direction ${direction}`);
  const p=state.profile,base={loop:true,speed:state.phase==='fire'?p.attackMoveSpeedRate:p.moveSpeedRate,fade:.1,restartKey:state.serial};
  if(state.phase==='fire')return {...base,clip:p.aim.center,aim:p.aim,
    lower:moving?p.runLower[direction]:p.idle,loop:false,time:state.phaseMs/1000,fade:.05};
  if(state.phase==='reload')return {...base,clip:p.reload,lower:p.reload,loop:false,time:state.phaseMs/1000};
  if(!moving)return {...base,clip:p.idle};
  return {...base,clip:p.run[direction],lower:p.runLower[direction]};
}
