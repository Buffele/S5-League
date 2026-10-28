// Player branch7B24A0: current enabled team pools, virtual44, self solver
// exclusion, then solver678/684/690. No damage-target/team-relation filter.
// These are source reader ports, not a mapping from S5 health or teams.
const sync=fn=>typeof fn==='function'&&!['AsyncFunction','AsyncGeneratorFunction','GeneratorFunction'].includes(fn.constructor?.name);
const call=(fn,...args)=>{
 const result=fn(...args);
 if(result&&typeof result.then==='function')throw TypeError('Synchronous player contact readers required');
 return result;
};
const identity=value=>typeof value==='string'&&value.trim().length>0||Number.isSafeInteger(value)&&value>0;
const xyz=value=>Array.isArray(value)&&value.length===3&&value.every(n=>Number.isFinite(n)&&Number.isFinite(Math.fround(n)));
const refuse=reason=>({qualified:false,reason,collection:null,nativeReady:false});

// pool+8 is the protected team ID, not an independent enable switch.
//7B256A reads its byte through4CA260 then tests AL: spectator0 is skipped,
// both observed playing pools1/2 are admitted, without comparing affiliations.
export function nativePlayerContactPoolEnabled({teamId}={}){
 return Number.isInteger(teamId)&&teamId>=0&&teamId<=255?{qualified:true,enabled:teamId!==0}:{qualified:false,reason:'team-id-unqualified'};
}

// Player vtable13AAFDC+44 ->5192B0. actor154 is a decoded protected bool.
// The component1C virtualB0 is deliberately read lazily, as in the client.
// An unknown field is not replaced with !health.dead or model visibility.
export function nativePlayerContactEligibility({actor154,component1CPresent,readComponentB0}={}){
 if(typeof actor154!=='boolean')return {qualified:false,reason:'actor154-unqualified'};
 if(!actor154)return {qualified:true,eligible:false};
 if(typeof component1CPresent!=='boolean')return {qualified:false,reason:'component1c-unqualified'};
 if(!component1CPresent)return {qualified:true,eligible:false};
 if(!sync(readComponentB0))return {qualified:false,reason:'component-b0-unqualified'};
 const eligible=call(readComponentB0);
 return typeof eligible==='boolean'?{qualified:true,eligible}:{qualified:false,reason:'component-b0-unqualified'};
}

export function createNativePlayerContactCollection({source,readTeams,readTeamEnabled,readTeamActors,readEligibility,readSolverId,readSolverShape}={}){
 if(typeof source!=='string'||!source.trim()||![readTeams,readTeamEnabled,readTeamActors,readEligibility,readSolverId,readSolverShape].every(sync))
  throw TypeError('Source evidence and synchronous current player collection readers required');
 return {
  read({sourceSolverId}={}){
   if(!identity(sourceSolverId))throw TypeError('Explicit moving solver identity required');
   const pools=call(readTeams);
   if(pools?.complete!==true||!Array.isArray(pools.teams))return refuse('team-list-unqualified');
   const teams=[];
   for(const team of pools.teams){
    const enabled=call(readTeamEnabled,team);
    if(typeof enabled!=='boolean')return refuse('team-enable-unqualified');
    if(!enabled){teams.push({enabled:false});continue;}
    const list=call(readTeamActors,team);
    if(list?.complete!==true||!Array.isArray(list.actors))return refuse('team-actors-unqualified');
    const actors=[];
    for(const actor of list.actors){
     const gate=call(readEligibility,actor);
     if(gate?.qualified!==true||typeof gate.eligible!=='boolean')return refuse('actor-eligibility-unqualified');
     if(!gate.eligible)continue;
     const solverId=call(readSolverId,actor);
     if(!identity(solverId))return refuse('actor-solver-unqualified');
     if(solverId===sourceSolverId)continue;
     const shape=call(readSolverShape,solverId,actor);
     if(shape?.qualified!==true||!['raw678','raw684','raw690'].every(key=>xyz(shape[key]))||shape.raw690.some(n=>n<=0))return refuse('actor-shape-unqualified');
     actors.push({qualified:true,eligible:true,solverId,...Object.fromEntries(['raw678','raw684','raw690'].map(key=>[key,shape[key].slice()]))});
    }
    teams.push({enabled:true,actorsComplete:true,actors});
   }
   return {qualified:true,collection:{complete:true,teams},nativeReady:false};
  },
  qualification:{source,branch:0x1000,defaultRuntimeActivated:false,nativeReady:false,nativeMovementCompared:false},
 };
}
