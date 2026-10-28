import {MovementInput} from './input.js';
import {createInputBindings,bindingCodeLabel} from './input-bindings.js';
import {createBindingInputReader} from './input-binding-reader.js';
import {WEAPON_SLOTS} from './weapon-slots.js';

// These are actual routed commands, not a declaration that all 19 native
// commands (or a native three-weapon loadout) are implemented in S5.
export const GAME_INPUT_COMMANDS=Object.freeze(['forward','backward','left','right','jump','reload','weapon1','weapon2','weapon3']);
const canonical=Object.freeze({forward:'KeyW',backward:'KeyS',left:'KeyA',right:'KeyD',jump:'Space'});
const legacyAliases=new Set(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','AltLeft','AltRight']);
export const LEGACY_WEAPON_RESERVATIONS=Object.freeze(Object.entries(WEAPON_SLOTS).map(([code,weapon])=>Object.freeze({id:`s5-weapon-${weapon}`,label:`S5 diagnostic selection: ${weapon}`,code})));
export const GAME_INPUT_RESERVATIONS=Object.freeze([
 ...[['MouseButton0','primary','Primary attack'],['MouseButton2','secondary','Secondary attack'],['MouseButton1','camera','Camera rotation'],['F2','workshop','Workshop'],['F3','style','Sprint style'],['F4','energy','Infinite energy'],['Tab','roster','Scoreboard'],['Escape','menu','Menu'],['Enter','room-return','Return to waiting room'],['ArrowUp','forward','Move forward (S5 alias)'],['ArrowDown','backward','Move back (S5 alias)'],['ArrowLeft','left','Move left (S5 alias)'],['ArrowRight','right','Move right (S5 alias)'],['AltLeft','rapid-left','S5 quick jump'],['AltRight','rapid-right','S5 quick jump']].map(([code,id,label])=>({id:`s5-${id}`,label,code})),
].map(Object.freeze));
export function gameInputReservations({legacyWeaponShortcuts=false}={}){
 if(!legacyWeaponShortcuts)return GAME_INPUT_RESERVATIONS;
 // Slot 1/2/3 remain semantic even in QA. Other direct equipment shortcuts
 // are diagnostics only and cannot escape the normal three-slot loadout.
 return Object.freeze([...GAME_INPUT_RESERVATIONS,...LEGACY_WEAPON_RESERVATIONS.filter(row=>!['Digit1','Digit2','Digit3'].includes(row.code))]);
}

export function createGameInputBindings({storage=null,layoutMap=null,initial=null,legacyWeaponShortcuts=false}={}){
 return createInputBindings({storage,initial,externalBindings:gameInputReservations({legacyWeaponShortcuts}),
  formatCodeLabel(code){const label=layoutMap?.get(code);return label?.trim()?label.toLocaleUpperCase():bindingCodeLabel(code);},
 });
}

export function gameInputHint(bindings){
 const key=id=>bindings.get(id).bindingLabel;
 return `${key('forward')} / ${key('left')} / ${key('backward')} / ${key('right')} : movement · ${key('jump')} : jump / dodge · double-tap ${key('forward')} : sprint · ${key('reload')} : reload a firearm`;
}

// Translate the one shared binding registry to the existing, tested movement
// semantics. There is one reader and one Controller simulation, no second
// sprint producer. Arrow/Alt shortcuts remain explicitly reserved S5 aliases.
export class BoundMovementInput extends MovementInput{
 constructor(bindings,{onEdge=null}={}){
  super();this.bindings=bindings;this.onBindingEdge=onEdge;
  this.bindingReader=createBindingInputReader(bindings,{activeIds:GAME_INPUT_COMMANDS,nativeSprintGesture:false});
  this.unsubscribeBindings=bindings.subscribe(()=>this.drainBindingEdges());
 }
 commandFor(code){return this.bindings.commandsFor(code).find(id=>GAME_INPUT_COMMANDS.includes(id))??null;}
 handles(code){return legacyAliases.has(code)||this.commandFor(code)!==null;}
 drainBindingEdges(){
  for(const event of this.bindingReader.sample()){
   if(event.edge==='cancel'){
    if(event.command==='reload')delete this.pending.reload;
    else{
     const code=canonical[event.command];if(code)super.keyUp(code,event.time/1000);
      if(event.command==='jump'){delete this.pending.jump;delete this.pending.jumpPressedAt;}
     if(event.command==='forward'){
      delete this.pending.forwardPressed;delete this.pending.sprintPressed;
      this.lastForwardTap=-Infinity;this.airSprintArmed=false;this.autoSprintUntil=-Infinity;
     }
    }
   }else if(event.command==='reload'){
    if(event.edge==='press')this.pending.reload=true;
   }else{
    const code=canonical[event.command];
    if(code){if(event.edge==='press')super.keyDown(code,event.time/1000,false);
     else super.keyUp(code,event.time/1000);}
   }
   this.onBindingEdge?.(event);
  }
 }
 keyDown(code,time,repeat=false){
  if(legacyAliases.has(code)){super.keyDown(code,time,repeat);return true;}
  const handled=this.commandFor(code)!==null;
  this.bindingReader.down(code,time*1000,{repeat});this.drainBindingEdges();return handled;
 }
 keyUp(code,time=performance.now()/1000){
  if(legacyAliases.has(code)){super.keyUp(code,time);return true;}
  const released=this.bindingReader.up(code,time*1000);this.drainBindingEdges();return released;
 }
 pulse(code,time=performance.now()/1000){const accepted=this.bindingReader.pulse(code,time*1000);this.drainBindingEdges();return accepted;}
 sample(facing,time=performance.now()/1000){this.drainBindingEdges();return super.sample(facing,time);}
 clear(){this.bindingReader?.clear('game-input-clear');this.bindingReader?.sample();super.clear();}
 dispose(){this.clear();this.unsubscribeBindings();this.bindingReader.dispose();}
}
