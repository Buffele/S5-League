import {GRENADE_SOURCE_DATA as source} from './grenade-source-data.js';
const finiteVector=v=>Array.isArray(v)&&v.length===3&&v.every(Number.isFinite);
const f=Math.fround;
const syncPort=port=>typeof port==='function'&&!['AsyncFunction','GeneratorFunction','AsyncGeneratorFunction'].includes(port.constructor?.name);
export function createGrenadeSourceProjectile(spawn,{id,position,velocity,physicsCoefficientPerMs,physicsStepCap,coordinateSpace,physicsPolicy}={}){
 if(spawn?.sourceFunction!=='GrenadeUniqueLaunch'||spawn.sourceFunctionSha256!==source.sourceFunctions.GrenadeUniqueLaunch||spawn.initFunctionSha256!==source.sourceFunctions.GrenadeUniqueInit)throw Error('Authenticated current Grenade spawn required');
 if(id===undefined||!finiteVector(position)||!finiteVector(velocity)||!Number.isFinite(physicsCoefficientPerMs)||physicsCoefficientPerMs<=0||!Number.isFinite(physicsStepCap)||physicsStepCap<=0||coordinateSpace!=='s5runtime-source'||typeof physicsPolicy!=='string'||!physicsPolicy.trim())throw Error('Explicit Grenade source coordinates, velocity, physics coefficient/cap/policy required');
 const storedCoefficient=f(physicsCoefficientPerMs),storedCap=f(physicsStepCap),storedPosition=position.map(f),storedVelocity=velocity.map(f);
 if(!Number.isFinite(storedCoefficient)||storedCoefficient<=0||!Number.isFinite(storedCap)||storedCap<=0||!finiteVector(storedPosition)||!finiteVector(storedVelocity))throw Error('Grenade values must remain finite and positive where required after float32 conversion');
 return {id,spawnSerial:spawn.serial,sourceInitFunctionSha256:source.sourceFunctions.GrenadeUniqueInit,position:storedPosition,velocity:storedVelocity,physicsCoefficientPerMs:storedCoefficient,physicsStepCap:storedCap,physicsPolicy,coordinateSpace,phase:'flight',timerElapsed:0,timerTicks:0,timerDuration:source.sourceProjectileArgs[2],pendingExplosions:[],nativeReady:false};
}
export function advanceGrenadeSourceProjectile(projectile,dtMs,{timerBlocked=false,explosionGateAccepted,explosionGatePolicy,resolveMovement,queryCharacterTrigger}={}){
 if(!Number.isInteger(dtMs)||dtMs<0||dtMs>0xffffffff||typeof timerBlocked!=='boolean'||typeof explosionGateAccepted!=='boolean'||typeof explosionGatePolicy!=='string'||!explosionGatePolicy.trim())throw Error('Explicit uint32 Grenade tick, raw timer gate and explosion-context policy required');
 if((resolveMovement!==undefined&&!syncPort(resolveMovement))||(queryCharacterTrigger!==undefined&&!syncPort(queryCharacterTrigger)))throw Error('Grenade movement/character ports must be synchronous non-generator functions');
 if(projectile.phase!=='flight')return {advanced:false,phase:projectile.phase,nativeReady:false};
 const previous=[...projectile.position],step=Math.min(f(f(dtMs)*projectile.physicsCoefficientPerMs),projectile.physicsStepCap);
 let velocity=[...projectile.velocity];velocity[1]=f(velocity[1]+f(source.sourceProjectileArgs[0]*step));
 const damping=f(1-f(source.sourceDamping[0]*step));
 velocity=velocity.map(value=>f(value*damping));
 const requested=previous.map((value,i)=>f(value+f(velocity[i]*step)));
 if(!Number.isFinite(step)||!finiteVector(velocity)||!finiteVector(requested))throw Error('Grenade scalar step overflowed float32');
 let position=requested;
 const movement={from:previous,to:requested,velocity:[...velocity],coordinateSpace:projectile.coordinateSpace,rawDamping:[...source.sourceDamping],collisionNativeVerified:false};
 if(resolveMovement){
  const resolved=resolveMovement(Object.freeze({...movement,from:Object.freeze([...previous]),to:Object.freeze([...requested]),velocity:Object.freeze([...velocity]),rawDamping:Object.freeze([...source.sourceDamping])}));
  if(!finiteVector(resolved?.position)||!finiteVector(resolved?.velocity)||typeof resolved.policy!=='string'||!resolved.policy.trim())throw Error('Explicit collision resolution vectors and policy required');
  position=resolved.position.map(f);velocity=resolved.velocity.map(f);movement.resolutionPolicy=resolved.policy;
  if(!finiteVector(position)||!finiteVector(velocity))throw Error('Collision resolution overflowed float32');
 }else movement.resolutionPolicy='free-flight-only';
 const descriptor=Object.freeze({id:projectile.id,sourceInitFunctionSha256:projectile.sourceInitFunctionSha256,position:Object.freeze([...position]),velocity:Object.freeze([...velocity]),coordinateSpace:projectile.coordinateSpace});
 const characterReport=queryCharacterTrigger?queryCharacterTrigger(descriptor):{triggered:false,queryPolicy:'not-evaluated',actorQueryNativeVerified:false,nativeReady:false};
 if(typeof characterReport?.triggered!=='boolean'||typeof characterReport.queryPolicy!=='string'||!characterReport.queryPolicy.trim())throw Error('Explicit synchronous Grenade character trigger report required');
 // Commit only after both synchronous ports and their float32 results validate.
 projectile.position=position;projectile.velocity=velocity;
 if(!characterReport.triggered&&!timerBlocked){projectile.timerTicks=(projectile.timerTicks+1)>>>0;projectile.timerElapsed=(projectile.timerElapsed+dtMs)>>>0;}
 const expiryReached=!characterReport.triggered&&!timerBlocked&&projectile.timerElapsed>projectile.timerDuration;
 if((characterReport.triggered||expiryReached)&&explosionGateAccepted){
  projectile.phase='exploded';
  projectile.pendingExplosions.push({projectileId:projectile.id,spawnSerial:projectile.spawnSerial,sourceFunction:'GrenadeUniqueExplosion',sourceFunctionSha256:source.sourceFunctions.GrenadeUniqueExplosion,position:[...projectile.position],coordinateSpace:projectile.coordinateSpace,triggerReason:characterReport.triggered?'character-mode1':'fuse',powerConstant:source.sourceExplosion.powerConstant,radius:source.sourceExplosion.radiusConstant,push:[...source.sourceExplosion.push],damageApplyType:source.sourceExplosion.damageApplyType,damageRates:[...source.sourceExplosion.damageRates],explosionRanges:[...source.sourceExplosion.explosionRanges],explosionGatePolicy,damageApplicationNativeVerified:false,nativeReady:false});
 }
 return {advanced:true,phase:projectile.phase,expiryReached,movement,characterReport,physicsStep:step,fuseSkippedByCharacterTrigger:characterReport.triggered,fuseAlgorithmStaticVerified:true,physicsScalarAlgorithmStaticVerified:true,physicsCoefficientNativeVerified:false,physicsCoefficientCurrentNativeObserved:false,collisionNativeVerified:false,nativeCompared:false,x87ParityVerified:false,nativeReady:false};
}
