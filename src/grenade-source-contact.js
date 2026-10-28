import {GRENADE_SOURCE_DATA as source} from './grenade-source-data.js';
export function queryGrenadeSourceCharacterTrigger(projectile,{ownerSlot1c4,queryActors,queryPolicy}={}){
 if(projectile?.sourceInitFunctionSha256!==source.sourceFunctions.GrenadeUniqueInit)throw Error('Authenticated GrenadeUniqueInit projectile required');
 if(projectile.coordinateSpace!=='s5runtime-source'||!Array.isArray(projectile.position)||projectile.position.length!==3||!projectile.position.every(Number.isFinite)||typeof ownerSlot1c4!=='boolean'||typeof queryActors!=='function'||['AsyncFunction','GeneratorFunction','AsyncGeneratorFunction'].includes(queryActors.constructor?.name)||typeof queryPolicy!=='string'||!queryPolicy.trim())throw Error('Explicit Grenade source position, raw owner1c4 and synchronous non-generator actor query policy required');
 const declarations=source.sourceCharacterContact;
 const candidates=queryActors({nativeFunction:declarations.query,center:[...projectile.position],radius:declarations.radius,coordinateSpace:projectile.coordinateSpace,sourceInitFunctionSha256:projectile.sourceInitFunctionSha256});
 if(!Array.isArray(candidates)||candidates.some(actor=>actor?.actorId===undefined||typeof actor.slot1c4!=='boolean'))throw Error('Actor query must return explicit IDs and raw slot1c4 booleans');
 // Native53C0F0 erases equal raw1C4; preserve order and duplicates of the
 // injected native-query candidates. No team/itemType interpretation.
 const acceptedActors=candidates.filter(actor=>actor.slot1c4!==ownerSlot1c4);
 return {triggered:acceptedActors.length>0,acceptedActors,candidateCount:candidates.length,queryPolicy,sourceHandler:declarations.handler,sourceQuery:declarations.query,sourceFilter:declarations.filter,radius:declarations.radius,rawFilterAlgorithmStaticVerified:true,actorQueryNativeVerified:false,nativeReady:false};
}
