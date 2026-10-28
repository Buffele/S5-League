import {Controller} from './controller.js';
import {ConquestPawnActorAuthority} from './conquest-pawn-actor-authority.js';
const owners=new WeakMap(),receipts=new WeakMap(),f=Math.fround;
export const CONQUEST_BISHOP_SNIPE_PLAYER_FACING_POLICY=Object.freeze({id:'s5-current-controller-facing-to-native-minus-z',nativeObserved:false,nativeReady:false});
const root=node=>{while(node?.parent)node=node.parent;return node;};
export function assertConquestBishopSnipePlayerFacing(owner,{authority,playerActors,world,renderOwner}={}){const r=owners.get(owner);if(!r||r.authority!==authority||r.players!==playerActors||r.world!==world||r.render!==renderOwner)throw Error('Typed Snipe player-facing owner required');r.live();return owner;}
export function assertConquestBishopSnipePlayerFacingReceipt(receipt,{owner,actor}={}){const r=receipts.get(receipt);if(!r||r.owner!==owner||r.actor!==actor)throw Error('Typed actual Snipe player-facing receipt required');r.live();return receipt;}
// The current S5 Controller is the declared presentation/input producer.
// Its yaw0 looks -Z, yaw=-pi/2 looks+X. No native PLAYER direction writer is
// claimed. Each receipt binds the actual authority wrapper and Map record,
// controller/model/position/reset/state/facing; later changes revoke it.
export function createConquestBishopSnipePlayerFacing({authority,playerActors,world,renderOwner,policy}={}){
 if(!(authority instanceof ConquestPawnActorAuthority)||!(playerActors instanceof Map)||world?.nativeMapId!==46||!renderOwner?.isObject3D||policy!==CONQUEST_BISHOP_SNIPE_PLAYER_FACING_POLICY)throw Error('Actual Snipe authority/player Map/world/render and explicit S5 facing policy required');let disposed=false;
 const live=()=>{if(disposed)throw Error('Disposed Snipe player-facing owner');};
 const current=actor=>{live();if(actor?.kind!=='conquest-owned-player-navigation'||authority.actor(actor.id)!==actor||authority.lookupFullIdentity(authority.identity(actor.id))!==actor)throw Error('Actual current authority-owned PLAYER wrapper required');const record=playerActors.get(actor.id),c=record?.controller,m=record?.model;if(!(c instanceof Controller)||c.world!==world||!m?.group?.isObject3D||root(m.group)!==renderOwner||!Number.isFinite(c.facing)||!Number.isInteger(c.resetSerial)||!Number.isFinite(c.time)||typeof c.state!=='string')throw Error('Current finite PLAYER Controller/facing/state/model required');authority.position(actor);authority.height(actor);return {record,c,m};};
 const api=Object.freeze({readDirection8c(actor){const {record,c,m}=current(actor),yaw=c.facing,serial=c.resetSerial,state=c.state,time=c.time,position=c.position,health=record.combatState;
  const receipt=Object.freeze({direction8c:Object.freeze([f(-Math.sin(yaw)),0,f(-Math.cos(yaw))]),resetSerial:serial,selectedState:state,controllerTime:time,s5Policy:policy.id,nativePlayerDirectionWriterQualified:false,nativeObserved:false,nativeReady:false});
  receipts.set(receipt,{owner:api,actor,live:()=>{const now=current(actor);if(now.record!==record||now.c!==c||now.m!==m||record.combatState!==health||c.position!==position||c.resetSerial!==serial||c.state!==state||c.time!==time||c.facing!==yaw)throw Error('Stale Snipe PLAYER facing receipt');}});return receipt;
 },dispose(){disposed=true;}});owners.set(api,{authority,players:playerActors,world,render:renderOwner,live});return api;
}
