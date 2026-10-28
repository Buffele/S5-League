// Classic item 2000001. Source calls authenticated in
// tests/fixtures/native/plasma-source-contract.json and
// work/plasma-restoration/effects/source-manifest.json.
export const PLASMA_GHOST_TRAIL = Object.freeze({
  name:'GhostTrail_two_hand_sword_01',startMs:50,endMs:350,
  shape:'Line01',sourceTexture:'image/gi.dds',sceneIndex:0,
});

export function plasmaTrailWindow(attack){
  if(attack?.weapon!=='plasma'||!['light','strong','strongFollow','air'].includes(attack.kind))return false;
  return attack.time>=PLASMA_GHOST_TRAIL.startMs/1000&&attack.time<=PLASMA_GHOST_TRAIL.endMs/1000;
}

const RUSH=Object.freeze({name:'skill_swordman_battack',sound:'stance',at:.5,follow:true});
// The actor-state call is commented out, but StandardPlasmaSwordJumpAttack
// actively declares this sequence at 500 ms. Its extra 5000 argument and
// attachment mode still require native typing. Retain the current S5 follow
// policy; do not reinterpret 5000 as duration or claim exact native placement.
const AIR=Object.freeze({name:'skill_swordman_strike',sound:'power',at:.5,follow:false});
export function plasmaStateCue(attack){
  if(attack?.weapon!=='plasma')return null;
  return attack.kind==='heavy'?RUSH:attack.kind==='air'?AIR:null;
}

// Source SetDamageSequence for the classic attack attributes. This does not
// resolve normal/critical contact priority; that belongs to the combat solver.
export function plasmaContactEffect(attack,{critical=false}={}){
  if(attack?.weapon!=='plasma')return null;
  if(attack.kind==='air')return null; // JUMP / JUMP_CRITICAL: no damage sequence.
  if(critical)return null; // Generic critical explicitly names blank_1sec.
  return attack.kind==='heavy'?'skill_gunner_chargeshot_hit':
    ['light','strong','strongFollow'].includes(attack.kind)?'backattack_sword_s':null;
}
