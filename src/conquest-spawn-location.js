import {CONQUEST_RENDER_DATA} from './conquest-render-data.js';
// A22190 offsets native spawn X/Z by explicit rand()%200-100 samples. This
// resolves source coordinates only; caller owns map conversion and NPC spawn.
export function conquestSpawnLocation(spawnIndex,{jitterX,jitterZ}={}){
 const spawn=CONQUEST_RENDER_DATA.spawns[spawnIndex];
 if(!Number.isInteger(spawnIndex)||!spawn)throw Error('Unknown Conquest native spawn index');
 for(const sample of [jitterX,jitterZ])if(!Number.isInteger(sample)||sample< -100||sample>99)throw Error('Explicit native Conquest jitter samples -100..99 required');
 return {name:spawn.name,nativePosition:{x:spawn.matrix[12]+jitterX,y:spawn.matrix[13],z:spawn.matrix[14]+jitterZ},
  sourceMatrix:[...spawn.matrix],waypointReferences:{...spawn.waypointReferences}};
}
