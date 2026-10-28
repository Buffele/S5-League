import {DUAL_MAGNUM_SOURCE as source} from './dual-magnum-data.js';
import {readAsset} from './scene-assets.js';
import {loadEffectRuntime} from './combat-effects.js';
export const DUAL_MAGNUM_BLAST_POLICY=Object.freeze({name:'one-dispatch-per-action-time-attribute',nativeFrequencyVerified:false,nativeReady:false});
export function dispatchDualMagnumBlastBindings(shot,avatar,context,{playSound,playEffect}={}){
 if(!context||!['effectsEnabled','soundsEnabled','positionedSound'].every(k=>typeof context[k]==='boolean'))throw new TypeError('Explicit Dual Magnum native-context flags required');
 const bindings=source.attributes[shot.sourceAttribute]?.blastBindings;if(!bindings)throw new RangeError('Unknown Dual Magnum attack attribute');const report={records:[],errors:[],nativeReady:false,frequencyPolicy:DUAL_MAGNUM_BLAST_POLICY.name};
 for(const b of bindings){const record={index:b.index,node:b.attachNode,sound:false,effect:false};report.records.push(record);
  if(context.soundsEnabled)try{if(typeof playSound!=='function')throw new Error('Dual Magnum sound callback required');playSound({weapon:'dualmagnum',bindingIndex:b.index,source:b.sound,path:'/assets/s5runtime/dual-magnum/sounds/'+b.sound.split('/').at(-1),positionedSound:context.positionedSound,position:shot.position,sourceAttackId:shot.sourceAttackId});record.sound=true;}catch(error){report.errors.push({index:b.index,stage:'sound',message:error.message});}
  if(context.effectsEnabled)try{const socket=[...avatar.bones].find(([name])=>name.endsWith(b.attachNode))?.[1];if(!socket)throw new Error('Missing Dual Magnum socket '+b.attachNode);if(typeof playEffect!=='function')throw new Error('Dual Magnum effect callback required');const key=b.sequences[0].split('/').at(-1).replace(/\.seq$/,'');playEffect(key,shot.position,{group:avatar.group,bones:new Map([...avatar.bones,[b.attachNode,socket]])},{rootBone:b.attachNode,follow:false,facing:shot.facing});record.effect=true;}catch(error){report.errors.push({index:b.index,stage:'effect',message:error.message});}
 }
 return report;
}
export function createDualMagnumEffectsRuntime(runtime,{onSound=()=>{},resolveShots=()=>{}}={}){
 let currentAvatar=null,currentWeapon=null,resetSerial=null,seen=new Set(),lastReport=null;
 const clear=()=>{runtime.clear();seen.clear();lastReport=null;};
 return {get lastBlastDispatchReport(){return lastReport;},clear,update(dt,c,avatar,disabled=false){if(currentAvatar!==avatar||currentWeapon!==c.weapon||resetSerial!==c.resetSerial){clear();currentAvatar=avatar;currentWeapon=c.weapon;resetSerial=c.resetSerial;}
  if(c.weapon==='dualmagnum'&&c.rifle){resolveShots(c,avatar);const accepted=c.rifle.pendingShots.filter(s=>s.contact);c.rifle.pendingShots=c.rifle.pendingShots.filter(s=>!s.contact);
   for(const shot of accepted){if(!Number.isInteger(shot.actionSerial))throw new Error('Dual Magnum actionSerial required for explicit blast frequency policy');const key=`${shot.actionSerial}/${shot.sourceAtMs}/${shot.sourceAttribute}`;if(!seen.has(key)){seen.add(key);lastReport=dispatchDualMagnumBlastBindings(shot,avatar,{effectsEnabled:!disabled,soundsEnabled:true,positionedSound:true},{playSound:onSound,playEffect:(...args)=>runtime.play(...args)});}
    if(!disabled)for(const contact of shot.contacts??[shot.contact])if(contact.hit||contact.wall)try{runtime.play(contact.hit?(shot.sourceAttribute.endsWith('3')?'gun_hit5':'gun_hit4'):'gun_hit',contact.point,null,{facing:shot.facing});}catch(error){lastReport?.errors.push({stage:'impact',message:error.message});}
   }
  }runtime.update(dt);},render:camera=>runtime.render(camera)};
}
export async function loadDualMagnumEffects(scene,callbacks){const definitions=await readAsset('/assets/s5runtime/dual-magnum/effects/runtime.json');return createDualMagnumEffectsRuntime(await loadEffectRuntime(scene,definitions),callbacks);}
