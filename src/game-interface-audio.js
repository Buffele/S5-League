import {createInterfaceAudio,resolveInterfaceAudio} from './interface-audio.js';

// The DOM adapter supplies authenticated button callbacks; S5's lobby supplies
// explicitly adapted presentation cues. The first accepted click can unlock
// the existing GameAudio context;
// hover never creates/resumes a context or queues a cue for later playback.
export function createGameInterfaceAudio({getAudio,audioSettings,createPlayer=createInterfaceAudio,fetchImpl=globalThis.fetch}={}){
 if(typeof getAudio!=='function'||typeof audioSettings?.get!=='function'||typeof audioSettings?.subscribe!=='function')throw TypeError('Actual game audio/settings accessors required');
 let player=null,context=null,disposed=false,status='idle',revision=0,epoch=0;
 const getSfxGain=()=>audioSettings.get('sfx').linearGain;
 const unsubscribe=audioSettings.subscribe(()=>player?.applyVolume());
 const clear=()=>{player?.dispose();player=null;context=null;};
 const snapshot=()=>({status,revision,player:player?.snapshot()??null,contextState:context?.state??null,nativeCompared:false});
 return Object.freeze({
  snapshot,
  async notify(event){
   if(disposed)return {status:'disposed'};
   const token=epoch;
   const cue=resolveInterfaceAudio(event);if(cue.status!=='mapped')return cue;
   const audio=getAudio();let requestedContext=audio?.context;
   if((event.kind==='native-base-button'&&event.nativeCallback==='974910'&&event.mouseButton===0)||(event.kind==='s5-lobby-presentation'&&event.phase==='click')){
    if(typeof audio?.unlockContext!=='function')return {status:'blocked',reason:'game-audio-context-unavailable'};
    try{
     // GameAudio initializes context synchronously before its first await.
     // Bind this gesture to that context, allowing a weapon object to change
     // while still sharing it, but never transferring a late click elsewhere.
     const unlocking=audio.unlockContext();requestedContext=audio.context;await unlocking;
    }catch(error){
     if(disposed)return {status:'disposed'};
     if(token!==epoch||getAudio()?.context!==requestedContext)return {status:'cancelled'};
     status='blocked';revision++;return {status,reason:'game-audio-context-unlock-failed',error:String(error?.message??error)};
    }
   }
   if(disposed)return {status:'disposed'};
   if(token!==epoch)return {status:'cancelled'};
   const current=getAudio()?.context;
   if(current!==requestedContext)return {status:'cancelled'};
   if(!current||current.state!=='running'){status='blocked';revision++;return {status,reason:'game-audio-context-not-running'};}
   if(context!==current){clear();context=current;player=createPlayer({context,getSfxGain,fetchImpl,resolveUrl:track=>'/assets/s5runtime/interface-audio/'+track.path,isCurrent:()=>!disposed&&context===current&&getAudio()?.context===current});}
   const currentPlayer=player,result=await currentPlayer.notify(event);
   if(!disposed&&token===epoch&&player===currentPlayer&&getAudio()?.context===current){status=result.status;revision++;}
   return result;
  },
  stop(reason='s5-ui-lifecycle-cancel'){if(disposed)return;epoch++;player?.stop(reason);status='idle';revision++;},
  dispose(){if(disposed)return;disposed=true;epoch++;unsubscribe();clear();status='disposed';revision++;},
 });
}
