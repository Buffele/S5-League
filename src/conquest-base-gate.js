import {conquestBaseContactIntent} from './conquest-base-contact.js';
import {siegeObbOverlap} from './siege-zone.js';

// Safe-zone branches of708770: alpha/red take precedence over beta/blue;
// each group uses literal case-sensitive substring searches.
export function conquestSafeZoneSelectors(name){
 if(typeof name!=='string'||!name||name.includes('\0'))throw Error('Explicit native safe-zone name required');
 if(name.includes('alpha_safezone')||name.includes('red_safezone'))return [1];
 return name.includes('beta_safezone')||name.includes('blue_safezone')?[2]:[];
}
const copyBox=box=>({center:[...box.center],halfExtents:[...box.halfExtents],axes:box.axes.map(a=>[...a])});
const i32=value=>Number.isInteger(value)&&value>=-0x80000000&&value<=0x7fffffff;
const u32=value=>Number.isInteger(value)&&value>=0&&value<=0xffffffff;

// CSafeZoneArea constructor71EA50, INI initialization708633 and damage71EAE0.
// Gate health is separate from the defense controller's signed16 damage path.
export class ConquestBaseGate{
 constructor({name,selector,obb}){
  if(!conquestSafeZoneSelectors(name).includes(selector))throw Error('Native safe-zone name/selector binding unresolved');
  siegeObbOverlap(obb,obb);
  this.name=name;this.selector=selector;this.obb=copyBox(obb);this.health=0;
 }
 loadHealth(value){
  if(!i32(value))throw Error('Explicit signed32 native gate health required');
  this.health=value;return this.health;
 }
 receiveDamage({baseName,damageRaw}){
  if(baseName!==this.name)throw Error('Native base event name mismatch');
  if(!u32(damageRaw))throw Error('Explicit native damage DWORD required');
  // x86 SUB keeps all32 bits, including overflow. Do not clamp to zero or
  // apply A1DCF0's signed16 conversion to this distinct gate counter.
  this.health=(this.health-damageRaw)|0;return this.health;
 }
 get active(){return this.health>0;}
 snapshot(){return {name:this.name,field28:this.selector,field2C:0,field30:this.health,obb:copyBox(this.obb)};}
 contact(monster,{playing,isHost,timeTokenRaw}){
  return conquestBaseContactIntent({playing,isHost,timeTokenRaw,monster,gate:this.snapshot()});
 }
}
