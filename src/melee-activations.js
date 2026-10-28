// One activation per authored contact, shared by combat and surface effects.
// String events remain compatible with audio/animation consumers. The payload
// keeps its attack alive through the final tick and identifies each contact.
const payloads=new WeakMap();
export function emitMeleeActivation(events,attack,index,atMs){
 if(!payloads.has(events))payloads.set(events,[]);
 payloads.get(events).push({attack,index,atMs});
 events.push('hit');
}
export function meleeActivations(events,attack){
 if(payloads.has(events))return payloads.get(events);
 // Compatibility for diagnostic callers that still supply bare hit events.
 const count=events.filter(event=>event==='hit').length;
 if(!attack||!count)return [];
 const first=Math.max(0,(attack.hits||count)-count);
 return Array.from({length:count},(_,offset)=>({attack,index:first+offset}));
}
export function claimMeleeActivation(attack,index,target){
 attack.contactLedger??=new Map();
 let targets=attack.contactLedger.get(index);
 if(!targets){targets=new Set();attack.contactLedger.set(index,targets);}
 if(targets.has(target))return false;
 targets.add(target);return true;
}
