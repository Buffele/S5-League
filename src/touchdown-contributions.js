// Native strategy13ABEF4:556DF0 records capped HP contributions;556C30
// removes entries older than5000ms;556EF0 ranks the last source at2 and
// others by float32 damage share. Copied-client float entries32/59=.4/2.
// Native equal-share order depends on full peer identities, not S5 names.
const f=Math.fround;
export const TD_CONTRIBUTIONS=Object.freeze({lifetimeMilliseconds:5000,minimumAssistShare:f(.4),finisherRank:f(2)});
export class TouchdownContributions{
 constructor(){this.clock=0;this.records=new Map();}
 advance(dt){this.clock=(this.clock+Math.trunc(dt*1000))>>>0;for(const id of this.records.keys())this.expire(id);}
 expire(victimId){const rows=this.records.get(victimId);if(!rows)return [];const retained=rows.filter(row=>Math.abs(this.clock-row.time)<=TD_CONTRIBUTIONS.lifetimeMilliseconds);if(retained.length)this.records.set(victimId,retained);else this.records.delete(victimId);return retained;}
 record(sourceId,victimId,amount){const rows=this.expire(victimId);rows.push({sourceId,time:this.clock,amount:f(amount)});this.records.set(victimId,rows);}
 clear(victimId){this.records.delete(victimId);}
 select(victimId,finisherId,players){
  const rows=this.expire(victimId),victim=players.get(victimId),killer=players.get(finisherId);
  if(!victim||!killer||killer.team===victim.team||rows.at(-1)?.sourceId!==finisherId)return {assistantId:null,tieUnverified:false};
  let total=f(0);const sums=new Map();
  for(const row of rows){total=f(total+row.amount);sums.set(row.sourceId,f((sums.get(row.sourceId)??f(0))+row.amount));}
  if(!(total>0))return {assistantId:null,tieUnverified:false};
  const ranked=[...sums].filter(([id])=>id!==finisherId&&id!==victimId&&players.get(id)?.team===killer.team)
   .map(([id,amount])=>({id,share:f(amount/total)})).sort((a,b)=>b.share-a.share);
  const first=ranked[0];
  if(!first||first.share<=TD_CONTRIBUTIONS.minimumAssistShare)return {assistantId:null,tieUnverified:false};
  // Native ordered-tree ties need the original peer-key binding. Do not
  // silently replace that binding with lexical names or registration order.
  if(ranked[1]?.share===first.share)return {assistantId:null,tieUnverified:true,ambiguousIds:ranked.filter(row=>row.share===first.share).map(row=>row.id)};
  return {assistantId:first.id,tieUnverified:false};
 }
}
