// Source gates and body-state selection, independent of CFly timing.
export const S5RUNTIME_FLYING_BODY_VTABLE=0x13b6eb4;
export function resolveS5RuntimeFlyingBodySubstate({activeBodyStateVtable,actorByte6c,flyState,animationIndex}={}){
 if(activeBodyStateVtable!==S5RUNTIME_FLYING_BODY_VTABLE)return {eligible:false,reason:'CSkillFlyState-not-confirmed'};
 if(actorByte6c!==0)return {eligible:false,reason:actorByte6c===undefined?'actor-byte6c-required':'native-body-tick-gated'};
 let bodySubstate=4;
 if([0,2,4,5].includes(flyState))bodySubstate=1;
 if(flyState===1)bodySubstate=0;
 if(flyState===3&&animationIndex===0)bodySubstate=2;
 if(flyState===3&&animationIndex===1)bodySubstate=3;
 return {eligible:bodySubstate!==4,bodySubstate,reason:bodySubstate===4?'native-body-substate-unconfigured':'source-supported-candidate',nativeReady:false};
}
