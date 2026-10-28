import {meleeRuntimeContact,meleeRuntimeIronBootsBlowPush} from './melee-runtime.js';
import {createNativeMeleePush,advanceNativeMeleePush} from './native-melee-push.js';
import {applyNativePushCollision} from './native-push-collision.js';
import {frontRangedRecordDirection} from './ranged-victim-push.js';
import {SCN_SCENE_SCALE} from './s5runtime-coordinates.js';

// Reviewed FRONT attributes and default InitAttack1 true/true source-position
// branch only. Selected Katana Push/Blow pairs additionally keep their existing
// Blow reaction/velocity path. Iron Boots' selected reverse pair additionally
// preserves its zero-valued Blow; zero parameters do not suppress its reaction.
// Evidence: capture-expansion-v2/source-melee-push-batch-20261025/.
export const SOURCE_MELEE_PUSH_CONTACTS=Object.freeze([
 'counter/light/0/0','counter/light/0/1','counter/light/1/0','counter/light/2/0','counter/air/0/0',
 'katana/light/0/0','katana/light/1/0','katana/light/1/1','katana/air/0/0','katana/air/0/1','katana/air/0/2',
 'twinblade/light/1/1','ironboots/light/1/0','ironboots/air/0/2',
]);
const qualified=new Set(SOURCE_MELEE_PUSH_CONTACTS);
export const SOURCE_MELEE_MIXED_PUSH_CONTACTS=Object.freeze([
 'katana/heavy/0/0/partial','katana/heavy/0/0/full','katana/heavy/0/1/full',
]);
const mixedQualified=new Set(SOURCE_MELEE_MIXED_PUSH_CONTACTS);
export const SOURCE_MELEE_REVERSE_MIXED_PUSH_CONTACTS=Object.freeze(['ironboots/light/0/1']);
const reverseQualified=new Set(SOURCE_MELEE_REVERSE_MIXED_PUSH_CONTACTS);

// Registry and neutral actor inputs were observed at the two quiet endpoints
// of a Counter/Plasma trial: push-actor-readonly-v1/observations.json. S5 keeps
// these bindings fixed; other equipment, active filters and its collision solver
// are not certified equivalent to native actors. Keep readiness false.
export const SOURCE_MELEE_PUSH_POLICY=Object.freeze({
 timeFactor:0.0010000000474974513,
 actorPolicy:Object.freeze({horizontalBlocked:false,horizontalMultiplier:1,maxDistance:180}),
 additionalAcceleration:0,accelerationRate:0,nativeReady:false,
});

export function sourceMeleePushConditions(attack,sourceWeapon){
 const weapon=attack.weapon??sourceWeapon,kind=attack.kind??attack.type,index=attack.contactIndex??Math.max(0,(attack.hits??1)-1);
 const key=`${weapon}/${kind}/${attack.comboIndex??0}/${index}`;
 const pure=qualified.has(key),mixed=mixedQualified.has(`${key}/${attack.fullCharge?'full':'partial'}`),reverse=reverseQualified.has(key);
 if(!pure&&!mixed&&!reverse)return null;
 const contact=meleeRuntimeContact({...attack,weapon});
 if(reverse){const pair=meleeRuntimeIronBootsBlowPush({...attack,weapon},contact);return pair?[pair.push]:null;}
 const conditions=contact?.conditions??contact?.sourceConditions??(contact?.condition?[contact.condition]:[]);
 if(pure)return conditions.length&&conditions.every(c=>c.type==='push')?conditions:null;
 //574900 clones each declaration in order. Push initializes its own scalar;
 // the following Blow writes velocity once. Do not add that velocity to Push
 // or discard the first declaration merely because the last one is Blow.
 if(conditions.length!==2||conditions[0].type!=='push'||conditions[1].type!=='blow'||contact.condition?.type!=='blow')return null;
 return [conditions[0]];
}

export function createSourceMeleeVictimPushes({weapons=null}={}){
 let entries=[];
 return {
  add(attack,source,actor){
   if(weapons&&!weapons.includes(attack.weapon??source.weapon))return false;
   const conditions=sourceMeleePushConditions(attack,source.weapon);if(!conditions)return false;
   const native=v=>({x:v.x/SCN_SCENE_SCALE,y:v.y/SCN_SCENE_SCALE,z:v.z/SCN_SCENE_SCALE});
   const direction=frontRangedRecordDirection(native(source.position),native(actor.position),{x:Math.sin(actor.facing),y:0,z:Math.cos(actor.facing)});
   // Construct the full contact before publishing entries. Invalid declarations
   // cannot leave a partly added group; independent accepted hits still stack.
   const additions=conditions.map(c=>({actor,serial:actor.resetSerial,condition:createNativeMeleePush(c.arguments,direction,{...SOURCE_MELEE_PUSH_POLICY,clockMode:'arena-fractional-ms'})}));
   entries.push(...additions);return true;
  },
  advance(dt){
   if(!Number.isFinite(dt)||dt<0)throw new RangeError('Finite nonnegative Push step required');
   entries=entries.filter(({actor,serial,condition})=>{
    if(actor.resetSerial!==serial)return false;
    const {displacement,active}=advanceNativeMeleePush(condition,dt*1000,{actorAcceptsUpdate:true});
    applyNativePushCollision(actor,[displacement.x/condition.scale,displacement.y/condition.scale,displacement.z/condition.scale],{actorPolicy:SOURCE_MELEE_PUSH_POLICY.actorPolicy,scale:condition.scale});
    return active;
   });
  },
  clear(){entries=[];},
  get size(){return entries.length;},
 };
}
