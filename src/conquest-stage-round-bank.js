import {CONQUEST_SOURCE_DATA} from './conquest-source-data.js';
import {ConquestWaveSchedule} from './conquest-wave-schedule.js';
import {conquestRoundPhase} from './conquest-stage-progress.js';

export const CONQUEST_STAGE_SOURCE=Object.freeze({xmlSha256:'240b82e71c822f5b8514e13354d4cfd34cb9cd0f9dbe8827bf3bf8621a2ab1cf',rowsSha256:'dcaf99f1e353e3dd7e6b229644ec3d573778b9e8a1a4bcd560c53a88626e4864',expectedCounts:Object.freeze([48,15,40,1,59,47,58,57])});
const owners=new WeakMap(),roundOwners=new WeakMap();
export async function prepareConquestStageRoundBank({rows=CONQUEST_SOURCE_DATA.waveRows,isHost}={}){
 if(typeof isHost!=='boolean'||!Array.isArray(rows))throw Error('Explicit host role and authenticated source rows required');
 const encoded=new TextEncoder().encode(JSON.stringify(rows)),digest=await globalThis.crypto.subtle.digest('SHA-256',encoded),hash=[...new Uint8Array(digest)].map(v=>v.toString(16).padStart(2,'0')).join('');
 if(hash!==CONQUEST_STAGE_SOURCE.rowsSha256)throw Error('Conquest stage source identity changed');
 const copied=JSON.parse(new TextDecoder().decode(encoded)),bank={},rounds=new Map();let disposed=false;
 function live(){if(disposed)throw Error('Disposed source stage round bank');}
 function record(round){live();const r=roundOwners.get(round);if(r?.bank!==bank)throw Error('Actual owned source round required');return r;}
 for(let rawRoundIndex=0;rawRoundIndex<8;rawRoundIndex++){
  const roundRows=copied.filter(r=>Number(r.round)-1===rawRoundIndex),expectedCount=roundRows.reduce((sum,r)=>Number(r.monster_key)!==0?(sum+Number(r.monster_increase))|0:sum,0);
  if(expectedCount!==CONQUEST_STAGE_SOURCE.expectedCounts[rawRoundIndex])throw Error('Source expected count changed');
  const firstSpawn=roundRows.find(r=>Number(r.monster_key)!==0),round=Object.freeze({rawRoundIndex,sourceRound:rawRoundIndex+1,expectedCount});
  rounds.set(rawRoundIndex,round);roundOwners.set(round,{bank,rows:roundRows,timer:{updates:0,durationMs:Number(firstSpawn.recall_time)>>>0,elapsedMs:0,paused:false},schedule:null});
 }
 Object.assign(bank,{
  kind:'conquest-source-stage-round-bank',nativeReady:false,
  readRound(rawRoundIndex){live();if(!Number.isInteger(rawRoundIndex)||rawRoundIndex<0||rawRoundIndex>0xffffffff)throw Error('Source raw DWORD round key required');return rounds.get(rawRoundIndex)??null;},
  // A21730 draws rand()%4 once. The caller supplies the observed/qualified
  // selection; this module does not substitute a new PRNG.
  startRound(round,{recallSelection}={}){const r=record(round);if(!Number.isInteger(recallSelection)||recallSelection<0||recallSelection>3)throw Error('Explicit source recall selection0..3 required');if(r.schedule)r.schedule.reset({recallSelection});else r.schedule=new ConquestWaveSchedule({rows:r.rows,round:round.sourceRound,recallSelection,isHost});},
  tickRound(round,deltaMs){const r=record(round);if(!r.schedule)throw Error('Start actual source round before tick');const events=r.schedule.step(deltaMs),phaseCode=conquestRoundPhase(r.timer,deltaMs);return {events,phaseCode};},
  snapshotRound(round){const r=record(round);return {round,timer:{...r.timer},started:r.schedule!==null,records:r.schedule?.records.map(v=>({elapsedMs:v.elapsedMs,frames:v.frames,paused:v.paused,emitted:v.emitted}))??null};},
  dispose(){if(disposed)return;disposed=true;for(const round of rounds.values())roundOwners.delete(round);rounds.clear();owners.delete(bank);},
 });owners.set(bank,true);return Object.freeze(bank);
}
export function assertConquestStageRoundBank(bank){if(!owners.has(bank))throw Error('Actual live authenticated stage round bank required');return bank;}
