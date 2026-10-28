// Native A1C410/A22190 timing consumer. This emits source spawn requests;
// it does not create NPCs, choose a winner, or replace the native AI/map.
export class ConquestWaveSchedule{
 constructor({rows,round,recallSelection,isHost}){
  if(!Array.isArray(rows)||!Number.isInteger(round)||round<1||typeof isHost!=='boolean')throw Error('Explicit Conquest source rows, round and host role required');
  this.rows=rows.filter(row=>Number(row.round)===round).map(row=>({...row}));
  if(!this.rows.length)throw Error('Conquest source round absent');
  this.round=round;this.isHost=isHost;
  for(const row of this.rows)for(const field of ['recall_time','monster_key','monster_increase','recall1','recall2','recall3','recall4','team'])if(!Number.isInteger(Number(row[field]))||Number(row[field])<0||Number(row[field])>0xffffffff)throw Error(`Invalid Conquest source ${field}`);
  this.reset({recallSelection});
 }
 reset({recallSelection}={}){
  // A21730 samples rand()%4 ONCE per round. Caller supplies an observed or
  // explicitly seeded0..3; no substituted PRNG or participant-count inference.
  if(!Number.isInteger(recallSelection)||recallSelection<0||recallSelection>3)throw Error('Conquest recall selection must be explicit0..3');
  this.recallSelection=recallSelection;this.records=this.rows.map(raw=>({raw,elapsedMs:0,frames:0,paused:false,emitted:false}));
 }
 step(deltaMs){
  if(!Number.isInteger(deltaMs)||deltaMs<0||deltaMs>0x7fffffff)throw Error('Native Conquest delta must be integer milliseconds');
  const events=[];
  for(const [index,record] of this.records.entries()){
   const raw=record.raw,delay=Number(raw.recall_time)>>>0;
   if(record.emitted||record.elapsedMs>delay||record.paused)continue;
   record.frames=(record.frames+1)>>>0;record.elapsedMs=(record.elapsedMs+deltaMs)>>>0;
   // A1C410 tests elapsed<=deadline; equality does not fire. One emission
   // occurs on the first integer tick crossing, never once per remaining tick.
   if(record.elapsedMs<=delay)continue;
   record.emitted=true;
   const sourceEvent=Number(raw.event_type)!==-1&&Number(raw.string_event)!==-1;
   events.push({index,round:this.round,elapsedMs:record.elapsedMs,raw:{...raw},
    sourceEvent:sourceEvent?{type:Number(raw.event_type),stringId:Number(raw.string_event)}:null,sound:raw.sound_event||null,
    spawn:!this.isHost||Number(raw.monster_key)===0?null:{monsterKey:Number(raw.monster_key),count:Number(raw.monster_increase)&255,
     recallIndex:this.recallSelection,spawnIndex:Number(raw[`recall${this.recallSelection+1}`])&255,team:Number(raw.team)&255,
     waypointCandidates:[['simple_waypoint',0],['normal_waypoint',1],['difficult_waypoint',2]].filter(([key])=>Number(raw[key])!==0).map(([,value])=>value)}});
  }
  return events;
 }
}
