// XML seize_mode_newinfo.x7 and native score consumers1099220/10992A0/
// 1099320/10993E0. Occupancy comes from the match's real actor positions.
// Contest pause, winner selection and respawn are S5 policies;
// Holding score/delay follow seize_mode_newinfo.x7 upkeep. The user confirms
// this reward is team-only; it is not assigned to a native player counter.
// Standard matches enter the shared fifteen-second room-results screen
// immediately, following the user's observed S5Runtime flow. An explicit delay
// remains available for isolated fixtures; no native ten-second delay is known.
export const SIEGE_RULES=Object.freeze({scoreLimit:200,matchSeconds:600,gaugeMaximum:30000,gaugeTickSeconds:1,corePerTick:3000,assistPerTick:1000,captureScore:5,captureAssistScore:1,holdingSeconds:60,holdingScore:10,resultAnnouncementSeconds:0});
export const SIEGE_NATIVE_FIELDS=Object.freeze({kills:0xa4,killAssists:0xa8,healAssists:0xac,opaqueB0:0xb0,opaqueB4:0xb4,opaqueB8:0xb8,opaqueBC:0xbc,captureScore:0xc0,captureAssistScore:0xc4,buffScore:0xc8,captures:0xcc,captureAssists:0xd0,opaqueD4:0xd4,buffs:0xd8});
export class SiegeState{
 constructor({team='alpha',participants=['local','bot','bot2'],pointIds=['local-center'],...options}={}){
  this.people=participants.map((p,i)=>typeof p==='string'?{id:p,team:i===0?team:team==='alpha'?'beta':'alpha'}:{...p});
  if(!['alpha','beta'].includes(team)||this.people.length<2||new Set(this.people.map(p=>p.id)).size!==this.people.length||this.people.some(p=>typeof p.id!=='string'||!p.id||!['alpha','beta'].includes(p.team))||!['alpha','beta'].every(t=>this.people.some(p=>p.team===t)))throw Error('Distinct Siege participants on both teams required');
  if(!Array.isArray(pointIds)||!pointIds.length||new Set(pointIds).size!==pointIds.length||pointIds.some(id=>typeof id!=='string'||!id))throw Error('Distinct explicit Siege point IDs required');
  this.ids=this.people.map(p=>p.id);this.pointIds=[...pointIds];this.rules={...SIEGE_RULES,...options};
  for(const key of ['scoreLimit','gaugeMaximum','corePerTick','assistPerTick','captureScore','captureAssistScore','holdingScore'])if(!Number.isSafeInteger(this.rules[key])||this.rules[key]<1)throw Error('Invalid Siege score/gauge');
  for(const key of ['matchSeconds','gaugeTickSeconds','holdingSeconds'])if(!Number.isFinite(this.rules[key])||this.rules[key]<=0)throw Error('Invalid Siege duration');
  if(!Number.isFinite(this.rules.resultAnnouncementSeconds)||this.rules.resultAnnouncementSeconds<0)throw Error('Invalid Siege result delay');
  this.reset();
 }
 reset(){
  this.mode='siege';this.players=new Map(this.people.map(p=>[p.id,{...p,alive:true,score:0,localDeaths:0,localSuicides:0,penGained:0,experienceGained:0,...Object.fromEntries(Object.keys(SIEGE_NATIVE_FIELDS).map(key=>[key,0]))}]));
  this.points=new Map(this.pointIds.map(id=>[id,{id,owner:null,progress:0,core:null,coreInside:new Set(),assistInside:new Set(),contested:false,heldSeconds:0,captureGeneration:0}]));
  this.holdingScores={alpha:0,beta:0};
  this.teamLedgers={alpha:{objective:0,combat:0},beta:{objective:0,combat:0}};this.scores={alpha:0,beta:0};this.phase='playing';this.remaining=this.rules.matchSeconds;this.pause=0;this.captureClock=0;this.playingDelta=0;this.winner=null;this.outcome=null;this.events=[];this.serial=0;
 }
 emit(type,data={}){this.events.push({serial:++this.serial,type,...data});if(this.events.length>64)this.events.shift();}
 resetGauge(point){const changed=point.progress!==0||point.core!==null;point.progress=0;point.core=null;if(changed)this.emit('gauge-reset',{point:point.id});}
 setPresence(pointId,id,{core=false,assist=false}={}){
  const p=this.players.get(id),point=this.points.get(pointId);if(this.phase!=='playing'||!p?.alive||!point)return false;
  for(const [inside,present]of [[point.coreInside,core],[point.assistInside,assist]])if(present)inside.add(id);else inside.delete(id);
  if(!core&&point.core===id)this.resetGauge(point);return true;
 }
 clearPresence(id){for(const point of this.points.values()){point.coreInside.delete(id);point.assistInside.delete(id);if(point.core===id)this.resetGauge(point);}}
 award(id,field,amount,ledger,points=amount){const p=this.players.get(id);p[field]+=amount;p.score+=points;this.teamLedgers[p.team][ledger]+=points;this.scores[p.team]+=points;}
 captureTick(){
  for(const point of this.points.values()){
   const cores=[...point.coreInside].map(id=>this.players.get(id)).filter(p=>p?.alive),helpers=[...point.assistInside].map(id=>this.players.get(id)).filter(p=>p?.alive);
   point.contested=new Set([...cores,...helpers].map(p=>p.team)).size>1;
   // Source XML has no contest arbitration; the existing reference subset
   // also pauses. Keep this as declared local policy, not a native claim.
   if(point.contested)continue;
   const core=point.core?this.players.get(point.core):cores[0];
   if(!core?.alive||!point.coreInside.has(core.id)||core.team===point.owner){this.resetGauge(point);continue;}
   if(point.core===null)point.core=core.id;
   const assistants=helpers.filter(p=>p.team===core.team&&p.id!==core.id);
   point.progress=Math.min(this.rules.gaugeMaximum,point.progress+this.rules.corePerTick+assistants.length*this.rules.assistPerTick);
   if(point.progress===this.rules.gaugeMaximum){
    point.owner=core.team;point.heldSeconds=0;point.captureGeneration++;this.award(core.id,'captureScore',this.rules.captureScore,'objective');core.captures++;
    for(const p of assistants){this.award(p.id,'captureAssistScore',this.rules.captureAssistScore,'objective');p.captureAssists++;}
    this.emit('capture',{point:point.id,owner:point.owner,core:core.id,assistants:assistants.map(p=>p.id)});this.resetGauge(point);
   }
  }
  this.checkScoreLimit();
 }
 advanceOwnership(dt){
  for(const point of this.points.values()){
   if(!point.owner)continue;
   const previous=Math.floor((point.heldSeconds+1e-9)/this.rules.holdingSeconds);point.heldSeconds+=dt;
   const count=Math.floor((point.heldSeconds+1e-9)/this.rules.holdingSeconds)-previous;
   if(count>0){const points=count*this.rules.holdingScore;this.holdingScores[point.owner]+=points;this.scores[point.owner]+=points;this.emit('holding-score',{point:point.id,team:point.owner,points});}
  }
  this.checkScoreLimit();
 }
 eliminate(victimId,killerId=null,{assistId=null,targetKind='avatar'}={}){
  const victim=this.players.get(victimId),killer=this.players.get(killerId),assist=this.players.get(assistId);
  if(this.phase!=='playing'||targetKind!=='avatar'||!victim?.alive||killerId!==null&&(!killer?.alive||killer===victim||killer.team===victim.team)||assistId!==null&&(!killer||!assist?.alive||assist===killer||assist===victim||assist.team!==killer.team))return false;
  victim.alive=false;victim.localDeaths++;this.clearPresence(victimId);
  if(killer){this.award(killerId,'kills',1,'combat',2);if(assist)this.award(assistId,'killAssists',1,'combat');}
  else victim.localSuicides++;
  this.emit('kill',{victim:victimId,killer:killerId,assist:assistId});this.checkScoreLimit();return true;
 }
 receiveHealAssist(id){const p=this.players.get(id);if(this.phase!=='playing'||!p?.alive)return false;this.award(id,'healAssists',1,'combat');this.emit('heal-assist',{id});this.checkScoreLimit();return true;}
 receiveBuffScore(id,points){const p=this.players.get(id);if(this.phase!=='playing'||!p?.alive||!Number.isSafeInteger(points)||points<0||points>2047)return false;this.award(id,'buffScore',points,'objective');p.buffs++;this.emit('buff-score',{id,points});this.checkScoreLimit();return true;}
 respawn(id){const p=this.players.get(id);if(this.phase!=='playing'||!p||p.alive)return false;p.alive=true;this.emit('respawn',{id});return true;}
 checkScoreLimit(){if(Math.max(this.scores.alpha,this.scores.beta)>=this.rules.scoreLimit)this.finish('score-limit');}
 finish(reason='time-limit'){
  if(this.phase!=='playing')return false;this.phase='result-countdown';this.pause=this.rules.resultAnnouncementSeconds;this.outcome=reason;
  for(const point of this.points.values()){point.coreInside.clear();point.assistInside.clear();this.resetGauge(point);point.contested=false;}
  this.emit('finishing',{reason});if(this.pause===0)this.completeResult();return true;
 }
 completeResult(){this.phase='result';this.pause=0;this.winner=this.scores.alpha===this.scores.beta?null:this.scores.alpha>this.scores.beta?'alpha':'beta';for(const point of this.points.values())point.owner=null;this.emit('result',{winner:this.winner});}
 tick(dt){
  if(!Number.isFinite(dt)||dt<0)throw Error('Invalid Siege delta');this.playingDelta=0;
  while(dt>0&&this.phase!=='result'){
   if(this.phase==='result-countdown'){const elapsed=Math.min(dt,this.pause);dt-=elapsed;this.pause-=elapsed;if(this.pause===0)this.completeResult();continue;}
   const elapsed=Math.min(dt,this.remaining,this.rules.gaugeTickSeconds-this.captureClock);
   this.remaining=Math.max(0,this.remaining-elapsed);this.captureClock+=elapsed;this.playingDelta+=elapsed;dt=Math.max(0,dt-elapsed);
   this.advanceOwnership(elapsed);if(this.phase!=='playing')continue;
   if(this.captureClock>=this.rules.gaugeTickSeconds-1e-9){this.captureClock=0;this.captureTick();}
   if(this.phase==='playing'&&this.remaining===0)this.finish('time-limit');
  }
 }
 // Result full briefing clears A4..D8, then decodes serialized scores. CC/D0/
 // D8 counts are absent from that wire and remain0. Match UI retains its local
 // event ledger; this method projects the native result object's fields.
 nativeCounters(id){const p=this.players.get(id);return p?Object.fromEntries(Object.entries(SIEGE_NATIVE_FIELDS).map(([key,offset])=>[offset,this.phase==='result'&&['captures','captureAssists','buffs'].includes(key)?0:p[key]])):null;}
}
