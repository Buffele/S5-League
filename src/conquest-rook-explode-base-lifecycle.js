import {assertConquestRookExplodeActor} from './conquest-rook-explode-source.js';
import {ConquestMonsterMappedState} from './conquest-monster-state-manager.js';
const owners=new WeakMap();
export function assertConquestRookExplodeBaseLifecycle(owner,{actor}={}){const r=owners.get(owner);if(!r||r.actor!==actor)throw Error('Typed actual RookExplode base lifecycle required');r.live();return owner;}
// RookExplode's authenticated Lua adds no state-local sound or effect entries.
// The inherited base still performs real MoveBox lookup and channel0 writes.
export function createConquestRookExplodeBaseLifecycle({actor}={}){
 assertConquestRookExplodeActor(actor);const model=actor.model,mixer=model.mixer,group=model.group,root=model.nativeRoot,find=model.findSourceNode,records=new WeakMap();let active=null,disposed=false;
 function live(){if(disposed||actor.model!==model||model.group!==group||model.nativeRoot!==root||model.mixer!==mixer||mixer.getRoot()!==root||model.findSourceNode!==find)throw Error('Current real RookExplode model/mixer lifecycle required');assertConquestRookExplodeActor(actor);}
 function stateOwner(state){live();if(!(state instanceof ConquestMonsterMappedState)||state.actor!==actor||![0,1,2,3,4,5].includes(state.stateId))throw Error('Actual owned RookExplode state0..4 required');let r=records.get(state);if(!r){r={stateId:state.stateId,node:null,nodeResolved:false,matrix60:[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]};records.set(state,r);}if(r.stateId!==state.stateId)throw Error('RookExplode state ID replaced');return r;}
 function writeRate(){const action=model.currentAction??null;if(action&&action.getMixer()!==mixer)throw Error('Actual RookExplode channel action required');mixer.timeScale=1;if(action)action.setEffectiveTimeScale(1);if(mixer.timeScale*(action?action.timeScale:1)!==1)throw Error('Real RookExplode channel0 rate write failed');}
 const api=Object.freeze({
  enter(state){const r=stateOwner(state);if(find('MoveBox')!==null)throw Error('RookExplode MoveBox branch requires its source root-motion owner');r.node=null;r.nodeResolved=true;r.matrix60=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];writeRate();active=state;return api.snapshot(state);},
  tick(state,deltaMs){stateOwner(state);if(active!==state||!Number.isInteger(deltaMs)||deltaMs<0||deltaMs>0xffffffff)throw Error('Entered RookExplode lifecycle/uint32 delta required');if(find('MoveBox')!==null)throw Error('RookExplode motion-node lookup changed');return api.snapshot(state);},
  exit(state){stateOwner(state);if(active!==state)throw Error('Current RookExplode lifecycle exit owner required');writeRate();active=null;return api.snapshot(state);},
  readPlaybackRate(state){stateOwner(state);return 1;},
  snapshot(state){const r=stateOwner(state);return {monsterKey:1110,stateId:r.stateId,active:active===state,motionNodeResolvedAbsent:r.nodeResolved&&r.node===null,matrix60:[...r.matrix60],animationB9:false,playbackRateAC:1,resetEffectsBE:true,stateLocalEffectCount:0,addedSoundCount:0,nativeReady:false};},
  dispose(){if(disposed)return;if(active)api.exit(active);disposed=true;},
 });owners.set(api,{actor,live});return api;
}
