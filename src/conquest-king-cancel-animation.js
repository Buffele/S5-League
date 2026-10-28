import {LoopRepeat} from 'three';
import {ConquestMonsterAnimationAdapter} from './conquest-monster-animation.js';
import {assertConquestKingSpecialState} from './conquest-king-special-states.js';
import {assertConquestKingActor} from './conquest-king-ai.js';
const owners=new WeakMap(),receipts=new WeakMap();
export const CONQUEST_KING_CANCEL_ANIMATION_POLICY=Object.freeze({kind:'s5-King-source00007-cancel-channel',clip:'00007',nativeSetArgument100:100,nativeLoop:true,rendererResetTimeSeconds:0,nativeClockQualified:false,nativeReady:false});
export function assertConquestKingCancelAnimation(owner,{actor,animation}={}){const r=owners.get(owner);if(!r||r.actor!==actor||r.animation!==animation)throw Error('Typed actual King cancel animation owner required');r.live();return owner;}
export function assertConquestKingCancelAnimationReceipt(receipt,{actor,model,animation,state}={}){const r=receipts.get(receipt);if(!r||r.actor!==actor||r.model!==model||r.animation!==animation||r.state!==state)throw Error('Actual current King cancel animation receipt required');r.live();if(r.readCurrentState()!==state||state.phase!==1||model.currentAction!==r.action||animation.currentAction!==r.action)throw Error('Stale King cancel animation selection');return receipt;}

// A325C0 calls channel.virtual2C('00007',100,1), then1152B90 reset,
// then sets loop39=1. Requested actor-name history300 is not overwritten.
// Three renders the real clip from its own reset clock; native clocks and
// the channel-specific meaning of argument100 remain explicitly unqualified.
export function createConquestKingCancelAnimation({actor,animation,readCurrentState,policy}={}){
 assertConquestKingActor(actor);if(!(animation instanceof ConquestMonsterAnimationAdapter)||animation.model!==actor.model||typeof readCurrentState!=='function'||policy!==CONQUEST_KING_CANCEL_ANIMATION_POLICY)throw Error('Actual King animation/current-state owner and immutable S5 channel policy required');
 const model=actor.model,mixer=model.mixer,clip=model.clips.find(c=>c.name==='00007');if(!clip)throw Error('Actual King source cancel clip00007 absent');let disposed=false,active=null;
 const r={actor,model,animation,state:null,action:null,readCurrentState,live(){if(disposed||actor.model!==model||model.mixer!==mixer||animation.disposed||animation.model!==model)throw Error('Current King cancellation presentation required');assertConquestKingActor(actor);}};
 const api=Object.freeze({
  play(state,args){r.live();assertConquestKingSpecialState(state,{actor,stateId:8});if(readCurrentState()!==state||state.phase!==1||args?.clip!=='00007'||args.sourceSetArgument100!==100||args.loop!==true||args.resetClock!==true||animation.lastReceipt?.stateId!==8)throw Error('Actual A325C0 cancelled PreFastRun channel request required');
   const history=animation.previousRequestedName,previous=animation.currentAction,action=mixer.clipAction(clip);for(const owned of animation.actions)if(owned!==action)owned.stop();previous?.stop();action.stopFading().stopWarping().reset().setEffectiveWeight(1).setEffectiveTimeScale(1).setLoop(LoopRepeat,Infinity).play();action.clampWhenFinished=false;animation.actions.add(action);animation.currentAction=action;model.currentAction=action;if(animation.previousRequestedName!==history)throw Error('Direct cancellation channel must preserve actor animation history');r.state=state;r.action=action;
   active=Object.freeze({actor,model,stateId:8,clip:'00007',accepted:true,sourceSetArgument100:100,requestedNameHistory:history,loop:true,resetClock:true,renderer:policy.kind,nativeClockQualified:false,nativeReady:false});receipts.set(active,r);return active;
  },
  readCurrent(){r.live();return active===null?null:assertConquestKingCancelAnimationReceipt(active,{actor,model,animation,state:readCurrentState()});},
  dispose(){if(disposed)return;if(r.action){r.action.stop();animation.actions.delete(r.action);if(animation.currentAction===r.action)animation.currentAction=null;if(model.currentAction===r.action)model.currentAction=null;}disposed=true;active=null;},
 });owners.set(api,r);r.live();return api;
}
