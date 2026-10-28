// Static evidence: work/chaser-visuals/audit/native-event-readers.json.
// Setter -> attribute offset -> getter -> animation call.
export const CHASER_ENTITY_CLIPS=Object.freeze({normal:'MD001',attack:'MD002',kill:'MD003',creation:'MD007',creationShort:'MD006',win:'MD009',defeat:'MD008'});
export function createChaserEntityEvents(animation,durations){
 let round=null,owner=null,cursor=0,remaining=0,terminal=null,eventList=null;
 function play(event){const clip=CHASER_ENTITY_CLIPS[event];animation.play(clip,{repeat:event==='normal',restart:true});remaining=event==='normal'?0:durations[clip]??0;}
 return {reset(){round=owner=eventList=null;cursor=remaining=0;terminal=null;},update(dt,state){
  const changed=eventList!==state.events||round!==state.round||owner!==state.chaser||state.eventSerial<cursor;eventList=state.events;
  if(changed){round=state.round;owner=state.chaser;terminal=state.phase==='intermission'?(state.outcome==='chaser-victory'?'win':'defeat'):null;remaining=0;cursor=0;play(terminal||(state.phase==='preparation'?(state.round===1?'creation':'creationShort'):'normal'));}
  remaining=Math.max(0,remaining-dt);
  for(const event of state.events||[]){
   if(event.serial<=cursor)continue;cursor=event.serial;
   if(changed)continue;
   if(event.type==='attack'&&event.id===owner&&state.phase==='playing'&&remaining===0)play('attack');
   if(event.type==='kill'&&event.victim!==owner)play('kill');
   if(event.type==='round-end'){
    terminal=event.outcome==='chaser-victory'?'win':'defeat';
    // S5 ordering preserves the final elimination gesture before the result.
    if(remaining===0||animation.clip!==CHASER_ENTITY_CLIPS.kill)play(terminal);
   }
  }
  if(remaining===0){
   if(terminal){if(animation.clip!==CHASER_ENTITY_CLIPS[terminal])play(terminal);}
   else if(state.phase==='playing'&&animation.clip!==CHASER_ENTITY_CLIPS.normal)play('normal');
  }
 }};
}
