// Current native Sigma factories 855510,855d20,856920,8571a0,8574f0.
// Named DEMON_SWORD in the executable; weapon type38 in the capture/Lua.
// Entries7/8 are left short/long;12/13 are right short/long RELEASE.
export const SIGMA_BLADE_INPUT_TABLES=Object.freeze({
 normal:Object.freeze([
  {short:{kind:'light',combo:1,afterMs:400},long:{kind:'light',combo:1,afterMs:400},right:{kind:'heavy',combo:0,afterMs:400}},
  {right:{kind:'heavy',combo:0,afterMs:500}},
  {},{},
 ]),
 transformed:Object.freeze([
  {short:{kind:'light',combo:1,afterMs:610},long:{kind:'strong',combo:0,afterMs:610}},
  {short:{kind:'light',combo:2,afterMs:700},long:{kind:'strong',combo:0,afterMs:700}},
  {long:{kind:'strong',combo:0,afterMs:900}},
  {},
 ]),
});

export function sigmaBladeInputTransition(attack,input,dtMs){
 if(attack?.weapon!=='sigmablade')return null;
 const changing=['heavy','transform'].includes(attack.kind);
 const table=changing?{short:{kind:'light',combo:0,afterMs:20,directFromMs:101},long:{kind:'strong',combo:0,afterMs:20,directFromMs:101}}:
  attack.kind==='light'?SIGMA_BLADE_INPUT_TABLES[(attack.transformed??attack.profile?.transformed)?'transformed':'normal'][attack.comboIndex]:null;
 if(!table)return null;
 const requests=[['short',input.lightShort],['long',input.lightLong],['right',input.heavyReleased]];
 attack.sigmaQueuedInputs??={};attack.sigmaConsumedInputs??={};
 let direct=null;
 for(const [key,pressed] of requests){
  const target=table[key];if(!pressed||!target||attack.sigmaConsumedInputs[key])continue;
  if(attack.timeMs<=target.afterMs){attack.sigmaConsumedInputs[key]=true;attack.sigmaQueuedInputs[key]=target;}
  else if(attack.timeMs>=(target.directFromMs??target.afterMs+1)){attack.sigmaConsumedInputs[key]=true;direct=target;}
 }
 // CActor pendingState is overwritten in dispatch order (518b20). Native
 // range_tick uses strict elapsed > threshold; later inputs are direct.
 let queued=null;
 for(const [key,target] of Object.entries(attack.sigmaQueuedInputs))if(attack.timeMs+dtMs>target.afterMs){queued=target;delete attack.sigmaQueuedInputs[key];}
 return queued??direct;
}

export const SIGMA_BLADE_TRANSFORM_RULES=Object.freeze({minimumEnableSp:20,spendSp:0,cooldownMs:1500,toggleAt:'entry',
 source:{enter:'0x6583f0',canEnter:'0x658130',spCheck:'0x659f00',lua:'StandardSigmaBladeWeaponChange'}});

export function sigmaBladeTransformPermission({transformed=false,lastTransformMs=-Infinity,nowMs=0,sp=0,infiniteEnergy=false}={}){
 const p=SIGMA_BLADE_TRANSFORM_RULES;
 // CanEnter's cooldown rejection only applies to an already transformed
 // Sigma. Its SP helper tests the minimum only while the form is normal.
 if(transformed&&!(nowMs>lastTransformMs+p.cooldownMs))return {allowed:false,reason:'cooldown'};
 if(!transformed&&!infiniteEnergy&&sp<p.minimumEnableSp)return {allowed:false,reason:'sp'};
 return {allowed:true,reason:null};
}

export function sigmaBladeTransformEntry(options={}){
 if(!sigmaBladeTransformPermission(options).allowed)return null;
 return {previousTransformed:!!options.transformed,transformed:!options.transformed,
  lastTransformMs:options.nowMs??0,spendSp:SIGMA_BLADE_TRANSFORM_RULES.spendSp};
}
