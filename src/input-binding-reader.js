import {validBindingCode} from './input-bindings.js';
// Semantic input reader. The caller explicitly declares routed commands.
// It never calls Controller, consumes SP or toggles components itself.
export function createBindingInputReader(bindings,{activeIds=[],nativeSprintGesture=false}={}){
 const active=new Set(activeIds),physical=new Set(),pressed=new Map();let queue=[],disposed=false,lastForwardDown=null,sprinting=false,lastTime=0;
 const enqueue=(command,edge,code,time,extra={})=>{
  const binding=bindings.get(command);const nativeInputCode=edge==='press'?binding.pressCode:edge==='release'?binding.releaseCode:null;
  const event=Object.freeze({command,edge,code,time,bindingRevision:binding.revision,nativeInputCode,synthetic:false,...extra});queue.push(event);return event;
 };
 function cancelCommands(ids,reason,time=lastTime){
  for(const [code,command] of [...pressed])if(ids.has(command)){pressed.delete(code);enqueue(command,'cancel',code,time,{synthetic:true,reason,nativeInputCode:null});}
  if(ids.has('forward')){lastForwardDown=null;if(sprinting){queue.push(Object.freeze({command:'sprint',edge:'cancel',nativeInputCode:null,synthetic:true,reason,time}));sprinting=false;}}
 }
 const unsubscribe=bindings.subscribe(event=>cancelCommands(new Set(event.changes),'remapped'));
 function down(code,time,{repeat=false}={}){
  if(disposed||repeat||physical.has(code)||!validBindingCode(code))return false;if(!Number.isFinite(time)||time<0)throw Error('Input time must be nonnegative and finite');lastTime=time;physical.add(code);
  const commands=bindings.commandsFor(code).filter(id=>active.has(id));if(commands.length!==1)return false;
  const command=commands[0];pressed.set(code,command);enqueue(command,'press',code,time);
  if(command==='forward'&&nativeSprintGesture){
   if(lastForwardDown!==null&&time>=lastForwardDown&&time-lastForwardDown<=500){sprinting=true;queue.push(Object.freeze({command:'sprint',edge:'press',code,time,nativeInputCode:42,synthetic:false}));}
   lastForwardDown=time;
  }return true;
 }
 function up(code,time){
  if(disposed)return false;if(!Number.isFinite(time)||time<0)throw Error('Input time must be nonnegative and finite');lastTime=time;physical.delete(code);
  const command=pressed.get(code);if(!command)return false;pressed.delete(code);enqueue(command,'release',code,time);
  if(command==='forward'&&sprinting){sprinting=false;queue.push(Object.freeze({command:'sprint',edge:'release',code,time,nativeInputCode:43,synthetic:false}));}return true;
 }
 return Object.freeze({down,up,
  pulse(code,time){const accepted=down(code,time);up(code,time);return accepted;},
  isHeld(command){return [...pressed.values()].includes(command);},
  movement(){const held=command=>Number([...pressed.values()].includes(command));return {forward:held('forward')-held('backward'),side:held('right')-held('left'),sprint:sprinting};},
  sample(){const events=queue;queue=[];return events;},
  clear(reason='diagnostic-clear',time=lastTime){cancelCommands(new Set(pressed.values()),reason,time);physical.clear();lastForwardDown=null;},
  setActive(ids){const next=new Set(ids);cancelCommands(new Set([...active].filter(id=>!next.has(id))),'route-disabled');active.clear();for(const id of next)active.add(id);},
  dispose(){if(disposed)return;cancelCommands(new Set(pressed.values()),'disposed');physical.clear();unsubscribe();disposed=true;},
 });
}
