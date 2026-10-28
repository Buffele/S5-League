import {Controller} from './controller.js';
import {readConquestConfiguredPlayerActorFlags} from './conquest-player-configured-actor-flags.js';
const descriptor=(nativeClass,vtable,constructor,factory,nativeStateId,shapeSetup=null)=>Object.freeze({nativeClass,vtable,constructor,factory,nativeStateId,width68:Math.fround(.7),height6c:nativeClass==='CDodgeState'?Math.fround(.7):1,constructorHeight6c:1,shapeSetup,slotB0:true,nativeReady:false});
export const CONQUEST_PLAYER_MOBILITY_ATTACK_SOURCE=Object.freeze({
 dodgeLeft:descriptor('CDodgeState',0x13b4468,0x611a70,0x801ba0,11,0x808bb0),
 dodgeRight:descriptor('CDodgeState',0x13b4468,0x611a70,0x801c20,12,0x808f20),
 boundJump:descriptor('CBoundJumpState',0x13b3a58,0x607020,0x801aa0,9)
});
const finiteVector=v=>v&&['x','y','z'].every(k=>Number.isFinite(v[k]));
// Current S5 body owners select distinct source classes. This is an explicit
// adaptation, not execution/observation of native input dispatch.
export function selectConquestPlayerMobilityState(c){
 if(!(c instanceof Controller))throw Error('Actual Controller mobility owner required');
 const active=c.dash>0||c.wallAction;
 if(!active){if(['dash','airdash','wallprepare','walljump','wallfail'].includes(c.state))throw Error('Mobility state has no current body owner');return null;}
 if(c.attack||c.s5runtimeShieldBodyState||c.s5runtimeAnchoringBodyState||c.nativeActorFrameConfiguration||c.nativeJumpDiagnosticContext?.enabled||c.s5runtimeSkillDiagnosticContext?.enabled)throw Error('Mobility body ownership conflicts with another native owner');
 if(c.s5runtimeShieldActorProfile)readConquestConfiguredPlayerActorFlags(c);
 if(c.dash>0){
  const m=c.dashMotion;
  if(!Number.isFinite(c.dash)||c.wallAction||c.state!==(c.grounded?'dash':'airdash')||!m||!['evade','recovery'].includes(m.phase)||c.dashPhase!==m.phase||!Number.isFinite(m.elapsedMs)||m.elapsedMs<0||c.dashElapsedMs!==m.elapsedMs||![-1,1].includes(c.dashSide)||!Number.isFinite(c.dashFacing)||!finiteVector(c.velocity)||!Number.isFinite(c.dashDirection?.x)||!Number.isFinite(c.dashDirection?.z)||c.normalJump||c.jumpRecovery)throw Error('Current source-adapted Dodge body owner/phase required');
  const side=c.dashSide<0?'left':'right';
  return Object.freeze({key:`dodge-${side}-${m.phase}`,stateKey:c.dashSide<0?'dodgeLeft':'dodgeRight',actionOwner:m});
 }
 const w=c.wallAction,states={prepare:'wallprepare',flight:'walljump',fall:'walljump',fail:'wallfail'};
 if(!Object.hasOwn(states,w.phase)||c.state!==states[w.phase]||c.grounded||c.normalJump||c.jumpRecovery||!c.wallJumpAirborne||!Number.isFinite(w.timeMs)||w.timeMs<0||!Number.isFinite(w.normal?.x)||!Number.isFinite(w.normal?.z)||Math.hypot(w.normal.x,w.normal.z)<=0||!finiteVector(w.launch)||!finiteVector(c.velocity)||(w.phase==='fail'&&!c.wallJumpFailed))throw Error('Current source-adapted BoundJump body owner/phase required');
 return Object.freeze({key:`bound-jump-${w.phase}`,stateKey:'boundJump',actionOwner:w});
}

// Dodge explicitly erases normalJump to revoke wall-entry permission. Its
// retained airDashUsed history identifies this return body until landing.
// This named S5 adaptation selects source Jump/Fall shapes from the actual
// ballistic state. Native Dodge returns to Standby; subsequent native input
// dispatch is not asserted by this adapter or its receipts.
export function selectConquestPlayerMobilityReturnState(c){
 if(!(c instanceof Controller))throw Error('Actual Controller mobility owner required');
 if(c.grounded||!c.airDashUsed||c.normalJump||c.jumpRecovery||c.attack||c.wallAction||c.dash>0||c.sprinting)return null;
 if(c.state==='jump'&&c.velocity.y>0)return Object.freeze({key:'dodge-return-jump',stateKey:'jump'});
 if(c.state==='fall'&&c.velocity.y<=0)return Object.freeze({key:'dodge-return-fall',stateKey:'fall'});
 return null;
}
