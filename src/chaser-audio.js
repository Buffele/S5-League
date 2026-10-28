import {GameAudio} from './game-audio.js';
const files={role:'change_slaughter',creation:'change_bgm',creationShort:'change_bgm_short',target:'5_target change',normal:'kill_normal_target',bonus:'4_bonus target',start:'round_start',startChaser:'sl_round_start',next:'next_round',death:'death_slaughter',points:'score_count_short',rank:'damage_rank',rank1:'damage_rank_1',rank2:'damage_rank_2',rank3:'damage_rank_3',...Object.fromEntries([1,2,3,4,5].map(i=>['count'+i,'sl_count'+i]))};
// Native files, S5 event binding. Do not label this the original callback timing.
export function createChaserAudio(getAudio){
 const audio=new GameAudio('chaser');audio.files=Object.fromEntries(Object.entries(files).map(([key,name])=>[key,`/assets/s5runtime/chaser/sounds/${name}.ogg`]));
 let stateRef=null,last=0,phase='',count=0,ready=false,loading=false,active=false,disposed=false;
 // Native 9651d0: compare the local account with 10944b0 (Chaser account).
 const startCue=state=>state.chaser==='local'?'startChaser':'start';
 function unlock(){const source=getAudio?.();if(!source?.context||ready||loading||disposed)return;loading=true;audio.context=source.context;audio.setVolume(source.volume??.35);audio.unlock().then(()=>{
  loading=false;ready=true;if(disposed||!active)return;
  audio.play('role');if(stateRef?.bonus)audio.play('target');
  if(stateRef?.phase==='preparation')audio.play(stateRef.round===1?'creation':'creationShort');
  else if(stateRef?.phase==='playing')audio.play(startCue(stateRef));
 }).catch(()=>{loading=false;ready=false;});}
 return {update(state){
  active=true;stateRef=state;unlock();if(ready)audio.setVolume(getAudio?.()?.volume??.35);if(state.eventSerial<last){last=0;phase='';}
  for(const event of state.events||[])if(event.serial>last){
   if(event.type==='role')audio.play('role');
   if(event.type==='target')audio.play('target');
   if(event.type==='kill')audio.play(event.victim===state.chaser?'death':event.bonus?'bonus':'normal');
   if(event.type==='points'&&event.id==='local')audio.play('points');
   if(event.type==='round-end'){
    audio.play('next');const ranked=state.initial.map(id=>state.players.get(id)).sort((a,b)=>b.roundAttackDamage-a.roundAttackDamage),index=ranked.findIndex(p=>p.id==='local');
    if(index>=0&&index<3&&ranked[index].roundAttackDamage>0)audio.play('rank'+(index+1));
   }
  }
  last=state.eventSerial;
  if(phase!==state.phase){phase=state.phase;count=0;if(phase==='playing')audio.play(startCue(state));if(phase==='preparation'&&ready)audio.play(state.round===1?'creation':'creationShort');}
  const next=Math.ceil(state.pause);if(state.phase==='preparation'&&next>=1&&next<=5&&next!==count){count=next;audio.play('count'+next);}
 },stop(){active=false;audio.stop();},reset(){active=false;audio.stop();last=0;phase='';count=0;},dispose(){disposed=true;active=false;audio.stop();audio.gain?.disconnect();}};
}
