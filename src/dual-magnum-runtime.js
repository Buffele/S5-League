import {DUAL_MAGNUM_SOURCE as source} from './dual-magnum-data.js';
const presentation={front:'front',rightFront:'leftFront',right:'left',rightBack:'leftBack',back:'back',leftBack:'rightBack',left:'right',leftFront:'rightFront'};
const map=m=>Object.freeze(Object.fromEntries(Object.entries(presentation).map(([key,native])=>[key,m[native]])));
export const DUAL_MAGNUM_ARENA_POLICY=Object.freeze({name:'one-source-action-per-press-cancel-release',repeat:false,cancelRemainingOnRelease:true,actionDurationMs:{normal:500,afterDash2:650,afterDash3:800,jump:800,rolling:700},nativeFactoryTimingVerified:false,nativeReady:false});
export const DUAL_MAGNUM=Object.freeze({...source,run:map(source.run),runLower:map(source.runLower),reloadLower:map(source.reloadLower),capacity:source.ability.magazine_capacity,reloadMs:2000,moveSpeedRate:source.ability.move_speed_rate,attackMoveSpeedRate:source.ability.attack_move_speed_rate,nativeReady:false});
export function createDualMagnumState(){return {weapon:'dualmagnum',profile:DUAL_MAGNUM,phase:'idle',action:null,timeMs:0,clockMs:0,ammo:24,capacity:24,reserve:Infinity,serial:0,shotSerial:0,pendingShots:[],scheduledShots:[],pendingCommands:[],held:false,aimPitch:0,aimTarget:null,blendWeight:0,activationPending:false,arenaPolicy:DUAL_MAGNUM_ARENA_POLICY};}
export function cancelDualMagnum(s,{held=s.held}={}){s.phase='idle';s.action=null;s.timeMs=0;s.activationPending=false;s.scheduledShots.length=0;s.pendingShots.length=0;s.pendingCommands.length=0;s.held=!!held;}
export function beginDualMagnumAction(s,action='normal',context={}){
 const a=source.actions[action];if(!a)throw new RangeError('Unknown Dual Magnum source action');
 if(action!=='normal'&&context.diagnostic!==true)throw new Error('Special Dual Magnum routing/physics requires explicit diagnostic context');
 if(action==='rolling'&&!['left','right','back'].includes(context.rollingSide))throw new RangeError('Explicit source rolling side required');
 if(s.phase==='reload'||s.ammo<=0)return false;
 s.phase='fire';s.action=action;s.timeMs=0;s.serial++;s.activationPending=true;s.context={...context};s.scheduledShots=a.attacks.map(attack=>({atMs:attack.atMs,attack}));
 s.pendingCommands.length=0;if(a.movement.jumpPower||a.movement.useMoveBox)s.pendingCommands.push({kind:'dual-magnum-source-movement-request',action,source:{...a.movement},applied:false,nativeReady:false});
 return true;
}
export function advanceDualMagnum(s,dt,input={},events=[]){
 if(!Number.isFinite(dt)||dt<0)throw new RangeError('Finite nonnegative Dual Magnum delta required');
 const ms=dt*1000,pressed=!!input.lightPressed||!!input.light&&!s.held;s.held=!!input.light;s.clockMs+=ms;
 if(input.aimTarget)s.aimTarget={...input.aimTarget};if(Number.isFinite(input.dualBlendWeight))s.blendWeight=Math.max(0,Math.min(1,input.dualBlendWeight));
 if(s.phase==='reload'){s.timeMs+=ms;if(s.timeMs>=DUAL_MAGNUM.reloadMs){const n=Math.min(s.capacity-s.ammo,s.reserve);s.ammo+=n;if(Number.isFinite(s.reserve))s.reserve-=n;s.phase='idle';s.timeMs=0;events.push('reloadComplete');}return events;}
 if(input.reload&&s.ammo<s.capacity&&s.reserve>0){cancelDualMagnum(s);s.phase='reload';s.serial++;events.push('reloadStart');return events;}
 // A shared Controller cancel sets phase idle. Dispose the owned schedule as
 // well; an old delayed attack must not survive a dash/switch/reset.
 if(s.phase!=='fire'&&s.activationPending){s.scheduledShots.length=0;s.pendingCommands.length=0;s.activationPending=false;}
 if(s.phase==='fire'&&s.action==='normal'&&!s.held&&!input.lightPressed){cancelDualMagnum(s);return events;}
 if(pressed&&s.phase==='idle'){if(!s.ammo){events.push('empty');return events;}beginDualMagnumAction(s);}
 if(s.phase!=='fire')return events;
 s.timeMs+=ms;
 while(s.scheduledShots.length&&s.scheduledShots[0].atMs<=s.timeMs+1e-7&&s.ammo>0){const {attack:a}=s.scheduledShots.shift();s.ammo-=a.consumeAmmo;s.shotSerial++;const shot={weapon:'dualmagnum',serial:s.shotSerial,delayRemaining:0,sourceAction:s.action,actionSerial:s.serial,sourceAttackId:a.id,sourceAtMs:a.atMs,sourceAttribute:a.attribute,power:a.power,sourceProjectileOffsets:a.projectileOffsets.map(p=>[...p]),offsetSemanticsVerified:false,blastBindings:source.attributes[a.attribute].blastBindings.map(b=>({...b,sequences:[...b.sequences]})),aimTarget:s.aimTarget?{...s.aimTarget}:null,arenaPolicy:s.arenaPolicy.name,nativeReady:false};s.pendingShots.push(shot);s.lastShot=shot;events.push('shot');}
 if(!s.ammo){s.scheduledShots.length=0;s.activationPending=false;}
 if(s.timeMs>=s.arenaPolicy.actionDurationMs[s.action]){s.phase='idle';s.action=null;s.activationPending=false;s.scheduledShots.length=0;s.pendingCommands.length=0;}
 return events;
}
export function dualMagnumPose(s,direction='front',moving=false,sex='male'){
 if(!(direction in presentation)||!['male','female'].includes(sex))throw new RangeError('Dual Magnum direction/sex required');
 const base={loop:true,speed:1,fade:500/4800,restartKey:s.serial};
 if(s.phase==='reload'){const lower=moving?DUAL_MAGNUM.reloadLower[direction]:source.reload;return {...base,clip:source.reload,lower,loop:false,time:Math.min(s.timeMs/2000,1)*source.durationTicks[sex][source.reload]/4800,lowerLoopRequested:true,lowerRestartRequested:!moving,lowerRateScale:moving?(source.durationTicks[sex][lower]/4800)/.8:1};}
 if(s.phase==='fire'){
  const a=source.actions[s.action];if(!a)throw new Error('Dual Magnum active action absent');
  if(s.action==='rolling'){const pair={left:['DU021','DU022'],right:['DU023','DU024'],back:['DU019','DU020']}[s.context.rollingSide];return {...base,clip:pair[s.context.rollingDelay===true?1:0],loop:false,time:s.timeMs/1000,fade:50/4800};}
  const [blend,clip]=a.upperBlends[0],lower=a.lower[moving?presentation[direction]:'normal'];return {...base,clip,aimBlend:{clip:blend,weight:s.blendWeight},lower,loop:false,speed:a.animationSpeed,lowerLoopRequested:moving&&s.action!=='jump',lowerRestartRequested:!moving||s.action==='jump',lowerRateScale:moving&&s.action!=='jump'?(source.durationTicks[sex][lower]/4800)/.8:1,time:s.timeMs/1000,fade:250/4800,sourceBlendWeightPolicy:'explicit-or-neutral-arena'};
 }
 return moving?{...base,clip:DUAL_MAGNUM.run[direction],lower:DUAL_MAGNUM.runLower[direction],fade:1000/4800}:{...base,clip:source.idle};
}
