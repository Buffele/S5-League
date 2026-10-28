// Source contract: work/rocket-launcher-recovery/source-contract.json.
// Native observations verify1-round magazine,1000ms recovery and secondary
// cancellation before2500ms preload. HP scaling and body timing remain open.
export const ROCKET_SOURCE=Object.freeze({
 runUpper:{front:'RL004',leftFront:'RL005',left:'RL006',rightFront:'RL007',right:'RL008',back:'RL009',leftBack:'RL010',rightBack:'RL011'},
 runLower:{front:'00008',leftFront:'00009',left:'00010',rightFront:'00011',right:'00012',back:'00013',leftBack:'00014',rightBack:'00015'},
 actionLower:{front:'E0008',leftFront:'E0009',left:'E0010',rightFront:'E0011',right:'E0012',back:'E0013',leftBack:'E0014',rightBack:'E0015'}});
const presentation={front:'front',back:'back',rightFront:'leftFront',right:'left',rightBack:'leftBack',leftFront:'rightFront',left:'right',leftBack:'rightBack'};
const mapped=source=>Object.freeze(Object.fromEntries(Object.entries(presentation).map(([key,native])=>[key,source[native]])));
// RL/00008 source root curves have handedness−1; E action legs have+1.
// Convert each at its own boundary, without changing controls or source keys.
export const ROCKET_LAUNCHER=Object.freeze({capacity:1,reserve:5,reloadMs:1000,recoveryMs:1000,primaryChargeMs:2000,secondaryPreloadMs:2500,secondaryChargeMs:3000,power:48,moveRate:.8,runUpper:mapped(ROCKET_SOURCE.runUpper),runLower:mapped(ROCKET_SOURCE.runLower),actionLower:ROCKET_SOURCE.actionLower});
export function createRocketLauncherState(){return {phase:'idle',mode:'primary',timeMs:0,chargeMs:0,ammo:1,reserve:5,serial:0,shotSerial:0,heldLeft:false,heldRight:false,maxCue:false,aimPitch:0,aimTarget:null,pendingShots:[]};}
export function cancelRocketLauncher(s,input={}){s.phase='idle';s.timeMs=0;s.heldLeft=!!input.light;s.heldRight=!!(input.heavyHeld??input.heavy);s.maxCue=false;s.pendingShots.length=0;}
export function advanceRocketLauncher(s,dt,input,events){
 const ms=dt*1000,left=!!input.light,right=!!(input.heavyHeld??input.heavy),pressedLeft=!!input.lightPressed||left&&!s.heldLeft,pressedRight=!!input.heavyPressed||right&&!s.heldRight;
 s.heldLeft=left;s.heldRight=right;s.timeMs+=ms;s.aimPitch=Number.isFinite(input.aimPitch)?input.aimPitch:s.aimPitch;if(input.aimTarget)s.aimTarget={...input.aimTarget};
 if(input.rocketLaunchFrame)s.launchFrame={direction:[...input.rocketLaunchFrame.direction],up:[...input.rocketLaunchFrame.up]};
 if(s.phase==='fire'&&s.timeMs>=1000-1e-7){s.phase='idle';s.timeMs=0;}
 if(s.phase==='reload'&&s.timeMs>=1000-1e-7){const count=Math.min(1-s.ammo,s.reserve);s.ammo+=count;s.reserve-=count;s.phase='idle';s.timeMs=0;events.push('reloadEnd');}
 if(input.reload&&s.phase==='idle'&&s.ammo<1&&s.reserve>0){s.phase='reload';s.timeMs=0;s.serial++;events.push('reloadStart');return;}
 if(s.phase==='idle'&&(pressedLeft||pressedRight)){
  if(!s.ammo){events.push('empty');return;}
  s.mode=pressedRight?'secondary':'primary';s.phase=s.mode==='secondary'?'preload':'charge';s.timeMs=0;s.chargeMs=0;s.maxCue=false;s.serial++;events.push(s.mode==='secondary'?'secondaryLoad':'chargeStart');return;
 }
 if(s.phase==='preload'){
  if(!right){s.phase='idle';s.timeMs=0;s.serial++;events.push('chargeCancel');return;}
  if(s.timeMs>=ROCKET_LAUNCHER.secondaryPreloadMs-1e-7){s.phase='charge';s.chargeMs=s.timeMs-ROCKET_LAUNCHER.secondaryPreloadMs;s.timeMs=s.chargeMs;events.push('chargeStart');}
 }else if(s.phase==='charge')s.chargeMs+=ms;
 if(s.phase==='charge'){
  const duration=s.mode==='secondary'?ROCKET_LAUNCHER.secondaryChargeMs:ROCKET_LAUNCHER.primaryChargeMs;
  if(s.chargeMs>=duration-1e-7&&!s.maxCue){s.maxCue=true;events.push('chargeMax');}
  if(!(s.mode==='secondary'?right:left)){
   s.phase='fire';s.timeMs=0;s.ammo--;s.serial++;s.shotSerial++;
   s.pendingShots.push({id:s.shotSerial,mode:s.mode,count:s.mode==='secondary'?3:1,chargeMs:s.chargeMs,power:48,aimPitch:s.aimPitch,aimTarget:s.aimTarget&&{...s.aimTarget},launchFrame:s.launchFrame&&{direction:[...s.launchFrame.direction],up:[...s.launchFrame.up]}});events.push('shot');
  }
 }
}
export function rocketLauncherPose(s,direction,moving){
 const base={loop:true,speed:1,fade:500/4800,restartKey:s.serial};
 if(s.phase==='idle')return moving?{...base,clip:ROCKET_LAUNCHER.runUpper[direction],lower:ROCKET_LAUNCHER.runLower[direction],fade:2000/4800}:{...base,clip:'RL014'};
 if(s.phase==='reload')return {...base,clip:'RL002',time:s.timeMs/1000,...(moving?{lower:ROCKET_LAUNCHER.runLower[direction]}:{})};
 if(s.phase==='preload')return {...base,clip:'RL024',loop:false,time:s.timeMs/1000,lower:moving?ROCKET_LAUNCHER.actionLower[direction]:'RL024',lowerRateScale:moving?(4000/4800)/.8:1};
 const secondary=s.mode==='secondary',fire=s.phase==='fire',up=fire?(secondary?'RL040':'RL020'):(secondary?'RL030':'RL000'),center=fire?(secondary?'RL041':'RL021'):(secondary?'RL031':'RL001'),down=fire?(secondary?'RL043':'RL023'):(secondary?'RL033':'RL003');
 return {...base,clip:center,loop:!fire,time:fire?Math.min(2,s.timeMs/1000*(secondary?1:2)):s.timeMs/1000,
  aimBlend:{clip:s.aimPitch>=0?up:down,weight:Math.min(1,Math.abs(s.aimPitch)/(Math.PI/2))},lower:moving?ROCKET_LAUNCHER.actionLower[direction]:'RL001',lowerRateScale:moving?(4000/4800)/.8:1};
}
