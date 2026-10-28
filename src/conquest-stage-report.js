// Native EAD180/EAD2F0 requests2029/2030, F01D30/F1D130 and reference
// ArrayWithIntPrefixSerializer<ArcadeScoreSyncReqDto>. No server ACK assumed.
export function decodeConquestStageReport(id,bytes,{maxParticipants=4}={}){
 if(![2029,2030].includes(id)||!(bytes instanceof Uint8Array)||!Number.isInteger(maxParticipants)||maxParticipants<1||maxParticipants>4)throw Error('Invalid Conquest stage report contract');
 if(bytes.byteLength<4)throw Error('Truncated Conquest report prefix');
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),count=view.getInt32(0,true);
 if(count<0||count>maxParticipants||bytes.byteLength!==4+count*20)throw Error('Conquest report count/length mismatch');
 const scores=[];const seen=new Set();
 for(let i=0;i<count;i++){
  const offset=4+i*20,accountId=view.getBigUint64(offset,true);
  if(accountId<=0n||accountId>0xffffffffffffn||seen.has(accountId))throw Error('Invalid/duplicate Conquest report account');
  seen.add(accountId);scores.push({accountId,opaque1:view.getInt32(offset+8,true),opaque2:view.getInt32(offset+12,true),damageTotal:view.getInt32(offset+16,true)});
 }
 return {id,kind:id===2029?'client-stage-clear-report':'client-stage-failed-report',scores,serverAccepted:false};
}
