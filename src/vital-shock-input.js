// Authenticated current weapon_lua.x7 rows for item 2000065.
// This maps XML binding names, not keyboard gestures or native combo windows.
// The classic item 2000005 has a different, single-attack contract.
export const VITAL_SHOCK_BINDING_ITEM_KEY=2000065;
export const VITAL_SHOCK_ACTION_BINDINGS=Object.freeze({
 left_weak:Object.freeze({kind:'light',weapon:'StandardVitalShock_Attack',animation:'UseWeapon1WeakState_VitalShock'}),
 right_attack:Object.freeze({kind:'rush',weapon:'StandardVitalShock_Dash',animation:'UseWeapon2State_VitalShock'}),
 left_strong1:Object.freeze({kind:'strong',weapon:'StandardVitalShock_Strong',animation:'UseWeapon1StrongState_VitalShock'}),
 left_strong2:Object.freeze({kind:'strongFollow',weapon:'StandardVitalShock_Strong1',animation:'UseWeapon1Strong1State_VitalShock'}),
 left_jump:Object.freeze({kind:'air',weapon:'StandardVitalShock_JumpAttack',animation:'UseWeapon1JumpState_VitalShock'}),
});

export function vitalShockActionFromBinding(binding,{itemKey=VITAL_SHOCK_BINDING_ITEM_KEY}={}){
 if(itemKey!==VITAL_SHOCK_BINDING_ITEM_KEY)throw new RangeError('Vital Shock binding contract requires source item 2000065');
 return Object.hasOwn(VITAL_SHOCK_ACTION_BINDINGS,binding)?VITAL_SHOCK_ACTION_BINDINGS[binding]:null;
}

export const VITAL_SHOCK_INPUT_LIMIT=Object.freeze({
 sourceItemKey:2000065,classicItemKey:2000005,
 nativeGestureGraphVerified:false,
 reason:'XML proves five named action bindings; timing, gesture routing and dash-to-follow eligibility are not established by these rows.',
});

// Commands exposed by S5, kept separate from the authenticated XML above.
// In particular, the follow is requested while Dash still exists (including
// recovery), not by a click after the actor has returned to idle.
export const VITAL_SHOCK_ARENA_CONTROLS='Tap left: strike · hold left: heavy attack · left while airborne: aerial attack · right: rush · left during rush or its recovery: flurry';

export function vitalShockInitialAction(input,{grounded,energy=Infinity,switchRush=false}={}){
 const short=input.lightShort??input.light,long=!!input.lightLong;
 const kind=switchRush||(input.heavy&&grounded)?'rush':short||long?(grounded?(long?'strong':'light'):'air'):null;
 if(!kind)return null;
 const spCost=kind==='strong'?15:kind==='air'?10:0;
 return energy>=spCost?{kind,combo:0,spCost}:null;
}

// This is the existing arena queue policy, NOT a recovered native input graph.
// XML proves left_strong2 exists; the 650 ms threshold is Dash's Lua action
// time, used here as an explicit S5 access window. Neither a hit nor simply
// holding right generates the follow. Changing weapons discards the attack
// object and thus its pending request.
export function vitalShockInputTransition(attack,input,dtMs){
 if(!attack||attack.weapon!=='vitalshock'||!Number.isFinite(dtMs)||dtMs<0)return null;
 if(attack.kind==='rush'&&((input.lightShort??input.light)||input.lightLong))
  attack.queuedMelee={kind:'strongFollow',combo:0,afterMs:attack.profile.actionMs};
 return attack.queuedMelee&&attack.timeMs+dtMs>attack.queuedMelee.afterMs?attack.queuedMelee:null;
}
