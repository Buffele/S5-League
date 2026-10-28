import * as THREE from 'three';
import {practiceSentryHasPeerId,practiceSentryCandidateEligible,practiceSentryQueryCandidates,practiceSentryWithinHeadRange,practiceSentryVisibilityDecision,practiceSentryProbeEndpoint,practiceSentryHorizontalAim,practiceSentryAttackAim,sentryNativeVector,sentryNativeAngle,practiceSentryNativeAdd} from './practice-sentry-perception.js';
const f=Math.fround,FORWARD=[0,0,-1],ANCHOR=[0,170,-50],PI=f(Math.PI),SINGULAR=f(.9999);
const vec=v=>new THREE.Vector3(...v);
function rotation(from,to,{positiveZSpecial=false}={}){
 if(positiveZSpecial&&to[2]>SINGULAR)return new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),PI);
 const a=vec(from),b=vec(to),cross=new THREE.Vector3().crossVectors(a,b),angle=sentryNativeAngle(from,to);
 //D3DXQuaternionRotationAxis normalizes its axis. Zero-angle identity is
 //explicit; a nonzero angle with zero axis stays an unresolved singularity.
 if(angle===0)return new THREE.Quaternion();if(cross.lengthSq()===0)return null;
 return new THREE.Quaternion().setFromAxisAngle(cross.normalize(),angle);
}
export function practiceSentryAttackOrigin({origin74,aim228}){const q=rotation(FORWARD,sentryNativeVector(aim228),{positiveZSpecial:true});if(!q)return null;return practiceSentryNativeAdd(sentryNativeVector(origin74),vec(ANCHOR).applyQuaternion(q).toArray().map(f));}
export function practiceSentryProbeRequest({self,candidate,rawVerticalRange=40,rawRayLength=25000,halfFactor=.5}){
 const orient=sentryNativeVector(self.orientation8c,'owner virtual8C orientation'),q=rotation(FORWARD,orient,{positiveZSpecial:true});if(!q)return null;
 const position=sentryNativeVector(self.position7c,'owner virtual7C position'),origin=practiceSentryNativeAdd(position,vec(ANCHOR).applyQuaternion(q).toArray().map(f));
 return {source:'AF1D10→568CD0(type4)→5F5790(1,1)→5F5AD0→7B5F10',coordinateSpace:'native',from:origin,to:practiceSentryProbeEndpoint(candidate,halfFactor),queryMask:0x210fc0,rawQueryFlag:true,
  shape:{type:4,anchor:[...ANCHOR],direction:vec(FORWARD).applyQuaternion(q).toArray().map(f),length:rawRayLength,rawArguments5And6:[rawVerticalRange,rawVerticalRange]},ownerIdentity:self.identity,candidateIdentity:candidate.identity};
}
//Consumable as createSentryPorts({target,profile}). This closes native control
//flow while requiring actual actor snapshots, query and damage services.
//No fallback nearest actor, team mapping, host role or damage application.
export function createPracticeSentryGameplay({readSelf,listActors,resolvePeer,probeSegment,attackContainer,onHead=()=>{},onUnknown=()=>{},halfFactor=.5,rawRayLength=25000,rangeCeiling=25000}){
 for(const [name,fn] of Object.entries({readSelf,listActors,resolvePeer,probeSegment}))if(typeof fn!=='function')throw Error('Explicit Sentry service required: '+name);
 for(const name of ['begin','tick','end','setDirection','setOrigin'])if(typeof attackContainer?.[name]!=='function')throw Error('Explicit source attack container required: '+name);
 if(typeof onHead!=='function'||typeof onUnknown!=='function'||![halfFactor,rawRayLength,rangeCeiling].every(Number.isFinite))throw Error('Invalid explicit source services');
 //AEFBEE constructs actor+228 as(0,0,-1), separately from actor+A8.
 let peerId=[0,0],selectionKnown=true,aim228=[...FORWARD],headQuaternion=null,disposed=false,neckControllerDetached=false,attackRunning=false;
 const unknown=name=>{onUnknown({port:name,nativeReady:false});return null;};
 const self=()=>{if(disposed)throw Error('Sentry gameplay disposed');const s=readSelf();if(!s)return null;
  if(typeof s.headRotationEnabled!=='boolean'||!Number.isFinite(s.range20)||!Number.isFinite(s.rangeBonus268)||!Number.isFinite(s.angle2c)||!Number.isFinite(s.vertical38))throw Error('Actual Sentry source attributes and effective bonus required');
  return {...s,position74:sentryNativeVector(s.position74),forwardA8:sentryNativeVector(s.forwardA8),effectiveRange:Math.min(f(f(s.range20)+f(s.rangeBonus268)),f(rangeCeiling))};};
 const target=()=>practiceSentryHasPeerId(peerId)?resolvePeer([...peerId]):null;
 function clearTarget(){peerId=[0,0];selectionKnown=true;}
 function searchTarget({rawScale0,rawScale1}){
  if(![rawScale0,rawScale1].every(Number.isFinite))throw Error('Source search scales required');const s=self(),actors=listActors();
  if(!s||actors===null){selectionKnown=false;return unknown('actor-registry');}
  const entries=practiceSentryQueryCandidates({actors,origin74:s.position74,forwardA8:s.forwardA8,effectiveRange:f(s.effectiveRange*rawScale0),angleDegrees:f(s.angle2c*rawScale1),halfFactor});
  for(const {actor} of entries){if(!practiceSentryCandidateEligible(s,actor))continue;
   const request=practiceSentryProbeRequest({self:s,candidate:actor,rawVerticalRange:s.vertical38,rawRayLength,halfFactor});
   const blocked=request?probeSegment(request):null,decision=practiceSentryVisibilityDecision({origin74:s.position74,forwardA8:s.forwardA8,targetPosition:actor.position7c,angleDegrees:s.angle2c,halfFactor,blocked});
   if(decision.aim228)aim228=decision.aim228;
   if(decision.accepted===null){selectionKnown=false;return unknown('source-probe-segment');}
   if(decision.accepted){peerId=[...actor.peerId2c];practiceSentryHasPeerId(peerId);selectionKnown=true;return actor;}
  }
  selectionKnown=true;return null;
 }
 function updateHead(){const s=self();if(!s)return unknown('actor-snapshot');if(!s.headRotationEnabled)return false;
  const current=target();if(current&&practiceSentryWithinHeadRange({origin74:s.position74,forwardA8:s.forwardA8,targetPosition:current.position7c,effectiveRange:s.effectiveRange,angleDegrees:s.angle2c,halfFactor}))aim228=practiceSentryHorizontalAim(s.position74,current.position7c);
  else clearTarget();
  if(!aim228)return unknown('initial-aim228');
  const base=rotation(FORWARD,[0,-1,0]),aim=rotation(s.forwardA8,aim228);if(!base||!aim)return unknown('neck-quaternion-singularity');
  //100E580->D3DXQuaternionMultiply(Q1=base,Q2=aim) = aim * base.
  headQuaternion=aim.multiply(base);onHead({node:'NeckBone',quaternion:headQuaternion.toArray(),aim228:[...aim228],source:'AF0F10',neckControllerDetached,nativeReady:false});return true;
 }
 function beginAttack(){const s=self();if(!s)return unknown('actor-snapshot');neckControllerDetached=s.headRotationEnabled;updateHead();attackContainer.begin();attackRunning=true;}
 function tickAttack(deltaMs){if(!Number.isInteger(deltaMs)||deltaMs<0||deltaMs>0xffffffff)throw Error('Native uint32 attack delta required');const s=self();if(!s)return unknown('actor-snapshot');const current=target();
  if(current){const aim=practiceSentryAttackAim(s.position74,current.position7c);aim228=aim.aim228;attackContainer.setDirection([...aim.fullDirection]);const origin=practiceSentryAttackOrigin({origin74:s.position74,aim228});if(origin)attackContainer.setOrigin(origin);else unknown('attack-origin-singularity');}
  //AF1360 ALWAYS ticks the container, including absent or unresolved target.
  attackContainer.tick(deltaMs);
 }
 function endAttack(){attackContainer.end();neckControllerDetached=false;attackRunning=false;}
 return {bindings:{searchTarget,hasTarget:()=>selectionKnown?practiceSentryHasPeerId(peerId):null,clearTarget,updateHead,beginAttack,tickAttack,endAttack},
  afterPose(model,{stateId}={}){if([1,2,3].includes(stateId)&&headQuaternion&&model.nodes?.has('NeckBone')){model.nodes.get('NeckBone').quaternion.copy(headQuaternion);model.group.updateMatrixWorld(true);}},
  snapshot:()=>({peerId:[...peerId],selectionKnown,aim228:aim228&&[...aim228],neckControllerDetached,headQuaternion:headQuaternion?.toArray()??null,nativeReady:false}),
  dispose(){if(disposed)return;if(attackRunning)attackContainer.end();disposed=true;peerId=[0,0];headQuaternion=null;aim228=null;},
  sourceConsumerStatus:'AF0B90/AF0D40/AF0F10/AF12A0/AF1330/AF1360/AF15F0 control flow applied; injected actor/query/container services unverified',
  poseCompositionStatus:'NeckBone rotation after actual mixer; native model scheduler/controller-list parity unverified',nativeReady:false};
}
//5FD350/5FD1F0/5FD5A0 enumerate component pointers in stored order.
//Actual56D890/56E870 geometry, gate, critical and damage remain their services.
export function createPracticeSentryAttackContainer({components,owner}){
 if(!Array.isArray(components))throw Error('Ordered native attack components required');for(const c of components)for(const name of ['begin','tick','end','setDirection','setOrigin'])if(typeof c?.[name]!=='function')throw Error('Actual attack component service required: '+name);
 let active=false;
 return {begin(){for(const c of components)c.begin(owner);if(components.length)active=true;},tick(ms){if(active)for(const c of components)c.tick(owner,ms,1);},end(){for(const c of components)c.end();active=false;},setDirection(direction){for(const c of components)c.setDirection(sentryNativeVector(direction));},setOrigin(origin){for(const c of components)c.setOrigin(sentryNativeVector(origin));},get active(){return active;},nativeReady:false,damageConsumerStatus:'injected56D890/56E870; no inferred damage'};
}
