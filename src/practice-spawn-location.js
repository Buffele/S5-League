import {PRACTICE_SPAWN_DATA} from './practice-spawn-data.js';
import {PRACTICE_SOURCE_DATA} from './practice-source-data.js';
// Native map-scene transforms. RandomPos300 is preserved by mission-plan;
// its distribution and map presentation scale remain native-loader concerns.
export function practiceSpawnTransform(mapId,sceneNode){
 const map=PRACTICE_SPAWN_DATA.maps[mapId],spawn=map?.spawns[sceneNode];
 if(!Number.isInteger(mapId)||!spawn)throw Error(`Practice spawn transform unresolved: map${mapId}/${sceneNode}`);
 return {mapId,scene:map.scene,node:sceneNode,matrix:[...spawn.matrix],
  nativePosition:{x:spawn.matrix[12],y:spawn.matrix[13],z:spawn.matrix[14]}};
}
// B46CE0 applies two separate rand()%300-150 values in native X/Z. Accept
// explicit native rand samples; retain one native->render boundary at caller.
export function practiceSentryLocation(mapId,sceneNode,{randX,randZ}={}){
 for(const value of [randX,randZ])if(!Number.isInteger(value)||value<0||value>0xffffffff)throw Error('Explicit native Practice rand uint32 samples required');
 const location=practiceSpawnTransform(mapId,sceneNode),raw=PRACTICE_SOURCE_DATA.registration.randomPositionRaw;
 const jitter={x:randX%raw-raw/2,z:randZ%raw-raw/2};
 return {...location,jitter,nativePosition:{x:Math.fround(location.nativePosition.x+jitter.x),y:location.nativePosition.y,z:Math.fround(location.nativePosition.z+jitter.z)}};
}
