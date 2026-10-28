import {WEAPON_CHOICES} from './loadout.js';

// Three positional commands are sourced. These safety rules are S5 policies:
// one live bundle/ammo state per family, at least one weapon, stable slot order,
// and first occupied slot as the replacement when removing the active weapon.
export const S5_WEAPON_LOADOUT_POLICY=Object.freeze({slots:3,duplicates:'refused-shared-runtime',lastWeapon:'retain',activeRemoval:'first-occupied',nativeCompared:false});

function fail(code,message=code){const error=new Error(message);error.code=code;throw error;}
function slotIndex(slot){if(!Number.isInteger(slot)||slot<0||slot>2)fail('invalid-slot','Weapon slot must be 0, 1 or 2');return slot;}
function immutable(state){return Object.freeze({...state,slots:Object.freeze([...state.slots]),skins:Object.freeze([...state.skins])});}

function validate(state,{catalog=WEAPON_CHOICES,isDisabled=()=>false}={}){
 if(!Array.isArray(state?.slots)||state.slots.length!==3)fail('invalid-slots','Exactly three explicit weapon slots are required');
 const skins=state.skins??state.slots.map(weapon=>weapon===null?null:'classic');
 if(!Array.isArray(skins)||skins.length!==3)fail('invalid-skins','Exactly three skin slots are required');
 const seen=new Set();
 const slots=state.slots.map((weapon,index)=>{
  if(weapon===null){if(skins[index]!==null)fail('empty-slot-skin','An empty slot cannot have a skin');return null;}
  if(typeof weapon!=='string'||!Object.hasOwn(catalog,weapon))fail('unknown-weapon','Unknown weapon: '+String(weapon));
  if(catalog[weapon].disabled===true||isDisabled(weapon,skins[index])===true)fail('weapon-disabled','Weapon unavailable: '+weapon);
  if(typeof skins[index]!=='string'||!Object.hasOwn(catalog[weapon].skins??{},skins[index]))fail('unknown-skin','Unknown skin for '+weapon);
  if(seen.has(weapon))fail('weapon-already-equipped','This weapon is already equipped');
  seen.add(weapon);return weapon;
 });
 if(!seen.size)fail('last-weapon','Keep at least one equipped weapon');
 const activeSlot=slotIndex(state.activeSlot??slots.findIndex(Boolean));
 if(slots[activeSlot]===null)fail('empty-active-slot','The active slot must contain a weapon');
 return immutable({slots,skins:[...skins],activeSlot});
}

/** URL slots use "weapon:skin,-,-" and a one-based weaponSlot; API slots are zero-based. */
export function readS5WeaponLoadout(params,{weapon='dagger',weaponSkin='classic',catalog=WEAPON_CHOICES,isDisabled=()=>false}={}){
 if(!params||typeof params.get!=='function')fail('invalid-params','URL search parameters are required');
 const raw=params.get('weapons');
 if(raw===null){
  weapon=params.get('weapon')??weapon;weaponSkin=params.get('weaponSkin')??weaponSkin;
  return validate({slots:[weapon,null,null],skins:[weaponSkin,null,null],activeSlot:0},{catalog,isDisabled});
 }
 const parts=raw.split(',');if(parts.length!==3)fail('invalid-slots','The weapons parameter must contain three slots');
 const slots=[],skins=[];
 for(const part of parts){
  if(part==='-'){slots.push(null);skins.push(null);continue;}
  const fields=part.split(':');if(fields.length!==2||!fields[0]||!fields[1])fail('invalid-slot-format','Use weapon:skin or - for an empty slot');
  slots.push(fields[0]);skins.push(fields[1]);
 }
 const rawActive=params.get('weaponSlot');
 if(rawActive!==null&&!/^[123]$/.test(rawActive))fail('invalid-slot','The weaponSlot parameter must be 1, 2 or 3');
 return validate({slots,skins,activeSlot:rawActive===null?slots.findIndex(Boolean):Number(rawActive)-1},{catalog,isDisabled});
}

export function writeS5WeaponLoadoutUrl(input,state,{catalog=WEAPON_CHOICES,isDisabled=()=>false}={}){
 const checked=validate(state,{catalog,isDisabled});let url;
 try{url=new URL(String(input));}catch{fail('invalid-url','An absolute game URL is required');}
 if(!['http:','https:'].includes(url.protocol))fail('invalid-url','A game URL must use HTTP or HTTPS');
 url.searchParams.set('weapons',checked.slots.map((weapon,index)=>weapon===null?'-':`${weapon}:${checked.skins[index]}`).join(','));
 url.searchParams.set('weaponSlot',String(checked.activeSlot+1));
 url.searchParams.set('weapon',checked.slots[checked.activeSlot]);
 url.searchParams.set('weaponSkin',checked.skins[checked.activeSlot]);
 return url;
}

/** The apply port must acknowledge the real runtime operation with accepted:true.
 * During pending, slots/skins/activeSlot/revision remain the last confirmed state.
 * The port receives an AbortSignal so disposal can cancel a queued runtime switch.
 */
export function createS5WeaponLoadout({initial={weapon:'dagger',weaponSkin:'classic'},catalog=WEAPON_CHOICES,isDisabled=()=>false,canEdit:guard=()=>true,apply,onChange=()=>{}}={}){
 const options={catalog,isDisabled};
 let confirmed=validate(initial.slots?initial:{slots:[initial.weapon??'dagger',null,null],skins:[initial.weaponSkin??'classic',null,null],activeSlot:0},options);
 let revision=0,requestId=0,pending=null,error=null,status='confirmed',disposed=false,notificationError=null;
 function snapshot(){return immutable({...confirmed,revision,pending:pending!==null,status,error,proposal:pending?.proposal??null,notificationError});}
 function publish(){try{onChange(snapshot());notificationError=null;}catch(reason){notificationError=String(reason?.message??reason);}}
 function denied(reason,message=reason){error=Object.freeze({reason,message});status='rejected';publish();return {accepted:false,reason,error,snapshot:snapshot()};}
 function canEdit(reason='assign',proposal=null){
  if(disposed||pending)return false;
  try{const result=guard(reason,proposal);return result!==false&&result?.accepted!==false;}catch{return false;}
 }
 async function transact(reason,slot,build){
  if(disposed)return {accepted:false,reason:'disposed',snapshot:snapshot()};
  if(pending)return {accepted:false,reason:'pending',snapshot:snapshot()};
  let next;
  try{slotIndex(slot);next=validate(build(),options);}catch(reason){return denied(reason.code??'invalid-loadout',reason.message);}
  if(!canEdit(reason,next))return denied('runtime-busy','The runtime cannot change this loadout now');
  if(next.activeSlot===confirmed.activeSlot&&next.slots.every((weapon,index)=>weapon===confirmed.slots[index]&&next.skins[index]===confirmed.skins[index]))return {accepted:true,changed:false,snapshot:snapshot()};
  if(typeof apply!=='function')return denied('runtime-port-unavailable','The runtime loadout port is unavailable');
  const previous=snapshot(),id=++requestId,controller=new AbortController();
  const proposal=immutable({...next,requestId:id,reason,revision:revision+1});
  pending={id,controller,proposal};error=null;status='pending';publish();
  try{
   const response=await apply(proposal,{previous,requestId:id,reason,signal:controller.signal});
   if(disposed||pending?.id!==id)return {accepted:false,reason:'disposed',snapshot:snapshot()};
   pending=null;
   if(response?.accepted!==true)return denied(response?.reason??'runtime-rejected',response?.message??'The runtime did not confirm this loadout');
   confirmed=next;revision++;error=null;status='confirmed';publish();
   return {accepted:true,changed:true,revision,snapshot:snapshot()};
  }catch(reason){
   if(disposed||pending?.id!==id)return {accepted:false,reason:'disposed',snapshot:snapshot()};
   pending=null;return denied(reason?.code??'runtime-failed',String(reason?.message??reason));
  }
 }
 const select=slot=>transact('select',slot,()=>({...confirmed,activeSlot:slot}));
 return {
  snapshot,canEdit,
  canRemove(slot){return Number.isInteger(slot)&&slot>=0&&slot<3&&confirmed.slots[slot]!==null&&confirmed.slots.filter(Boolean).length>1;},
  assign(slot,weapon,weaponSkin='classic'){return transact('assign',slot,()=>{const slots=[...confirmed.slots],skins=[...confirmed.skins];slots[slot]=weapon;skins[slot]=weaponSkin;return {...confirmed,slots,skins};});},
  remove(slot){return transact('remove',slot,()=>{const slots=[...confirmed.slots],skins=[...confirmed.skins];slots[slot]=null;skins[slot]=null;return {slots,skins,activeSlot:confirmed.activeSlot===slot?slots.findIndex(Boolean):confirmed.activeSlot};});},
  select,activate:select,
  toUrl(url){return writeS5WeaponLoadoutUrl(url,confirmed,options);},
  dispose(){if(disposed)return;disposed=true;pending?.controller.abort();pending=null;error=null;status='confirmed';},
 };
}
