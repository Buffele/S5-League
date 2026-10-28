// Pure consumer of source-established Conquest notifications, without NPC
// production, mission progression or a substitute gameplay loop.
export const CONQUEST_NATIVE_FIELDS=Object.freeze({kills:0xa4,killAssists:0xa8,healAssists:0xac,deaths:0xb0,teamKills:0xb4,teamDeaths:0xb8,suicides:0xbc});
const mask=0xffffffffffffn;
export function conquestPeerType(value){const peer=BigInt(value);if(peer<0n||peer>0xffffffffffffffffn)throw Error('Invalid native LongPeerId');return Number(peer>>48n&7n);}
const identity=value=>BigInt(value)&mask;
const add=(record,key,amount)=>{if(record)record[key]=(record[key]+amount)>>>0;};
export class ConquestNativeLedger{
 constructor(participants){
  if(!Array.isArray(participants)||!participants.length)throw Error('Conquest participants required');
  this.participants=participants.map(p=>({accountId:BigInt(p.accountId),team:p.team}));
  if(new Set(this.participants.map(p=>p.accountId)).size!==participants.length||this.participants.some(p=>p.accountId<=0n||p.accountId>mask||![1,2].includes(p.team)))throw Error('Invalid Conquest participants');
  this.reset();
 }
 reset(){this.players=new Map(this.participants.map(p=>[p.accountId,{...p,total:0,...Object.fromEntries(Object.keys(CONQUEST_NATIVE_FIELDS).map(k=>[k,0]))}]));this.teams=new Map([[1,0],[2,0]]);}
 player(peer){conquestPeerType(peer);return this.players.get(identity(peer));}
 applyKill({killerPeer,victimPeer,assistPeer=null}){
  // 55DC50: only type6 victim reaches Conquest scoring; normal player kills
  // are not treated as objective progress. Network validation belongs upstream.
  if(conquestPeerType(victimPeer)!==6)return false;
  const killer=this.player(killerPeer),victim=this.player(victimPeer),assist=assistPeer===null?null:this.player(assistPeer);
  if(!killer)return false;add(killer,'kills',1);add(killer,'total',2);
  if(assist&&identity(assistPeer)!==identity(killerPeer)){add(assist,'killAssists',1);add(assist,'total',1);}
  this.teams.set(killer.team,(this.teams.get(killer.team)+1)>>>0);add(victim,'deaths',1);return true;
 }
 applyHealAssist(peer){const player=this.player(peer);if(!player)return false;add(player,'healAssists',1);add(player,'total',1);return true;}
 applySuicide(peer){if(conquestPeerType(peer)!==1)return false;const player=this.player(peer);if(!player)return false;add(player,'suicides',1);return true;}
 applyTeamKill({killerPeer,victimPeer}){if(conquestPeerType(victimPeer)!==1)return false;const killer=this.player(killerPeer),victim=this.player(victimPeer);add(killer,'teamKills',1);add(victim,'teamDeaths',1);return !!(killer||victim);}
 extension(peer){
  const player=this.player(peer);if(!player)return null;
  const bytes=new Uint8Array(28),view=new DataView(bytes.buffer);
  Object.keys(CONQUEST_NATIVE_FIELDS).forEach((key,i)=>view.setUint32(i*4,player[key],true));return bytes;
 }
 loadExtension(peer,bytes){
  const player=this.player(peer);if(!player||!(bytes instanceof Uint8Array)||bytes.byteLength!==28)throw Error('Conquest briefing extension must contain28 bytes');
  const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  Object.keys(CONQUEST_NATIVE_FIELDS).forEach((key,i)=>{player[key]=view.getUint32(i*4,true);});
  // Native total is in the common briefing, not computed from these words.
 }
}
