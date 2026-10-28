// Phase selector 651340, local actor branch 6518f1..651955.
// Details: work/death-scythe-native/finish-motion.md.
export function deathScytheFinishMotionCommand(transition,{remoteActor=false}={}){
 if(remoteActor||!transition||transition.to!=='finishAttack'||transition.from==='finishAttack')return null;
 return {resetVelocity:{x:0,y:0,z:0}};
}
