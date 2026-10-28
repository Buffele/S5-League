// Native Shield Enter/Leave ports; each host implementation declares provenance.
const u32=n=>Number.isInteger(n)&&n>=0&&n<=0xffffffff;
export function shieldCompletionDuration({sourceDuration,activationDuration,animationDuration}){
 if(![sourceDuration,activationDuration,animationDuration].every(u32))throw Error('Explicit uint32 body timer durations required');
 let duration=sourceDuration;
 if(duration<activationDuration)duration=(activationDuration+1)>>>0;
 if(duration<animationDuration)duration=(animationDuration+1)>>>0;
 return duration;
}
function validate(ports,names){for(const name of names)if(typeof ports[name]!=='function'||typeof ports.provenance?.[name]!=='string'||!ports.provenance[name].trim())throw Error('Explicit lifecycle port/provenance required: '+name);}
function callSync(ports,name,...args){const result=ports[name](...args);if(typeof result?.then==='function')throw Error('Shield lifecycle port must return synchronously: '+name);return result;}
export function enterShieldBodyLifecycle(state,{weaponType,sourceDuration,activationDuration,animationDuration,actorPosition},ports={}){
 const names=['baseEnter','initializeBodyFields','playBodyEntry','lowerEnter','createBodyAudio'];validate(ports,names);
 if(state.entered)throw Error('Shield body already entered');
 if(!Number.isInteger(weaponType)||!Array.isArray(actorPosition)||actorPosition.length!==3||!actorPosition.every(Number.isFinite))throw Error('Explicit native weapon type and actorSlot7C position required');
 const duration=shieldCompletionDuration({sourceDuration,activationDuration,animationDuration});
 callSync(ports,'baseEnter');callSync(ports,'initializeBodyFields');callSync(ports,'playBodyEntry');callSync(ports,'lowerEnter',weaponType);
 state.completionDurationMs=duration;state.completionElapsedMs=0;
 const audioHandle=callSync(ports,'createBodyAudio',{sourceLiteral:'Resources/Sound/defense_on.ogg',actorPosition:[...actorPosition],nativeCreateFunction:'5635A0',nativeBodyHandleOffset:'17C'});
 if(audioHandle===undefined)throw Error('Explicit body audio handle (or null) required');
 state.audioHandle=audioHandle;
 state.entered=true;return {entered:true,completionDurationMs:duration,nativeReady:false};
}
export function leaveShieldBodyLifecycle(state,ports={}){
 const names=['baseLeave','lowerLeave','destroyBodyAudio','restoreEquipmentModels'];validate(ports,names);
 if(!state.entered)return {left:false,nativeReady:false};
 callSync(ports,'baseLeave');callSync(ports,'lowerLeave');
 if(state.audioHandle!==null&&state.audioHandle!==0)callSync(ports,'destroyBodyAudio',state.audioHandle);
 state.audioHandle=null;callSync(ports,'restoreEquipmentModels');state.entered=false;
 return {left:true,nativeReady:false};
}
