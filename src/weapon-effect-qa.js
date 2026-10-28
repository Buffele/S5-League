import {runVisualScenario} from './visual-scenarios.js';
import {playAttackEffects} from './combat-effects.js';
import {selectedWeaponEffect} from './weapon-effect-styles.js';
import {createMeleeAttack} from './melee-weapons.js';
import {presentationFacing,setAvatarFacing} from './view-orientation.js';

// Exposed only for an explicit ?qa= page. Reuses prepared avatar/effects so
// repeated artistic comparisons never reload a map or fetch during a strike.
export function runWeaponEffectQa({controller,avatar,graph,effects,settings,trail,poseBuffer,opponent,combat,audio,animate},{scenario='art-cut',seconds=.22,styles={},impact=null,kind='light',comboIndex=0,transformed=false}={}){
 if(!['art-state','art-cut','art-rush','art-air','contact-cut','contact-rush','strong','guard','idle','front','back','left','right','left-front','right-front','left-back','right-back'].includes(scenario))throw new RangeError('Unsupported art QA scenario');
 for(const [action,style]of Object.entries(styles))settings.set(controller.weapon,action,style,{persist:false});
 effects.clear();trail?.clear();if(opponent)opponent.group.visible=false;
 if(scenario==='art-state'){
  // An explicit action fixture in the main scene. This checks presentation,
  // not whether an otherwise inaccessible source action has an input binding.
  controller.reset();graph.reset();controller.facing=Math.PI;controller.sigmaTransformed=transformed;
  if(kind==='air'){controller.position.y=3;controller.grounded=false;controller.coyote=0;}
  controller.attack=createMeleeAttack(controller.weapon,kind,comboIndex,controller.sex,controller.facing,{transformed});
  const sequences=[],play=effects.play;effects.play=function(...args){const effect=play.apply(this,args);if(effect)sequences.push({name:args[0],effect});return effect;};
  try{for(let i=0;i<Math.ceil(Math.max(.016,Math.min(4,seconds))/.016);i++){
   const events=controller.step(.016,['charge','backdash'].includes(kind)?{heavyHeld:true}:{});graph.events(events);avatar.motion(graph.sample(controller,.016));avatar.update(.016);
   avatar.group.position.copy(controller.position);setAvatarFacing(avatar.group,presentationFacing(controller,controller.facing,false));
   effects.update(.016);playAttackEffects(effects,controller.attack,controller.position,avatar,controller.facing,{collision:controller.collision});effects.sampleAvatar(avatar);trail?.update(.016,controller.attack,{cancel:!!selectedWeaponEffect(avatar,controller.attack,{replacementOnly:true})});
  }}finally{effects.play=play;}
  poseBuffer?.reset();return {weapon:controller.weapon,fixture:'explicit-state',clip:avatar.clip,attack:controller.attack?.kind,position:{...controller.position},effects:effects.artState(),sequences:sequences.map(({name,effect})=>({name,hidden:!!effect.hideModelNodes,age:effect.age,models:effect.nodes?.filter(n=>n.effect&&n.group.visible).map(n=>({asset:n.asset,visible:true}))??[]}))};
 }
 if(scenario.startsWith('contact-')){
  if(!combat||!audio||!animate)throw Error('Real combat and audio required for a contact QA');
  controller.reset();graph.reset();combat.reset();combat.setMode('passive');controller.position={x:0,y:0,z:0};controller.facing=0;combat.enemy.position={x:0,y:0,z:1.4};combat.enemy.facing=Math.PI;opponent.group.visible=true;
  const sounds=[],play=audio.play;audio.play=function(key,...args){sounds.push(key);return play.call(this,key,...args);};
  try{for(let i=0;i<Math.ceil(seconds/.016);i++){const events=combat.tick(.016,{facing:0,light:i===0&&scenario==='contact-cut',lightShort:i===0&&scenario==='contact-cut',heavy:i===0&&scenario==='contact-rush'});graph.events(events);audio.events(events,controller.attack,controller);animate(.016);}}
  finally{audio.play=play;}
  poseBuffer?.reset();return {weapon:controller.weapon,clip:avatar.clip,hp:combat.enemyState.hp,sounds,soundFiles:Object.fromEntries(sounds.map(key=>[key,audio.files[key]])),effects:effects.artState()};
 }
 runVisualScenario(scenario,seconds,controller,graph,avatar,dt=>{
  effects.update(dt);playAttackEffects(effects,controller.attack,controller.position,avatar,controller.facing,{collision:controller.collision});
  effects.sampleAvatar(avatar);trail?.update(dt,controller.attack,{cancel:!!selectedWeaponEffect(avatar,controller.attack,{replacementOnly:true})});
 });
 if(impact)effects.playArtImpact(controller.attack,impact.point,{source:controller,normal:impact.normal,ground:!!impact.ground});
 poseBuffer?.reset();return {weapon:controller.weapon,clip:avatar.clip,attack:controller.attack?.kind??controller.attack?.type??null,position:{...controller.position},effects:effects.artState()};
}
