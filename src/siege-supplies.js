import {TUNING} from './movement-profile.js';
import {activeSiegeMagazine,siegeMagazineWriteIsDeferred,siegeMagazineReward} from './siege-magazine-refill.js';

// Authored seize_mode_newinfo.x7 tables. Fever dispatch and native server RNG
// are not recovered; these use the ordinary capture / keep_up distributions.
const table=rows=>Object.freeze(rows.map(row=>Object.freeze(row)));
export const SIEGE_SUPPLIES=Object.freeze({captureCount:5,keepSeconds:10,keepCount:1,maximum:10,
 capture:table([{effect:'pen',value:5,weight:20},{effect:'exp',value:5,weight:20},{effect:'hp',value:30,weight:15},{effect:'sp',value:200,weight:10},{effect:'reloadmmo',rate:2,weight:10},{effect:'game_score',value:1,weight:25}]),
 keep:table([{effect:'hp',value:30,weight:20},{effect:'sp',value:200,weight:10},{effect:'reloadmmo',rate:2,weight:50},{effect:'game_score',value:1,weight:20}])});
export const SIEGE_SUPPLY_NAMES=Object.freeze({hp:'HP +30',sp:'SP +200',pen:'PEN +5',exp:'EXP +5',reloadmmo:'Magazine ammunition',game_score:'Score +1'});
export function chooseSiegeSupply(rows,random){
 const sample=random();if(!Number.isFinite(sample)||sample<0||sample>=1)throw Error('Siege supply RNG must return [0,1)');
 let cursor=sample*rows.reduce((sum,row)=>sum+row.weight,0);
 for(const row of rows){cursor-=row.weight;if(cursor<0)return row;}
 return rows.at(-1);
}

// Simulation owns identities and accepted rewards; the world adapter owns
// placement and real actor overlap. No synthetic pickup ACK or score packet.
export class SiegeSupplies{
 constructor({random=Math.random}={}){this.random=random;this.nextId=1;this.reset();}
 reset(){this.items=new Map();this.points=new Map();this.pendingMagazines=new WeakMap();}
 forgetActor(actor){this.pendingMagazines.delete(actor);}
 pendingMagazine(record){return this.pendingMagazines.get(record.actor)?.get(record.actor.weapon)??0;}
 applyPendingMagazine(record,state,runtime){
  const actor=record?.actor,person=state.players.get(record?.id);
  if(!actor||state.phase!=='playing'||!person?.alive||record.health.dead)return false;
  const current=activeSiegeMagazine(actor),pending=this.pendingMagazine(record);
  if(!pending||current.runtime!==runtime||runtime.phase!=='reload')return false;
  // B8FC40 assigns the queued amount, clears it, then CReloadState returns
  // to its previous state. No magazine transfer from reserve is performed.
  runtime.ammo=pending;runtime.phase='idle';
  for(const name of ['timeMs','phaseMs'])if(Object.hasOwn(runtime,name))runtime[name]=0;
  this.pendingMagazines.get(actor).delete(actor.weapon);
  state.emit('supply-ammo-applied',{id:record.id,weapon:actor.weapon,ammo:pending});return true;
 }
 sync(state){
  if(state.phase!=='playing'){this.reset();return;}
  for(const point of state.points.values()){
   if(!point.owner)continue;
   let previous=this.points.get(point.id);
   if(!previous||previous.generation!==point.captureGeneration){
    previous={generation:point.captureGeneration,cycles:0};this.points.set(point.id,previous);this.drop(point,SIEGE_SUPPLIES.captureCount,SIEGE_SUPPLIES.capture);
   }
   const cycles=Math.floor((point.heldSeconds+1e-9)/SIEGE_SUPPLIES.keepSeconds);
   while(previous.cycles<cycles){previous.cycles++;this.drop(point,SIEGE_SUPPLIES.keepCount,SIEGE_SUPPLIES.keep);}
  }
 }
 drop(point,count,rows){
  for(let i=0;i<count&&this.items.size<SIEGE_SUPPLIES.maximum;i++){
   const {weight,...reward}=chooseSiegeSupply(rows,this.random),id=this.nextId++;
   // A stable slot is allocated by the world adapter. IDs are never reused
   // after reset, so a delayed collection cannot consume a new match's item.
   this.items.set(id,{id,pointId:point.id,ownerAtDrop:point.owner,...reward});
  }
 }
 collect(id,record,state){
  const item=this.items.get(id),person=state.players.get(record?.id),health=record?.health,actor=record?.actor;
  if(!item||state.phase!=='playing'||!person?.alive||!health||health.dead)return null;
  if(item.effect==='hp'){
   if(!Number.isFinite(health.hp)||!Number.isFinite(health.maxHp))return null;
   health.hp=Math.min(health.maxHp,health.hp+item.value);
  }else if(item.effect==='sp'){
   if(!Number.isFinite(actor?.energy))return null;actor.energy=Math.min(TUNING.maxEnergy,actor.energy+item.value);
  }else if(item.effect==='game_score'){
   if(!state.receiveBuffScore(record.id,item.value))return null;
  }else if(item.effect==='pen')person.penGained=(person.penGained??0)+item.value;
  else if(item.effect==='exp')person.experienceGained=(person.experienceGained??0)+item.value;
  else if(item.effect==='reloadmmo'){
   const {runtime,capacity,reserve}=activeSiegeMagazine(actor);
   if(runtime&&Number.isFinite(runtime.ammo)&&runtime.ammo>=0&&Number.isFinite(capacity)&&capacity>runtime.ammo){
    const next=siegeMagazineReward(runtime.ammo,capacity,item.rate);
    if(siegeMagazineWriteIsDeferred({ammo:runtime.ammo,reserve})){
     if(!this.pendingMagazines.has(actor))this.pendingMagazines.set(actor,new Map());
     this.pendingMagazines.get(actor).set(actor.weapon,next);
    }else{this.pendingMagazines.get(actor)?.delete(actor.weapon);runtime.ammo=next;}
   }
  }else return null;
  this.items.delete(id);state.emit('supply-collected',{id:record.id,pickup:id,point:item.pointId,effect:item.effect,value:item.value??item.rate});return item;
 }
}
