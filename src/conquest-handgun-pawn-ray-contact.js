import {Controller} from './controller.js';
import {CombatState} from './combat-state.js';
import {assertConquestHandgunPawnVariant} from './conquest-handgun-pawn-variant.js';

const f=Math.fround,contacts=new WeakMap();
const vec=(v,name)=>{if(!Array.isArray(v)||v.length!==3||v.some(n=>!Number.isFinite(n)||!Number.isFinite(f(n))))throw Error('Explicit finite native '+name+' required');return v.map(f);};
const dot=(a,b)=>f(f(f(a[0]*b[0])+f(a[1]*b[1]))+f(a[2]*b[2]));
const subtract=(a,b)=>a.map((n,i)=>f(n-b[i]));

// Original542060 fallback, selected for authenticated Pawn1003/Explode1013,
// assumed for every NPC. critical_point XML0 -> info276=0 -> actor2F8=null.
// Range uses CENTER distance; emitted point is origin+unitDirection*distance,
// not the closest sphere-intersection point.53BD80 initializes contactpart0.
export function conquestPawnNativeEllipsoidRayContact({origin,direction,length,position80,width68,height6c,eligible44,detailedVolume134}={}){
 if(typeof eligible44!=='boolean'||detailedVolume134!==null)throw Error('Explicit Pawn eligibility and source null134 branch required');
 const o=vec(origin,'ray origin'),d=vec(direction,'ray direction'),p=vec(position80,'candidate feet position');
 if(![length,width68,height6c].every(n=>Number.isFinite(n)&&Number.isFinite(f(n)))||length<0||width68<=0||height6c<=0)throw Error('Finite native ray range and positive Pawn dimensions required');
 if(!eligible44)return null;
 const norm=f(Math.sqrt(dot(d,d)));if(!(norm>0))throw Error('Nonzero native ray direction required');
 const unit=d.map(n=>f(n/norm)),radii=[f(f(width68)*f(.5)),f(f(height6c)*f(.5)),f(f(width68)*f(.5))],center=[p[0],f(p[1]+radii[1]),p[2]],offset=subtract(center,o),distance=f(Math.sqrt(dot(offset,offset)));
 if(distance>f(length))return null;
 const scaledOrigin=o.map((n,i)=>f(n/radii[i])),scaledDirection=d.map((n,i)=>f(n/radii[i])),scaledCenter=center.map((n,i)=>f(n/radii[i]));
 let residual=subtract(scaledCenter,scaledOrigin);const projection=dot(residual,scaledDirection);
 if(projection>0){const t=f(projection/dot(scaledDirection,scaledDirection));residual=residual.map((n,i)=>f(n-f(t*scaledDirection[i])));}
 const distanceSquared=dot(residual,residual);if(1<distanceSquared)return null;
 return Object.freeze({point:Object.freeze(o.map((n,i)=>f(n+f(unit[i]*distance)))),part:0,centerDistance:distance,ellipsoidDistanceSquared:distanceSquared,nativeReady:false});
}

// A candidate producer bound to real source/player/monster ownership. This
// closes the Pawn's null134 geometry/part branch, not all56E870 arbitration.
// The actual world ray still comes from the attacking weapon's shot producer.
export class ConquestHandgunPawnRayContactProducer{
 #id;#players;#record;#controller;#combat;#world;#position;#monsters;#disposed=false;
 constructor({playerId,playerActors,monsterActors,controller,worldOwner}={}){
  const record=playerActors?.get(playerId);
  if(!(playerActors instanceof Map)||!(monsterActors instanceof Map)||!(controller instanceof Controller)||record?.controller!==controller||!(record.combatState instanceof CombatState)||controller.world!==worldOwner)throw Error('Actual attacking Controller/CombatState and current authority owners required');
  this.#id=playerId;this.#players=playerActors;this.#record=record;this.#controller=controller;this.#combat=record.combatState;this.#world=worldOwner;this.#position=controller.position;this.#monsters=monsterActors;
 }
 #source(){if(this.#disposed||this.#players.get(this.#id)!==this.#record||this.#record.controller!==this.#controller||this.#record.combatState!==this.#combat||this.#controller.position!==this.#position||this.#controller.world!==this.#world||this.#controller.weapon!=='handgun')throw Error('Current owned actual Handgun source required');}
 #target(actor){
  if(this.#monsters.get(actor?.id)!==actor)throw Error('Actual owned source Pawn target required');assertConquestHandgunPawnVariant({actor});
 }
 queryCandidate({actor,shape}={}){
  this.#source();this.#target(actor);if(shape?.type!==4)throw Error('Actual native type4 Handgun ray required');
  const result=conquestPawnNativeEllipsoidRayContact({origin:shape.origin,direction:shape.direction,length:shape.length,
   position80:['x','y','z'].map(key=>actor.positionNative[key]),width68:actor.width,height6c:actor.height,eligible44:actor.eligibleVirtual44,detailedVolume134:null});
  if(result===null)return null;
  const contact=Object.freeze({actor,point:result.point,part:result.part,flag16:result.part,centerDistance:result.centerDistance,
   coordinateSpace:'native',shapeType:4,source:'542060/null134/53BD80',pawnPartProducerQualified:true,
   fullQueryArbitrationQualified:false,shotGeometryProducerQualified:false,nativeReady:false});
  contacts.set(contact,{owner:this,actor,model:actor.model,sourceRecord:this.#record,position:{...actor.positionNative},width:actor.width,height:actor.height,eligible:actor.eligibleVirtual44,shape,
   origin:vec(shape.origin,'ray origin'),direction:vec(shape.direction,'ray direction'),length:f(shape.length)});return contact;
 }
 assertContact(contact,{actor,shape}={}){
  this.#source();this.#target(actor);const r=contacts.get(contact);
  if(!r||r.owner!==this||r.actor!==actor||r.model!==actor.model||r.sourceRecord!==this.#record||r.shape!==shape||actor.width!==r.width||actor.height!==r.height||actor.eligibleVirtual44!==r.eligible||['x','y','z'].some(key=>actor.positionNative[key]!==r.position[key])||vec(shape.origin,'ray origin').some((n,i)=>n!==r.origin[i])||vec(shape.direction,'ray direction').some((n,i)=>n!==r.direction[i])||f(shape.length)!==r.length)throw Error('Current unmodified typed Pawn ray contact required');
  return contact;
 }
 dispose(){this.#disposed=true;}
}
