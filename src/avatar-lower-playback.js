// Independent lower playback is opt-in. Existing weapon samples retain their
// previous looping/restart policy when they provide no explicit lower key.
export function playAvatarLowerChannel(player,sample,{bodyRestart=false,previousKey=null}={}){
 const explicit=sample.lowerRestartKey!==undefined&&sample.lowerRestartKey!==null;
 const restart=explicit?previousKey!==sample.lowerRestartKey:sample.lower?false:bodyRestart&&!sample.loop;
 const action=player.play((sample.lower||sample.clip)+':lower',{
  ...sample,channel:'lower',loop:sample.lowerLoop??(sample.lower?true:sample.loop),
  fade:sample.lowerFade??sample.fade,restart,speed:sample.lowerSpeed??sample.speed,
 });
 return {action,key:explicit?sample.lowerRestartKey:null};
}
