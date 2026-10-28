import {CONQUEST_SOURCE_DATA} from './conquest-source-data.js';
import {CONQUEST_RENDER_DATA} from './conquest-render-data.js';
import {conquestMonsterInitialHealth} from './conquest-monster-health.js';
import {conquestNativeMoveVector} from './conquest-monster-movement.js';
import {conquestMonsterFreshCollisionBody,conquestMonsterSourceCollisionFlag} from './conquest-monster-collision-body.js';
const f=Math.fround;
export function conquestMonsterTeamSelector(team){
 if(!Number.isInteger(team)||team<0||team>255)throw Error('Explicit native monster team byte required');
 return team===1?1:team===2?2:0;
}
export function conquestMonsterDimensions(monsterKey,size){
 const ability=CONQUEST_SOURCE_DATA.monsters[monsterKey]?.Ability;
 if(!ability||!Number.isFinite(size)||f(size)<f(Number(ability.size_min))||f(size)>f(Number(ability.size_max)))throw Error('Source monster dimensions/size required');
 const width=f(f(Number(ability.boundWidth))*f(size)),height=f(f(Number(ability.boundHeight))*f(size));
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<0||height<0)throw Error('Finite native monster dimensions required');
 return {width,height};
}
// Ordinary CMonster state, not a humanoid Controller. Initial max/current HP
// use native creation scaling with the explicitly supplied briefing count.
export class ConquestMonsterActor{
 constructor({id,model,nativeStats,team,teamRegistry,team1Count,position}){
  const key=nativeStats?.monsterKey,descriptor=CONQUEST_RENDER_DATA.monsters[key];
  if(id==null||!descriptor||model?.source!==descriptor.scene||!model.group?.isObject3D||model.nativeSize!==nativeStats.size)throw Error('Actual source monster model/stats required');
  const selector=conquestMonsterTeamSelector(team);
  if(typeof teamRegistry?.has!=='function'||!teamRegistry.has(selector))throw Error('Native monster team registry entry unresolved');
  this.id=id;this.model=model;this.spawnStats=nativeStats;this.teamSelector=selector;
  this.aiScriptLiteral=CONQUEST_SOURCE_DATA.monsters[key].Resources.ai_lua;
  this.eligibleVirtual44=true;this.nativeField33C=4;
  this.moveDirectionNative={x:0,y:0,z:0};this.commandSpeedMultiplier=1;
  //97BF00 initializes protected actor+A8 to CONSTANT_FLOAT0/0/47:0,0,1.
  //97ED10 later stores nonzero command XYZ verbatim; zero preserves this.
  this.facingNative={x:0,y:0,z:1};this.model.setNativeFacing(this.facingNative);
  this.maxHealth=conquestMonsterInitialHealth(nativeStats.healthRaw16,team1Count);this.setEffectiveHealth(this.maxHealth);
  this.setNativeDimensions(conquestMonsterDimensions(key,nativeStats.size));this.setNativePosition(position);
 }
 setEffectiveHealth(value){if(!Number.isFinite(value)||!Number.isFinite(f(value)))throw Error('Explicit effective native monster health required');this.health=f(value);}
 setNativeDimensions({width,height}){if(![width,height].every(v=>Number.isFinite(v)&&v>=0&&Number.isFinite(f(v))))throw Error('Explicit native width/height required');this.width=f(width);this.height=f(height);}
 // Call once for actual fresh solver creation. Existing movement must retain
 // and advance its returned state rather than reinitializing it each frame.
 createNativeCollisionBody({ruleId}={}){return conquestMonsterFreshCollisionBody({width:this.width,height:this.height,position:this.positionNative,userClashCheck:conquestMonsterSourceCollisionFlag(this.spawnStats.monsterKey),ruleId});}
 setNativePosition(position){if(!['x','y','z'].every(k=>Number.isFinite(position?.[k])&&Number.isFinite(f(position[k]))))throw Error('Explicit native monster position required');this.positionNative={x:f(position.x),y:f(position.y),z:f(position.z)};this.model.setNativePosition(this.positionNative);}
 setNativeMoveDirection(value){this.moveDirectionNative=conquestNativeMoveVector(value);}
 setNativeFacingDirection(value){const direction=conquestNativeMoveVector(value);if(Object.values(direction).every(v=>v===0))return false;this.model.setNativeFacing(direction);this.facingNative=direction;return true;}
 get contactState(){
  // 986FE0 updates the constructor's axis-aligned Box. Facing is not used.
  const halfWidth=f(this.width*.5),halfHeight=f(this.height*.5),p=this.positionNative;
  return {identityByte8:this.teamSelector,eligibleVirtual44:this.eligibleVirtual44,hp:this.health,
   obb:{center:[p.x,f(p.y+halfHeight),p.z],halfExtents:[halfWidth,halfHeight,halfWidth],axes:[[1,0,0],[0,1,0],[0,0,1]]},
   attribute150:this.spawnStats.baseAttackRaw};
 }
 neutralizeForBase(){this.health=0;this.nativeField33C=2;}
}
