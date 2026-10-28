// Timing ranges from the captured native input tables (2026-09-23), not a new
// current-client capture. Current XML confirms the weapon42 destinations.
export const DEATH_SCYTHE_INPUT_RANGES=Object.freeze({
 first:{7:[{fromMs:0,toMs:499,afterMs:499,targetStateId:47,kind:'light',combo:1},{fromMs:500,toMs:4294967295,afterMs:null,targetStateId:47,kind:'light',combo:1}],
        8:[{fromMs:0,toMs:650,afterMs:650,targetStateId:44,kind:'strong',combo:0},{fromMs:651,toMs:4294967295,afterMs:null,targetStateId:44,kind:'strong',combo:0}]},
 second:{7:[{fromMs:0,toMs:599,afterMs:599,targetStateId:48,kind:'light',combo:2},{fromMs:600,toMs:4294967295,afterMs:null,targetStateId:48,kind:'light',combo:2}]},
 air:{2:[{fromMs:0,toMs:1200,afterMs:1200,targetStateId:5,kind:'normal',combo:0},{fromMs:1201,toMs:4294967295,afterMs:null,targetStateId:5,kind:'normal',combo:0}]},
});
export function deathScytheInitialAction(input,{grounded,energy=Infinity}={}){
 const short=input.lightShort??input.light,long=!!input.lightLong;
 const kind=input.heavy&&grounded?'heavy':short||long?(grounded?(long?'strong':'light'):'air'):null;
 if(!kind)return null;const spCost=kind==='heavy'?20:kind==='air'?10:0;
 return energy>=spCost?{kind,combo:0,spCost}:null;
}
// Same call shape as meleeTransition. This only owns light1/2 and aerial MOVE;
// no transition to strongFollow is inferred from clicks, held buttons or hits.
// Returned kind:'normal' requests state exit, NOT createMeleeAttack('normal').
export function deathScytheInputTransition(attack,input,dtMs){
 if(!attack||!Number.isFinite(dtMs)||dtMs<0)return null;
 //80dfa0: UpperCut binds short7 directly to weapon1 jump45. No long8.
 if(attack.kind==='uppercut')return input.lightShort?{kind:'air',combo:0}:null;
 const key=attack.kind==='light'?(attack.comboIndex===0?'first':attack.comboIndex===1?'second':null):attack.kind==='air'?'air':null;
 const ranges=DEATH_SCYTHE_INPUT_RANGES[key];if(!ranges||attack.scytheInputDispatched)return null;
 const now=Number.isFinite(attack.timeMs)?attack.timeMs:Number.isFinite(attack.time)?attack.time*1000:0,accepted=attack.scytheInputAccepted??(attack.scytheInputAccepted={}),queue=attack.scytheInputQueue??(attack.scytheInputQueue=[]);
 const inputs=[[(!!input.move||Math.hypot(input.x??0,input.z??0)>0),2],[(input.lightShort??input.light),7],[!!input.lightLong,8]];
 // Captured range bounds use integer milliseconds; do not create a dead gap
 // between e.g.499 and500 when S5's frame clock contains fractional ms.
 const inputTimeMs=Math.floor(now);
 for(const [active,id] of inputs){if(!active||accepted[id]||!ranges[id])continue;const matches=ranges[id].filter(r=>inputTimeMs>=r.fromMs&&inputTimeMs<=r.toMs);if(matches.length){accepted[id]=true;queue.push(...matches);}}
 const ready=queue.filter(r=>r.afterMs===null||now+dtMs>r.afterMs);
 if(!ready.length)return null;attack.scytheInputDispatched=true;return {...ready.at(-1),provenance:'native input table capture 2026-09-23; current XML destinations'};
}

export const DEATH_SCYTHE_AIR_TIMERS=Object.freeze({delayChangeStateTAMs:250,timeToStaySkyMs:500,source:'JumpAttackByDeathScythe:SetDelayCngStateTA/SetTimeToStaySky'});
// Explicit bounded policy: Lua proves timer values, not their origin/physics.
// Integrator must opt in to entry-relative hold. This helper never writes
// position/velocity or creates a drop impulse. It splits long frames at the
// source timer so suspended/resumed simulation time cannot depend on FPS.
export function createDeathScytheAirState({policy}={}){
 if(policy!=='arena-entry-relative-hold')throw new TypeError('Choose the explicit Scythe aerial timing policy');
 return {timeMs:0,taReady:false,staySkyEnded:false,active:true,policy,nativeDispatcherVerified:false};
}
export function advanceDeathScytheAirState(state,dtMs,{grounded=false,cancelled=false}={}){
 if(!Number.isFinite(dtMs)||dtMs<0)throw new TypeError('Nonnegative dtMs required');
 if(!state?.active)return {segments:[],events:[],taReady:state?.taReady??false,complete:true};
 if(grounded||cancelled){state.active=false;return {segments:[],events:[grounded?'landed':'cancelled'],taReady:state.taReady,complete:true};}
 const from=state.timeMs,to=from+dtMs,holdEnd=DEATH_SCYTHE_AIR_TIMERS.timeToStaySkyMs,taAt=DEATH_SCYTHE_AIR_TIMERS.delayChangeStateTAMs,segments=[],events=[];
 const cuts=[from,...[taAt,holdEnd].filter(t=>t>from&&t<to),to];
 for(let i=0;i<cuts.length-1;i++)if(cuts[i+1]>cuts[i])segments.push({fromMs:cuts[i],toMs:cuts[i+1],durationMs:cuts[i+1]-cuts[i],suspendVertical:cuts[i]<holdEnd,taReady:cuts[i]>=taAt});
 if(!state.taReady&&to>DEATH_SCYTHE_AIR_TIMERS.delayChangeStateTAMs){state.taReady=true;events.push('ta-ready');}
 if(!state.staySkyEnded&&to>=holdEnd){state.staySkyEnded=true;events.push('stay-sky-ended');}
 state.timeMs=to;return {segments,events,taReady:state.taReady,complete:false,policy:state.policy,nativeDispatcherVerified:false};
}
