const f=Math.fround,boolean=(value,label)=>{if(typeof value!=='boolean')throw Error('Actual source '+label+' required');return value;},byte=(value,label)=>{if(!Number.isInteger(value)||value<0||value>255)throw Error('Actual source '+label+' byte required');return value;};
const vector=value=>{if(!Array.isArray(value)||value.length!==3||value.some(v=>!Number.isFinite(v)||!Number.isFinite(f(v))))throw Error('Current native Rook aura XYZ required');return value.map(f);};

// B7D740 retains only CMonster, virtual44, actor35B and equal identity-team
// bytes. This stage cannot infer35B from HP, immune, DP or material appearance.
export function conquestRookAuraCandidateFilter(candidate,{auraTeamByte}={}){
 const monster=boolean(candidate?.isCMonster,'CMonster class identity'),eligible=boolean(candidate.eligible44,'virtual44'),suffer=boolean(candidate.canSufferDefenseAura35B,'actor35B'),team=byte(candidate.teamByte,'actor identity team');byte(auraTeamByte,'aura identity team');
 return monster&&eligible&&suffer&&team===auraTeamByte;
}

// Original100B450 called by B7D4B1..B7D695: positions are actor7C feet,
// not capsule centers or sphere contact points. Equality1000 removes an
// existing condition; it does not add one. These are post-query decisions.
export function conquestRookAuraCandidateDecision({sourcePosition7c,candidatePosition7c,hasCondition100,radius=1000}={}){
 const a=vector(sourcePosition7c),b=vector(candidatePosition7c),has=boolean(hasCondition100,'condition0x100 membership'),r=f(radius);
 if(!Number.isFinite(r)||r<0)throw Error('Current finite Rook aura radius required');const d=b.map((v,i)=>f(v-a[i])),squared=f(f(f(d[0]*d[0])+f(d[1]*d[1]))+f(d[2]*d[2])),distance=f(Math.sqrt(squared));
 const action=distance<r?(has?null:'add'):(has?'remove':null);
 return Object.freeze({action,distance,inside:distance<r,hasCondition100:has,sourcePredicateQualified:true,completeCandidateQueryQualified:false,conditionApplicationQualified:false,nativeReady:false});
}
