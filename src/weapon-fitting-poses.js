import {MELEE} from './melee-weapons.js';
import {SPY_DAGGER_DIRECTIONS,SPY_DAGGER_LOCOMOTION,getSpyDaggerAttackProfile} from './spy-dagger-data.js';

const labels=['Avant','Avant droite','Droite','Arrière droite','Arrière','Arrière gauche','Gauche','Avant gauche'];
// Locomotion comes from explicit NormalState/RunState data, never attack clips.
// These are seekable pose previews, not a replacement for the gameplay clocks.
export function weaponFittingPoses(weapon){
 const definition=weapon==='dagger'?SPY_DAGGER_LOCOMOTION:MELEE[weapon];
 if(!definition)throw Error('Poses indisponibles pour cette arme');
 const poses=[{id:'idle',label:'Repos',clip:definition.idle}];
 SPY_DAGGER_DIRECTIONS.forEach((direction,i)=>poses.push({id:direction,label:'Marche · '+labels[i],
  clip:weapon==='dagger'?definition.run[direction]:definition.run[i],
  lower:weapon==='dagger'?definition.runLower[direction]:definition.runLower[i]}));
 if(weapon==='dagger'){
  for(const [kind,label] of [['cut','Attaque · coupe'],['rush','Attaque · ruée']]){
   const action=getSpyDaggerAttackProfile(kind);poses.push({id:kind,label,clip:action.clip});
   if(kind==='cut')poses.push({id:'cut-alternate',label:'Attaque · coupe alternée',clip:action.alternateClip});
   if(action.recoveryClip)poses.push({id:kind+'-recovery',label:'Retour · '+label,clip:action.recoveryClip});
  }
 }else{
  definition.light.forEach((action,i)=>poses.push({id:'light-'+i,label:'Attaque légère '+(i+1),clip:action.clip}));
  for(const [key,label] of [['strong','Attaque forte'],['heavy','Attaque secondaire'],['air','Attaque aérienne'],['guard','Garde']]){
   const action=definition[key];if(!action)continue;
   poses.push({id:key,label,clip:action.clip});
   if(action.recoveryClip)poses.push({id:key+'-recovery',label:'Retour · '+label,clip:action.recoveryClip});
  }
 }
 return poses;
}
