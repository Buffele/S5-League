// Explicit main-game QA only; executes the ordinary combat/controller/pose path.
export function runActorBodyContactQa({combat,controller,graph,animate,action='land',seconds=.9}){
 combat.reset();controller.reset();graph.reset();combat.setMode('passive');combat.enemyInput=()=>({});combat.avatar.group.visible=true;
 const base={...controller.position};controller.facing=0;
 combat.enemy.position={...base,z:base.z+1.59};combat.enemy.facing=Math.PI;
 if(action==='land'||action==='land-edge'){
  controller.position={x:combat.enemy.position.x+(action==='land-edge'?.72:0),y:base.y+2.4,z:combat.enemy.position.z};
  controller.grounded=false;controller.normalJump=true;controller.velocity.y=-2;
 }
 for(let i=0;i<Math.ceil(seconds/.008);i++){
  const events=combat.tick(.008,{facing:0,z:action==='walk'?1:0,...(action==='attack'?{light:i===0,lightShort:i===0}:{}),jump:action==='jump'&&i===0});
  graph.events(events);animate(.008);
 }
 return {action,sex:controller.sex,player:{position:{...controller.position},velocity:{...controller.velocity},grounded:controller.grounded,hp:combat.playerState.hp},
  enemy:{position:{...combat.enemy.position},hp:combat.enemyState.hp},horizontalDistance:Math.hypot(controller.position.x-combat.enemy.position.x,controller.position.z-combat.enemy.position.z),
  heightAboveEnemy:controller.position.y-combat.enemy.position.y,bodyQueryActive:typeof controller.bodyContactQuery==='function'};
}
