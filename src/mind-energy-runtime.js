export const MIND_ENERGY_DIRECTIONS=Object.freeze(['front','rightFront','right','rightBack','back','leftBack','left','leftFront']);

export const MIND_ENERGY_PROFILE=Object.freeze({
  family:'mind-energy',variant:'classic',itemKey:2060001,weaponType:11,
  idle:'00029',
  run:Object.freeze(Object.fromEntries(MIND_ENERGY_DIRECTIONS.map((direction,index)=>[direction,['00008','00011','00012','00015','00013','00014','00010','00009'][index]]))),
  attack:Object.freeze({begin:'H0000',hold:'H0001',lower:'H0002'}),
  capacity:20,reserve:60,rateOfFireMs:500,moveSpeedRate:.9,attackMoveSpeedRate:.9,range:3000,
});

export function createMindEnergyState(){
  return {weapon:'mind-energy',profile:MIND_ENERGY_PROFILE,phase:'idle',phaseMs:0,cooldownMs:0,ammo:MIND_ENERGY_PROFILE.capacity,serial:0,lastPulse:null};
}

export function advanceMindEnergyState(state,dtMs,input={},events=[]){
  if(!(dtMs>=0&&Number.isFinite(dtMs)))throw Error('Invalid Mind Energy delta');
  state.phaseMs+=dtMs;
  state.cooldownMs=Math.max(0,state.cooldownMs-dtMs);
  if(!input.attackHeld||state.ammo<=0){
    if(state.phase!=='idle')events.push(state.ammo<=0?'empty':'attackEnd');
    state.phase='idle';state.phaseMs=0;return events;
  }
  if(state.phase==='idle'){state.phase='attackBegin';state.phaseMs=0;events.push('attackStart');}
  else if(state.phase==='attackBegin'&&state.phaseMs>=200){state.phase='attackHold';state.phaseMs-=200;events.push('attackHold');}
  if(state.cooldownMs<=0){
    state.ammo--;state.serial++;state.cooldownMs=state.profile.rateOfFireMs;
    state.lastPulse=Object.freeze({weapon:state.weapon,serial:state.serial,kind:'ally-heal-lock',range:state.profile.range,ammo:state.ammo});
    events.push('pulse');
  }
  return events;
}

export function mindEnergyMotionSample(state,direction='front',moving=false){
  if(!MIND_ENERGY_DIRECTIONS.includes(direction))throw Error(`Unknown Mind Energy direction ${direction}`);
  if(state.phase==='attackBegin')return {clip:state.profile.attack.begin,lower:state.profile.attack.lower,loop:false,time:state.phaseMs/1000,speed:state.profile.attackMoveSpeedRate,restartKey:`begin-${state.serial}`};
  if(state.phase==='attackHold')return {clip:state.profile.attack.hold,lower:state.profile.attack.hold,loop:true,time:state.phaseMs/1000,speed:state.profile.attackMoveSpeedRate,restartKey:`hold-${state.serial}`};
  if(moving){const clip=state.profile.run[direction];return {clip,lower:clip,loop:true,speed:state.profile.moveSpeedRate,restartKey:'move'};}
  return {clip:state.profile.idle,loop:true,speed:1,restartKey:'idle'};
}
