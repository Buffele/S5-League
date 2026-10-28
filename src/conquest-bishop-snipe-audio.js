import {assertConquestBishopSnipeActor} from './conquest-bishop-snipe-ai.js';
import {ConquestMonsterMappedState} from './conquest-monster-state-manager.js';
const owners=new WeakMap(),models=new WeakMap();
export const CONQUEST_BISHOP_SNIPE_SOUND_ASSETS=Object.freeze([]);
export function assertConquestBishopSnipeAudio(owner,{actor}={}){const r=owners.get(owner);if(!r||r.actor!==actor)throw Error('Typed actual Snipe animation/no-sound owner required');r.live();return owner;}
// Unchanged Snipe LuaCreate has no AddSound in any of its six real states.
// It still needs actual model channel0 IO for the generic state lifecycle.
export function createConquestBishopSnipeAudio({actor}={}){
 assertConquestBishopSnipeActor(actor);const model=actor.model,group=model.group,mixer=model.mixer,root=model.nativeRoot;
 if(!mixer||mixer.getRoot()!==root||models.has(model))throw Error('Distinct actual Snipe mixer owner required');let disposed=false,api;
 const live=()=>{if(disposed||models.get(model)!==api||actor.model!==model||model.group!==group||model.mixer!==mixer||model.nativeRoot!==root)throw Error('Current owned Snipe channel0 required');assertConquestBishopSnipeActor(actor);};
 const channel=args=>{live();if(args?.actor!==actor||args.model!==model||!(args.state instanceof ConquestMonsterMappedState)||args.state.actor!==actor||args.channelIndex!==0)throw Error('Actual Snipe lifecycle state/channel0 required');const action=model.currentAction??null;if(action&&action.getMixer()!==mixer)throw Error('Snipe action belongs to another mixer');const playbackRate=mixer.timeScale*(action?action.timeScale:1);if(!Number.isFinite(playbackRate))throw Error('Finite current Snipe channel rate required');return {model,channelIndex:0,playbackRate,action};};
 const unexpected=()=>{live();throw Error('Snipe source states have no authored AddSound');};
 const ports=Object.freeze({readAnimationChannel:channel,writeAnimationRate(args){const current=channel(args);if(args.channel?.model!==model||args.channel.channelIndex!==0||args.channel.action!==current.action||!Number.isFinite(args.playbackRate)||args.playbackRate<=0)throw Error('Actual retained Snipe channel receipt/rate required');mixer.timeScale=1;if(current.action)current.action.setEffectiveTimeScale(args.playbackRate);else mixer.timeScale=args.playbackRate;return {accepted:true,model,channelIndex:0};},initializeSoundHandle:unexpected,playSound:unexpected,stopSound:unexpected});
 api=Object.freeze({ports,snapshot(){live();return {monsterKey:1314,sourceSoundCount:0,sourceLuaSoundInventoryQualified:true,animationChannel:0,nativeReady:false};},dispose(){if(disposed)return;disposed=true;if(models.get(model)===api)models.delete(model);}});models.set(model,api);owners.set(api,{actor,live});live();return api;
}
