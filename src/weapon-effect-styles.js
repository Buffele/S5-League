import {EXTRA_MELEE_EFFECTS,extraMeleeAttack} from './melee-art-catalog.js';
// S5 artistic alternatives. They never change animation clocks or hit volumes.
const attack=(id,label,code,names)=>Object.freeze({id,label,code,choices:Object.freeze([...names.map((name,index)=>Object.freeze({id:'ABC'[index],name})),Object.freeze({id:'F',name:'Flame'})])});
export const WEAPON_EFFECT_STYLES=Object.freeze({
 ...Object.fromEntries(Object.entries(EXTRA_MELEE_EFFECTS).map(([weapon,entry])=>[weapon,Object.freeze(entry.rows.map(([id,label],index)=>attack(id,label,entry.code+(index+1),entry.names)))])),
 dagger:Object.freeze([
  attack('cut','Left click · slash','D1',['Razor Thread','Spectral Shift','Distortion']),
  attack('rush','Right click · rush','D2',['Razor Thread','Spectral Shift','Distortion']),
 ]),
 counter:Object.freeze([
  attack('combo','Left click · combo','C1',['Brutal Edge','Metallic Echoes','Pressurized Energy']),
  attack('power','Hold left · power strike','C2',['Ion Edge','Spectral Flame','Flowing Aegis']),
  attack('guard','Guard','C3',['Brutal Edge','Metallic Echoes','Pressurized Energy']),
  attack('air','Air attack','C4',['Brutal Edge','Metallic Echoes','Pressurized Energy']),
 ]),
 plasma:Object.freeze([
  attack('combo','Left click · combo','P1',['Plasma Ribbons','Afterimage Blade','Living Plasma']),
  attack('power','Hold left · power strike','P2',['Plasma Edge','Astral Flame','Living Current']),
  attack('air','Air attack · stun','P3',['Plasma Ribbons','Afterimage Blade','Living Plasma']),
  attack('rush','Right click · rush','P4',[]),
 ]),
 bat:Object.freeze([
  attack('strike','Primary strike','B1',['Heavy Impact','Storm Wind','Future Sport']),
  attack('spin','Right click · spin','B2',['Heavy Impact','Storm Wind','Future Sport']),
  attack('air','Air attack','B3',['Heavy Impact','Storm Wind','Future Sport']),
 ]),
});
export function weaponEffectAttack(weapon,attack){
 if(!attack)return null;const kind=attack.kind??attack.type;
 if(weapon==='dagger')return kind==='rush'?'rush':['light','air','cut'].includes(kind)?'cut':null;
 if(weapon==='counter')return kind==='light'?'combo':kind==='heavy'?'power':['air','guard'].includes(kind)?kind:null;
 if(weapon==='plasma')return kind==='light'?'combo':['strong','strongFollow'].includes(kind)?'power':kind==='air'?'air':kind==='heavy'?'rush':null;
 if(weapon==='bat')return ['light','strong','strong2'].includes(kind)?'strike':kind==='air'?'air':kind==='heavy'||kind?.startsWith('spin')?'spin':null;
 return extraMeleeAttack(weapon,kind);
}
const valid=(weapon,attack,style)=>WEAPON_EFFECT_STYLES[weapon]?.some(row=>row.id===attack&&(style==='original'||row.choices.some(choice=>choice.id===style)));
export const WEAPON_EFFECT_STORAGE_KEY='s5.weapon-effects.v1';
export const WEAPON_AURA_DEFAULTS=Object.freeze({size:1,intensity:1,alwaysActive:false,color:'#397dff'});
const auraValue=(key,value)=>key==='color'?typeof value==='string'&&/^#[0-9a-f]{6}$/i.test(value)?value.toLowerCase():WEAPON_AURA_DEFAULTS.color:key==='alwaysActive'?value===true:Number.isFinite(Number(value))?Math.max(key==='size'?.25:0,Math.min(key==='size'?3:2.5,Number(value))):WEAPON_AURA_DEFAULTS[key];
export function createWeaponEffectSettings({storage=null,overrides='',onChange=()=>{}}={}){
 let selections={},aura={...WEAPON_AURA_DEFAULTS},revision=0;const listeners=new Set();
 const accept=data=>{if(!data||typeof data!=='object'||Array.isArray(data))return;if(data.$aura)for(const key of Object.keys(WEAPON_AURA_DEFAULTS))if(data.$aura[key]!==undefined)aura[key]=auraValue(key,data.$aura[key]);for(const [weapon,actions]of Object.entries(data))if(WEAPON_EFFECT_STYLES[weapon]&&actions&&typeof actions==='object')for(const [action,style]of Object.entries(actions))if(valid(weapon,action,style))(selections[weapon]??={})[action]=style;};
 try{accept(JSON.parse(storage?.getItem(WEAPON_EFFECT_STORAGE_KEY)??'null'));}catch{/* An unavailable browser store must not prevent play. */}
 for(const token of overrides.split(',')){const [weapon,action,style]=token.split('.');if(valid(weapon,action,style))(selections[weapon]??={})[action]=style;}
 const snapshot=()=>({revision,selections:structuredClone(selections),aura:{...aura}});
 const notify=persist=>{revision++;try{if(persist)storage?.setItem(WEAPON_EFFECT_STORAGE_KEY,JSON.stringify({...selections,$aura:aura}));}catch{/* Keep this session usable when storage is full or disabled. */}const value=snapshot();onChange(value);for(const fn of listeners)fn(value);return true;};
 return {get:(weapon,action)=>selections[weapon]?.[action]??'original',getAura:()=>({...aura}),snapshot,
  set(weapon,action,style,{persist=true}={}){if(!valid(weapon,action,style))throw new RangeError('Unknown weapon effect selection');if((selections[weapon]?.[action]??'original')===style)return false;
   (selections[weapon]??={})[action]=style;return notify(persist);
  },setAura(values,{persist=true}={}){const next={...aura};for(const key of Object.keys(WEAPON_AURA_DEFAULTS))if(values[key]!==undefined)next[key]=auraValue(key,values[key]);if(Object.keys(next).every(key=>next[key]===aura[key]))return false;aura=next;return notify(persist);},subscribe(fn){listeners.add(fn);return ()=>listeners.delete(fn);},
 };
}

export function replacesSelectedWeaponTrail(avatar,attack){const selected=selectedWeaponEffect(avatar,attack);return !!selected&&selected.style!=='F';}

export function selectedWeaponEffect(avatar,attack,{replacementOnly=false}={}){
 const weapon=attack?.weapon??avatar?.weapon??'dagger',action=weaponEffectAttack(weapon,attack);
 const style=action?avatar?.group?.userData?.weaponEffectSettings?.get(weapon,action)??'original':'original';
 return style==='original'||replacementOnly&&style==='F'?null:{weapon,action,style,code:WEAPON_EFFECT_STYLES[weapon].find(row=>row.id===action).code+'-'+style};
}
