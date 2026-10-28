import {Controller} from './controller.js';
const sync=fn=>typeof fn==='function'&&fn.constructor.name==='Function';

// This is absence of an active Shield in the known main presentation, not a
// port of melee/Shield intersection. Re-read across every consumer callback.
export function conquestInactiveMainShieldCollection(controller,query){
 if(arguments.length===1)query=controller.sourceShieldQuery;
 if(controller.sourceShieldQuery!==query||controller.s5runtimeShieldBodyState||controller.s5runtimeSkill?.itemKey!==null||controller.s5runtimeSkill?.active||controller.s5runtimeSkill?.shield?.active)return false;
 if(!query)return !controller.s5runtimeShieldActorProfile;
 if(query.policy!=='source-compatible-local-owner-false'||query.requesterSlot1c4!==false||!sync(query.getCandidates))return false;
 const read=query.getCandidates,candidates=read.call(query);
 return controller.sourceShieldQuery===query&&query.getCandidates===read&&query.policy==='source-compatible-local-owner-false'&&query.requesterSlot1c4===false&&!controller.s5runtimeShieldBodyState&&controller.s5runtimeSkill?.itemKey===null&&!controller.s5runtimeSkill?.active&&!controller.s5runtimeSkill?.shield?.active&&Array.isArray(candidates)&&candidates.length===0;
}

// The player class profile survives unequip. Its154 belongs to that actual
// owner, not to Conquest's shadow constructor defaults. State B0/size and rule12
// side remain separately owned source fields. Unknown actor modes stay closed.
export function readConquestConfiguredPlayerActorFlags(controller){
 if(!(controller instanceof Controller))throw Error('Actual Conquest Controller actor required');
 const profile=controller.s5runtimeShieldActorProfile;if(!profile)return null;
 if(!conquestInactiveMainShieldCollection(controller)||profile!==controller.s5runtimeShieldActorProfile||profile.sourceClass!=='13C1C14'||typeof profile.protected154!=='boolean'||!Number.isSafeInteger(profile.revision)||profile.revision<0)throw Error('Current inactive configured Conquest player actor flag owner required');
 // No invented action-state ID: this reads only the actor-owned flags. The
 // chosen Conquest state's actual B0 is combined by its existing recipient.
 const context=Controller.prototype.readS5RuntimeShieldActorContext.call(controller,{currentStateExists:false});
 if(controller.s5runtimeShieldActorProfile!==profile||context.accepted!==true||context.actorId!==profile.actorId||context.profileRevision!==profile.revision||context.actorSlot3c!==false||context.actorSlot1c4!==false||context.actorSlot128!==false||context.actorSlot4c!==false||typeof profile.protected154!=='boolean')throw Error('Current neutral typed Conquest actor flag context required');
 return {profile,revision:profile.revision,actor154:profile.protected154};
}
