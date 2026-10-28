// Optional main QA wiring, absent from normal input flow. Each time advance
// uses the parent's small-step helper, never one large Controller update.
export function installSiegeQA({add,mode,controller,combat,advanceSeconds}){
 const zone=mode.zones[0],at=(actor,dx=0)=>{actor.position={x:zone.x+dx,y:zone.y,z:zone.z};actor.velocity={x:0,y:0,z:0};};
 const start=()=>{mode.reset();combat.setMode('passive');};
 const away=()=>combat.bots.forEach((b,i)=>at(b.actor,12+i*2));
 const solo=()=>{start();away();at(controller);};
 const seed=(team,points)=>{mode.state.scores[team]=points;mode.state.teamLedgers[team].objective=points;const p=[...mode.state.players.values()].find(p=>p.team===team);p.captureScore=points;p.score=points;};
 const capture=()=>{solo();advanceSeconds(10.1);};
 add('Siege : rôle core en cours',()=>{solo();advanceSeconds(3.1);});
 // Explicit arrangement of one allied helper; the ordinary local match
 // currently puts both bots on the opposing team.
 add('Siege : aide alliée en cours',()=>{solo();mode.state.players.get(combat.bots[0].id).team=mode.team;at(combat.bots[0].actor,.8);advanceSeconds(3.1);});
 add('Siege : rôles adverses en cours',()=>{start();at(controller,12);at(combat.bots[0].actor);at(combat.bots[1].actor,.8);advanceSeconds(3.1);});
 add('Siege : relevé effets',()=>{});
 add('Siege : capture réelle',capture);
 add('Siege : bonus +1 s',()=>advanceSeconds(1));
 add('Siege : effets +200 ms',()=>advanceSeconds(.2));
 add('Siege : conservation +60 s',()=>{capture();at(controller,12);advanceSeconds(60.01);});
 add('Siege : ramasser un bonus',()=>{const item=mode.supplies?.snapshot().items.find(i=>i.position);if(!item)throw Error('Wait for the captured point to emit a supply');controller.position={x:item.position[0],y:item.position[1],z:item.position[2]};controller.velocity={x:0,y:0,z:0};mode.step(.008,{});});
 // Explicit geometry fixtures in native-scaled ordinary body coordinates.
 // Zero simulation time holds the same flying item's position for the query;
 // this exercises the real collector, not a native movement/input comparison.
 const pickupApproach=(dx,dz)=>{const item=mode.supplies?.snapshot().items.find(i=>i.position);if(!item)throw Error('Wait for the captured point to emit a supply');controller.position={x:item.position[0]+dx,y:item.position[1],z:item.position[2]+dz};controller.velocity={x:0,y:0,z:0};mode.step(0,{});};
 add('Siege : coin hors portée',()=>pickupApproach(.72,.72));
 add('Siege : approche latérale',()=>pickupApproach(.9,0));
 add('Siege : sortie du point',()=>{solo();advanceSeconds(3.1);at(controller,12);mode.step(.008,{});});
 add('Siege : contestation',()=>{solo();advanceSeconds(3.1);at(combat.bots[0].actor,.8);advanceSeconds(2);});
 add('Siege : aide capture adverse',()=>{start();at(controller,12);at(combat.bots[0].actor);at(combat.bots[1].actor,.8);advanceSeconds(8.1);});
 add('Siege : mort au point',()=>{solo();advanceSeconds(3.1);combat.onFall(controller);});
 add('Siege : réapparaître',()=>advanceSeconds(4.16));
 add('Siege : classement',()=>mode.ui.setRoster(true));
 add('Siege : limite score',()=>{solo();seed(mode.team,mode.state.rules.scoreLimit-5);advanceSeconds(10.1);});
 add('Siege : résultat victoire',()=>{solo();seed(mode.team,mode.state.rules.scoreLimit-5);advanceSeconds(20.1);});
 add('Siege : résultat défaite',()=>{start();const other=mode.team==='alpha'?'beta':'alpha';seed(other,mode.state.rules.scoreLimit-6);at(controller,12);at(combat.bots[0].actor);at(combat.bots[1].actor,.8);advanceSeconds(18.1);});
 add('Siege : timeout égalité',()=>{start();mode.state.remaining=.008;mode.step(.008,{});advanceSeconds(10.01);});
}
