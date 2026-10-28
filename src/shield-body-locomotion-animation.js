// Source62BD80/629880/62C310/62C390 command plans. Native channel numbers,
// not renderer bone masks. Caller must qualify the actual consumers.
const f=Math.fround;
const u32=(v,name)=>{if(!Number.isInteger(v)||v<0||v>0xffffffff)throw new TypeError(`${name} uint32 required`);return v;};
const finite=(v,name)=>{if(!Number.isFinite(v))throw new TypeError(`${name} finite required`);return f(v);};
export function shieldGroundAnimationCommands({phase,allChannels,normalBlendMs,speedNative,gameTempo16}={}){
 if(!Number.isInteger(phase)||phase<0||phase>9||typeof allChannels!=='boolean')throw new TypeError('Explicit ground phase0..9/allChannels required');
 u32(normalBlendMs,'ground+24');
 if(phase===9)return []; //62BD80 has no branch for freshly-entered phase9
 const channels=allChannels?[1,0,3,4,5]:[1];
 if(phase===0)return channels.map(channel=>({method:'B77CB0',animationIndex:0,channel,argument:normalBlendMs,weight:1,extra:0,source:'62BD80 phase0'}));
 const speed=finite(speedNative,'selected actor speed'),denominator=finite(gameTempo16,'GameTempo16');
 if(denominator===0)throw new RangeError('Zero native animation speed denominator unsupported');
 const ratio=f(speed/denominator);
 return channels.map(channel=>({method:'B78580',animationIndex:phase,channel,argument:ratio,weight:1,source:'62BD80 moving phase speed/GameTempo16'}));
}
export function shieldAirAnimationCommands({phase,active,animationDurationMs,launchDurationMs,landingDurationMs}={}){
 if(!Number.isInteger(phase)||phase<0||phase>3||typeof active!=='boolean')throw new TypeError('Air phase/active required');
 for(const [key,v] of Object.entries({animationDurationMs,launchDurationMs,landingDurationMs}))u32(v,key);
 if(!active)return [];
 return [{method:'B77CB0',animationIndex:phase,channel:1,argument:phase===0?launchDurationMs:phase===3?landingDurationMs:animationDurationMs,weight:1,extra:0,source:'629880'}];
}
export function shieldGroundPostCounter({channelPresent,channel30Ticks}={}){
 if(typeof channelPresent!=='boolean')throw new TypeError('Explicit channel1 presence required');
 if(!channelPresent)return 0;
 u32(channel30Ticks,'native channel1+30');
 //62C310 unsigned source ticks→f32 /4.8→FE6050 truncation→uint32+200→mod333
 const quotient=f(f(channel30Ticks)/f(4.8));
 if(quotient>0xffffffff)throw new RangeError('Conversion outside supported uint32 range');
 return ((Math.trunc(quotient)+200)>>>0)%333;
}
export function shieldGroundPostEvent({previousCounter,nextCounter,phase,actorMode114}={}){
 u32(previousCounter,'previous post counter');u32(nextCounter,'next post counter');
 if(!Number.isInteger(phase)||!Number.isInteger(actorMode114))throw new TypeError('Explicit phase and actor mode required');
 return {emit:previousCounter>nextCounter&&phase!==0&&phase<9&&actorMode114===0,nextCounter,source:'62C390',nativeReady:false};
}
