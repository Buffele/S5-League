// Offline raw-observation timeline checks. Source/profile truth is external.
// Engine dt defines integration samples; absolute counters never replace it.
export function nativeObservationTimeline(observation){
 if(observation?.schema!=='native-actor-tick-observation-draft-v1'||!Array.isArray(observation.tickRows)||!observation.tickRows.length||!Array.isArray(observation.inputEvents))throw new TypeError('Explicit tick observations and input events required');
 let profile,actor,vtable,previousReturn,elapsedMs=0;
 const clock=value=>{
  if(typeof value?.rawValue!=='string'||!(/^(?:0x[0-9a-fA-F]+|[0-9]+)$/.test(value.rawValue))||typeof value.clockProfileRef!=='string'||!value.clockProfileRef)throw new TypeError('Exact nonnegative absolute counter and clock profile required');
  profile??=value.clockProfileRef;
  if(value.clockProfileRef!==profile)throw new Error('Clock domains differ; explicit authenticated mapping required');
  return BigInt(value.rawValue);
 };
 const frames=observation.tickRows.map((row,index)=>{
  if(row.tickIndex!==index)throw new Error('Consecutive selected actor Tick indices required');
  if(!Number.isInteger(row.dtParameterMs)||row.dtParameterMs<1||row.dtParameterMs>33)throw new RangeError('Unsupported engine dt; no split/drop/fraction allowed');
  if(!/^0x[0-9a-fA-F]+$/.test(row.actorPointer??'')||!/^0x[0-9a-fA-F]+$/.test(row.actorVtable??''))throw new TypeError('Explicit actor pointer/vtable required');
  actor??=BigInt(row.actorPointer);vtable??=BigInt(row.actorVtable);
  if(BigInt(row.actorPointer)!==actor||BigInt(row.actorVtable)!==vtable)throw new Error('Selected actor identity discontinuity');
  const entry=clock(row.entryClock),returned=clock(row.returnClock);
  if(returned<entry||(previousReturn!==undefined&&entry<previousReturn))throw new Error('Nonconsecutive or reversed actor call clocks');
  previousReturn=returned;
  const logicalStartSeconds=elapsedMs/1000;elapsedMs+=row.dtParameterMs;
  return {tickIndex:index,dtParameterMs:row.dtParameterMs,logicalStartSeconds,logicalEndSeconds:elapsedMs/1000,absoluteEntryCounter:entry.toString(),absoluteReturnCounter:returned.toString()};
 });
 const unassociatedEvents=[];
 const events=observation.inputEvents.map((event,index)=>{
  const timestamp=clock(event.clock),tick=event.tickAssociation;
  if(tick===null)unassociatedEvents.push(index);
  else if(!Number.isInteger(tick)||tick<0||tick>=frames.length)throw new Error('Event refers to an unobserved Tick');
  // Delivery/commit may occur between calls. An in-Tick consumption claim
  // must actually fall inside its associated selected actor call.
  if(event.kind==='action-consumed'&&tick!==null){const frame=frames[tick];if(timestamp<BigInt(frame.absoluteEntryCounter)||timestamp>BigInt(frame.absoluteReturnCounter))throw new Error('Claimed action consumption outside associated actor Tick');}
  return {...event,absoluteCounter:timestamp.toString()};
 });
 const hasDelivery=events.some(e=>e.kind==='action-delivered'&&e.tickAssociation!==null);
 const hasConsumption=events.some(e=>e.kind==='action-consumed'&&e.tickAssociation!==null);
 return {frames,events,logicalSampleTimesSeconds:[0,...frames.map(f=>f.logicalEndSeconds)],tickDeltasMs:frames.map(f=>f.dtParameterMs),absoluteOriginCounter:frames[0].absoluteEntryCounter,clockProfileRef:profile,unassociatedEvents,inputAssociationComplete:hasDelivery&&hasConsumption&&unassociatedEvents.length===0,nativeReady:false,measurementTruthVerified:false,qualification:'Counter/cadence/association consistency only; source profiles, actual inputs, actor ownership and physical channels still require independent evidence'};
}
