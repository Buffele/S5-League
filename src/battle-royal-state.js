// Native rule9:11052E0(kill),11054D0(assist),1105800(suicide).
// XML _eu_gameinfo.x7 declares50 points/10 minutes. Result countdown10s and
// score-limit dispatch come from the reference server, not a live S5Runtime match.
export const BATTLE_ROYAL_RULES=Object.freeze({scoreLimit:50,matchSeconds:600,resultAnnouncementSeconds:10});
export const BATTLE_ROYAL_NATIVE_FIELDS=Object.freeze({
 kills:0xa4,killAssists:0xa8,bonusKills:0xac,bonusKillAssists:0xb0,
 deaths:0xb4,suicides:0xb8,leaderKills:0xbc,leaderKillAssists:0xc0,
 bonusDeaths:0xc4,leaderSuicides:0xc8,leaderAssignments:0xcc,
});

export class BattleRoyalState{
 constructor({participants=['local','bot','bot2'],leaderSelection='local-highest',...options}={}){
  if(!Array.isArray(participants)||participants.length<2||new Set(participants).size!==participants.length||participants.some(id=>typeof id!=='string'||!id))throw Error('Distinct Battle Royal participants required');
  if(!['local-highest','external'].includes(leaderSelection))throw Error('Unknown Battle Royal leader policy');
  this.ids=[...participants];this.leaderSelection=leaderSelection;this.rules={...BATTLE_ROYAL_RULES,...options};
  if(!Number.isSafeInteger(this.rules.scoreLimit)||this.rules.scoreLimit<1||!Number.isFinite(this.rules.matchSeconds)||this.rules.matchSeconds<=0||!Number.isFinite(this.rules.resultAnnouncementSeconds)||this.rules.resultAnnouncementSeconds<0)throw Error('Invalid Battle Royal limits');
  this.reset();
 }
 reset(){
  this.mode='battleroyal';this.players=new Map(this.ids.map(id=>[id,{id,alive:true,score:0,...Object.fromEntries(Object.keys(BATTLE_ROYAL_NATIVE_FIELDS).map(key=>[key,0]))}]));
  this.phase='playing';this.remaining=this.rules.matchSeconds;this.pause=0;this.leader=null;this.winner=null;this.outcome=null;this.playingDelta=0;this.serial=0;this.events=[];
 }
 emit(type,data={}){this.events.push({serial:++this.serial,type,...data});if(this.events.length>64)this.events.shift();}
 setLeader(id){
  if(this.phase!=='playing'||id!==null&&!this.players.has(id))return false;
  // Native10D1200 increments+CC for every received valid account, including
  // repeated designation of the same account. Null clears without a counter.
  if(id!==null)this.players.get(id).leaderAssignments++;
  if(this.leader===id)return true;this.leader=id;this.emit('leader',{id});return true;
 }
 selectLocalLeader(){
  if(this.leaderSelection!=='local-highest')return;
  // Native3061 receives a designated account. Choosing the highest score with
  // stable participant-order ties is a declared local/reference-server policy.
  const first=[...this.players.values()].reduce((best,p)=>p.score>best.score?p:best);
  if(first.id!==this.leader)this.setLeader(first.id);
 }
 eliminate(victimId,killerId=null,{assistId=null,targetKind='avatar'}={}){
  if(this.phase!=='playing'||targetKind!=='avatar')return false;
  const victim=this.players.get(victimId),killer=this.players.get(killerId),assist=this.players.get(assistId);
  if(!victim?.alive||killerId!==null&&(!killer?.alive||killer===victim)||assistId!==null&&(!killer||!assist||assist===killer||assist===victim))return false;
  const leader=this.leader;victim.alive=false;
  let points=0,category;
  if(!killer){
   category=victimId===leader?'leaderSuicides':'suicides';victim[category]++;
   if(victim.score>0)victim.score--; //11058B2 checks signed score>0 before-1.
  }else{
   const killerIsLeader=killerId===leader,victimIsLeader=victimId===leader;
   category=killerIsLeader?'leaderKills':victimIsLeader?'bonusKills':'kills';
   killer[category]++;points=victimIsLeader?5:2;killer.score+=points;
   victim[victimIsLeader?'bonusDeaths':'deaths']++;
   if(assist){assist[killerIsLeader?'leaderKillAssists':victimIsLeader?'bonusKillAssists':'killAssists']++;assist.score++;}
  }
  this.emit('kill',{victim:victimId,killer:killerId,assist:assistId,category,points,leader});
  // Reference suicide does not produce a new3061 notification. Leave its
  // designation intact until a kill or an explicit external notification.
  if(killer){this.selectLocalLeader();if([...this.players.values()].some(p=>p.score>=this.rules.scoreLimit))this.finish('score-limit');}
  return true;
 }
 respawn(id){
  const p=this.players.get(id);if(this.phase!=='playing'||!p||p.alive)return false;
  p.alive=true;this.emit('respawn',{id});return true;
 }
 finish(reason='time-limit'){
  if(this.phase!=='playing')return false;
  this.outcome=reason;this.phase='result-countdown';this.pause=this.rules.resultAnnouncementSeconds;this.emit('finishing',{reason});
  if(this.pause===0)this.completeResult();return true;
 }
 completeResult(){
  // S5 local individual result policy. Original-server winner/tie handling is
  // unverified; the reference's winner-team field is a protocol placeholder.
  const ranked=[...this.players.values()].sort((a,b)=>b.score-a.score);
  this.winner=ranked[0].score===ranked[1].score?null:ranked[0].id;this.phase='result';this.pause=0;this.playingDelta=0;
  this.emit('result',{winner:this.winner,reason:this.outcome});
 }
 tick(dt){
  if(!Number.isFinite(dt)||dt<0)throw Error('Invalid Battle Royal delta');this.playingDelta=0;
  if(this.phase==='result')return null;
  let transition=null;
  if(this.phase==='playing'){
   const elapsed=Math.min(dt,this.remaining);this.remaining=Math.max(0,this.remaining-elapsed);this.playingDelta=elapsed;dt-=elapsed;
   if(this.remaining>0)return null;this.finish('time-limit');transition=this.phase==='result'?'result':'finishing';
  }
  if(this.phase==='result-countdown'){
   this.pause=Math.max(0,this.pause-dt);this.playingDelta=0;
   if(this.pause===0){this.completeResult();return 'result';}
  }
  return transition;
 }
 nativeCounters(id){const p=this.players.get(id);return p?Object.fromEntries(Object.entries(BATTLE_ROYAL_NATIVE_FIELDS).map(([key,offset])=>[offset,p[key]])):null;}
}
