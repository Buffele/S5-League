// One movement-sound channel per actor, shared across weapon audio banks.
// 80 ms is the S5 crossfade setting, not a measured native timing.
export const DODGE_SOUND_FADE_SECONDS=.08;
const voices=new WeakMap();

export function playDodgeSound({actor,context,source,output,isActive,onEnded}){
 const previous=voices.get(actor),old=previous?.isActive()?previous:null;
 const now=context.currentTime,envelope=context.createGain(),gain=envelope.gain;
 const entry={source,envelope,isActive,startedAt:now,fadeIn:!!old};
 gain.setValueAtTime(old?0:1,now);
 if(old)gain.linearRampToValueAtTime(1,now+DODGE_SOUND_FADE_SECONDS);
 source.connect(envelope);envelope.connect(output);
 source.onended=()=>{
  if(voices.get(actor)===entry)voices.delete(actor);
  source.disconnect();envelope.disconnect();onEnded();
 };
 source.start();voices.set(actor,entry);
 if(old){
  // A third dodge may arrive during the second's fade-in. Preserve its
  // instantaneous level rather than making it jump back to full volume.
  const oldNow=old.source.context?.currentTime??now;
  const level=old.fadeIn?Math.max(0,Math.min(1,(oldNow-old.startedAt)/DODGE_SOUND_FADE_SECONDS)):1;
  const oldGain=old.envelope.gain;
  oldGain.cancelScheduledValues(oldNow);oldGain.setValueAtTime(level,oldNow);
  oldGain.linearRampToValueAtTime(0,oldNow+DODGE_SOUND_FADE_SECONDS);
  old.source.stop(oldNow+DODGE_SOUND_FADE_SECONDS);
 }
}
